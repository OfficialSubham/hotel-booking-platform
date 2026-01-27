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
