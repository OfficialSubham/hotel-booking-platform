import { NextFunction, Request, Response } from "express";

export const requireRole = (role: Role) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.userRole != role)
            return res
                .status(403)
                .json({ success: false, data: null, error: "FORBIDDEN" });
        next();
    };
};
