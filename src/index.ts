import "dotenv/config";

import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { hash } from "bcryptjs";
import { SignupSchema } from "./schema/UserSchema";
import { prisma } from "./db/db";

const SALT = 10;
const PORT = process.env.PORT || 3000;

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

app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Your app is listening in http://localhost:${PORT}`);
});
