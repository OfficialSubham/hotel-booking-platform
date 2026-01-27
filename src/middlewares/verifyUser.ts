import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "";

const { verify } = jwt;

export const verifyUser = (req: Request, res: Response, next: NextFunction) => {
    const { Authorization } = req.headers as { Authorization: string };
    const token = Authorization.split(" ")[1];
    try {
        const data = verify(token, JWT_SECRET) as JwtData;
        req.userId = data.userId;
        req.userRole = data.role;
        req.userEmail = data.email;
        req.userName = data.name;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ success: false, data: null, error: "UNAUTHORIZED" });
    }
};
