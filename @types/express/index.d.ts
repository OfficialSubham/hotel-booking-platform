import type { Request } from "express";
type Role = "customer" | "owner";

declare global {
    namespace Express {
        interface Request {
            userId: number;
            userName: string;
            userRole: Role;
            userEmail: string;
        }
    }
}
