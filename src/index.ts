import "dotenv/config";

import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { compare, hash } from "bcryptjs";
import { LoginSchema, SignupSchema } from "./schema/UserSchema";
import { prisma } from "./db/db";
import jwt from "jsonwebtoken";
import { verifyUser } from "./middlewares/verifyUser";
import { requireRole } from "./middlewares/requireRole";
import {
    BookingSchema,
    HotelIdSchema,
    HotelQueryParameters,
    HotelSchema,
    RoomSchema,
} from "./schema/HotelSchema";
import { substractDates } from "./libs/utils";

const { sign } = jwt;

const SALT = 10;
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ success: true, data: { message: "working" } });
});

app.post("/api/auth/signup", async (req, res) => {
    try {
        const { success, data, error } = SignupSchema.safeParse(req.body);
        if (!success) {
            return res
                .status(400)
                .json({ success, data: null, error: "INVALID_REQUEST" });
        }
        const hashPassword = await hash(data.password, SALT);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashPassword,
                phone: data.phone,
                role: data.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
            },
        });

        res.status(201).json({ success, data: { ...user }, error: null });
    } catch (error) {
        res.status(400).json({
            success: false,
            data: null,
            error: "EMAIL_ALREADY_EXISTS",
        });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { success, data } = LoginSchema.safeParse(req.body);
    if (!success)
        return res.status(400).json({ success, data: null, error: "INVALID_REQUEST" });

    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
        },
    });
    if (!user)
        return res
            .status(400)
            .json({ success: false, data: null, error: "INVALID_CREDENTIALS" });
    const isPasswordCorrect = await compare(data.password, user.password);
    if (!isPasswordCorrect)
        return res
            .status(401)
            .json({ success: false, data: null, error: "INVALID_CREDENTIALS" });
    const token = sign(
        { userId: user.id, name: user.name, email: user.email, role: user.role },
        JWT_SECRET,
    );
    res.json({
        success,
        data: {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        },
        error: null,
    });
});

app.post("/api/hotels", verifyUser, requireRole("owner"), async (req, res) => {
    const { success, data } = HotelSchema.safeParse(req.body);
    if (!success)
        return res.status(400).json({ success, data: null, error: "INVALID_SCHEMA" });

    const hotel = await prisma.hotels.create({
        data: {
            ...data,
            owner_id: req.userId,
        },
    });
    res.status(201).json({
        success,
        data: {
            id: hotel.id,
            ownerId: hotel.owner_id,
            name: hotel.name,
            description: hotel.description,
            city: hotel.city,
            country: hotel.country,
            amenities: hotel.amenities,
            rating: hotel.rating,
            totalReviews: hotel.total_reviews,
        },
        error: null,
    });
});

app.post(
    "/api/hotels/:hotelId/rooms",
    verifyUser,
    requireRole("owner"),
    async (req, res) => {
        const { hotelId } = req.params;

        const { success, data } = RoomSchema.safeParse({
            ...req.body,
            hotelId: Number(hotelId),
        });
        if (!success)
            return res.status(400).json({
                success: false,
                data: null,
                error: "INVALID_REQUEST",
            });

        const hotel = await prisma.hotels.findUnique({
            where: {
                id: Number(hotelId),
            },
            include: {
                rooms: true,
            },
        });

        if (!hotel)
            return res.status(404).json({
                success: false,
                data: null,
                error: "HOTEL_NOT_FOUND",
            });
        else if (hotel.owner_id != req.userId)
            return res.status(403).json({
                success: false,
                data: null,
                error: "FORBIDDEN",
            });

        const roomExisted = hotel.rooms.filter((r) => r.room_number == data.roomNumber);

        if (roomExisted[0])
            return res.status(400).json({
                success: false,
                data: null,
                error: "ROOM_ALREADY_EXISTS",
            });
        const newRoom = await prisma.rooms.create({
            data: {
                room_number: data.roomNumber,
                room_type: data.roomType,
                price_per_night: data.pricePerNight,
                max_occupancy: data.maxOccupancy,
                hotel_id: data.hotelId,
            },
        });

        res.status(201).json({
            success: true,
            data: {
                id: newRoom.id,
                hotelId: hotel.id,
                roomNumber: newRoom.room_number,
                roomType: newRoom.room_type,
                pricePerNight: newRoom.price_per_night,
                maxOccupancy: newRoom.max_occupancy,
            },
            error: null,
        });
    },
);

app.get("/api/hotels", verifyUser, async (req, res) => {
    const { success, data } = HotelQueryParameters.safeParse(req.query);
    //Getting hotels with prefer querys
    const hotels = await prisma.hotels.findMany({
        where: {
            city: {
                equals: data?.city,
                mode: "insensitive",
            },
            country: {
                equals: data?.country,
                mode: "insensitive",
            },
            rating: {
                gte: data?.minRating,
            },
            rooms: {
                some: {},
            },
        },
        include: {
            rooms: true,
        },
    });

    if (!hotels.length)
        return res.json({
            success: true,
            data: [],
            error: null,
        });
    //Filtering hotels for the response
    let responseData = hotels.map((eachHotel) => {
        let minRoomPrice = Number.MAX_SAFE_INTEGER;
        eachHotel.rooms.forEach((r) => {
            minRoomPrice = Math.min(Number(r.price_per_night), minRoomPrice);
        });
        return {
            id: eachHotel.id,
            name: eachHotel.name,
            description: eachHotel.description,
            city: eachHotel.city,
            country: eachHotel.country,
            amenities: eachHotel.amenities,
            rating: eachHotel.rating,
            totalReviews: eachHotel.total_reviews,
            minPricePerNight: minRoomPrice,
        };
    });

    //Checking for Minimum price requirement for user
    if (data && data.minPrice != 0) {
        const miniPrice = data.minPrice || 0;
        responseData = responseData.filter(
            (eachHotel) => eachHotel.minPricePerNight >= miniPrice,
        );
    }

    //Checking for Maximum price requirement for user
    if (data && data.maxPrice != 0) {
        const maxPrice = data.maxPrice || Number.MAX_SAFE_INTEGER;
        responseData = responseData.filter(
            (eachHotel) => eachHotel.minPricePerNight <= maxPrice,
        );
    }

    return res.json({ success: true, data: responseData, error: null });
});

