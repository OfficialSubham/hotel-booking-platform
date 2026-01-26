import { Errback, NextFunction, Request, Response } from "express";

export const globalErrorHandler = (
    err: Errback,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    console.log(err);
    return res
        .status(500)
        .json({ succes: false, data: null, error: "Internal server error" });
};
