import z from "zod";

export const HotelSchema = z
    .object({
        name: z.string(),
        description: z.string().optional(),
        city: z.string(),
        country: z.string(),
        amenities: z.string().array().optional(),
    })
    .strict();

export const RoomSchema = z
    .object({
        roomNumber: z.string(),
        roomType: z.string(),
        pricePerNight: z.number(),
        maxOccupancy: z.number(),
        hotelId: z.number(),
    })
    .strict();

export const HotelQueryParameters = z
    .object({
        city: z.string().optional(),
        country: z.string().optional(),
        minPrice: z.coerce.number().nonnegative().optional(),
        maxPrice: z.coerce.number().nonnegative().optional(),
        minRating: z.coerce.number().min(0).max(5).optional(),
    })
    .strict();

export const HotelIdSchema = z.coerce.number();

export const BookingSchema = z.object({
    roomId: z.coerce.number(),
    checkInDate: z.string().date(),
    checkOutDate: z.string().date(),
    guests: z.number(),
});

export const BookingStatus = z.enum(["confirmed", "cancelled"]).optional();

export const HotelReview = z
    .object({
        bookingId: z.coerce.number(),
        rating: z.number().gte(1).lte(5),
        comment: z.string().optional(),
    })
    .strict();
