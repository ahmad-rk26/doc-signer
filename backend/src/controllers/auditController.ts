import { Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthRequest } from "../middleware/supabaseAuth";

export const getAudit = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { docId } = req.params;

        const { data, error } = await supabaseAdmin
            .from("audits")
            .select("*")
            .eq("document_id", docId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        res.json(data);

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};