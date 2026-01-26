import z from "zod";

export const SignupSchema = z
    .object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(4),
        role: z.enum(["customer", "owner"]),
        phone: z.string().min(10).max(13),
    })
    .strict();

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4),
});