app.get("/api/hotels/:hotelId", verifyUser, async (req, res) => {
    const { hotelId } = req.params;
    const { success, data } = HotelIdSchema.safeParse(hotelId);
    if (!success)
        return res.status(404).json({
            success: false,
            data: null,
            error: "HOTEL_NOT_FOUND",
        });
    const hotel = await prisma.hotels.findUnique({
        where: {
            id: data,
        },
        omit: {
            created_at: true,
        },
        include: {
            rooms: {
                omit: {
                    hotel_id: true,
                    created_at: true,
                },
            },
        },
    });
    if (!hotel)
        return res.status(404).json({
            success: false,
            data: null,
            error: "HOTEL_NOT_FOUND",
        });
    const hotelRooms = hotel.rooms.map((r) => {
        return {
            id: r.id,
            roomNumber: r.room_number,
            roomType: r.room_type,
            pricePerNight: r.price_per_night,
            maxOccupancy: r.max_occupancy,
        };
    });
    return res.json({
        success: true,
        data: {
            id: hotel.id,
            ownerId: hotel.owner_id,
            name: hotel.name,
            description: hotel.description,
            city: hotel.city,
            country: hotel.country,
            amenities: hotel.amenities,
            rating: hotel.rating,
            totalReviews: hotel.total_reviews,
            rooms: hotelRooms,
        },
        error: null,
    });
});

app.post("/api/bookings", verifyUser, requireRole("customer"), async (req, res) => {
    const { data, success } = BookingSchema.safeParse(req.body);

    if (!success)
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_REQUEST",
        });

    const checkInDate = new Date(data.checkInDate);
    const checkOutDate = new Date(data.checkOutDate);
    const currentDate = new Date();
    //Checking for date validity
    if (
        data.checkInDate == data.checkOutDate ||
        checkInDate > checkOutDate ||
        checkInDate < currentDate ||
        checkOutDate < currentDate
    )
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_DATES",
        });

    const room = await prisma.rooms.findUnique({
        where: {
            id: data.roomId,
        },
        include: {
            bookings: true,
        },
    });

    if (!room)
        return res.status(404).json({
            success: false,
            data: null,
            error: "ROOM_NOT_FOUND",
        });
    else if (room.max_occupancy < data.guests)
        return res.status(400).json({
            success: false,
            data: null,
            error: "INVALID_CAPACITY",
        });
    let isRoomAvailable = true;
    room.bookings.forEach((booking) => {
        //If the booking is not cancelled then check
        if (booking.status != "cancelled") {
            if (checkInDate.getTime() == booking.check_in_date.getTime()) {
                //Exact checking date check
                isRoomAvailable = false;
                return;
            } else if (
                checkInDate.getTime() < booking.check_in_date.getTime() &&
                (checkOutDate.getTime() >= booking.check_out_date.getTime() ||
                    (checkOutDate.getTime() <= booking.check_out_date.getTime() &&
                        checkOutDate.getTime() >= booking.check_in_date.getTime()))
            ) {
                //Checking someone else's booking falls under my booking

                /*
                Here i am checking in this way 
                if my checking date is lesser than the booking date but my checkout date is falling under someone else's booking date
                */
                isRoomAvailable = false;
                return;
            } else if (
                checkInDate.getTime() > booking.check_in_date.getTime() &&
                checkInDate.getTime() <= booking.check_out_date.getTime() &&
                (checkOutDate.getTime() >= booking.check_out_date.getTime() ||
                    checkOutDate.getTime() < booking.check_out_date.getTime())
            ) {
                //Checking my booking falls under someone else's booking

                /*
                Here i am checking weather my booking is falling under someone else booking
                like if my cheking date is under someone else's booking and checkout date then doesnot matters then
                */

                isRoomAvailable = false;
                return;
            }
        }
    });

    if (!isRoomAvailable)
        return res.status(400).json({
            success: false,
            data: null,
            error: "ROOM_NOT_AVAILABLE",
        });
    const totalPrice =
        substractDates(checkInDate, checkOutDate) * Number(room.price_per_night);
    const roomBooking = await prisma.bookings.create({
        data: {
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            guests: data.guests,
            total_price: totalPrice,
            user_id: req.userId,
            room_id: room.id,
            hotel_id: room.hotel_id,
        },
        include: {
            hotel: true,
            room: true,
        },
    });
    res.status(200).json({
        success: true,
        data: [
            {
                id: roomBooking.id,
                roomId: roomBooking.room_id,
                hotelId: roomBooking.hotel_id,
                hotelName: roomBooking.hotel.name,
                roomNumber: roomBooking.room.room_number,
                roomType: roomBooking.room.room_type,
                checkInDate,
                checkOutDate,
                guests: roomBooking.guests,
                totalPrice,
                status: roomBooking.status,
                bookingDate: roomBooking.booking_date,
            },
        ],
        error: null,
    });
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Your app is listening in http://localhost:${PORT}`);
});
