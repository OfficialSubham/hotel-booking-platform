type Role = "customer" | "owner";

interface JwtData {
    userId: number;
    name: string;
    email: string;
    role: Role;
}
