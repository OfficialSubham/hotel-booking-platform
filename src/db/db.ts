import { PrismaPg } from "../../node_modules/@prisma/adapter-pg/dist/index";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
