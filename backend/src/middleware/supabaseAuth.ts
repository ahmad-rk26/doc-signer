import { Request, Response, NextFunction } from "express";
import { supabasePublic } from "../config/supabase";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const verifySupabaseToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        console.log("🔐 Auth Header:", authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        console.log("🪪 Token received:", token?.slice(0, 20));

        const { data, error } =
            await supabasePublic.auth.getUser(token);

        if (error) {
            console.error("Supabase getUser error:", error);
            return res.status(401).json({
                error: "Invalid token",
            });
        }

        if (!data.user) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        req.user = {
            id: data.user.id,
            email: data.user.email ?? undefined,
        };

        console.log("Authenticated:", req.user.id);

        next();
    } catch (err) {
        console.error("Auth middleware crash:", err);
        return res.status(401).json({ error: "Unauthorized" });
    }
};