import "dotenv/config";

import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { compare, hash } from "bcryptjs";
import { LoginSchema, SignupSchema } from "./schema/UserSchema";
import { prisma } from "./db/db";
import jwt from "jsonwebtoken";
import { verifyUser } from "./middlewares/verifyUser";
import { requireRole } from "./middlewares/requireRole";
import { HotelSchema } from "./schema/HotelSchema";

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
            console.log(error);
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

app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Your app is listening in http://localhost:${PORT}`);
});
