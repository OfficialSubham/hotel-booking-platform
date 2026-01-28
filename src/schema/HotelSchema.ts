import z from "zod";

export const HotelSchema = z
    .object({
        name: z.string(),
        description: z.string(),
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
