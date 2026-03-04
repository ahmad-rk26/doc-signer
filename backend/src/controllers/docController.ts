import { Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import multer from "multer";
import { AuthRequest } from "../middleware/supabaseAuth";

const upload = multer({ storage: multer.memoryStorage() });

/* ================= UPLOAD DOCUMENT ================= */
export const uploadDocument = [
    upload.single("file"),
    async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const filePath = `${req.user.id}/${Date.now()}-${req.file.originalname}`;

            /* ⬆️ Upload to Supabase Storage */
            const { data, error } = await supabaseAdmin.storage
                .from("documents")
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true,
                });

            if (error) throw error;

            /* 🗄 Insert DB record */
            const { error: insertError } = await supabaseAdmin
                .from("documents")
                .insert({
                    user_id: req.user.id,
                    file_path: data.path,
                    status: "pending",
                });

            if (insertError) throw insertError;

            res.json({
                message: "Document uploaded successfully",
                path: data.path,
            });

        } catch (err: any) {
            console.error("Upload error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },
];

/* ================= LIST DOCUMENTS ================= */
export const listDocuments = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { data, error } = await supabaseAdmin
            .from("documents")
            .select("*")
            .eq("user_id", req.user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= GET SINGLE DOCUMENT ================= */
export const getDocument = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("documents")
            .select("*")
            .eq("id", id)
            .eq("user_id", req.user.id) // 🔐 extra protection
            .single();

        if (error) throw error;

        res.json(data);

    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= DELETE DOCUMENT ================= */
export const deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;

        const { data: doc, error: fetchError } = await supabaseAdmin
            .from("documents")
            .select("file_path, user_id")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        if (doc.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await supabaseAdmin.storage
            .from("documents")
            .remove([doc.file_path]);

        const { error: deleteError } = await supabaseAdmin
            .from("documents")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        res.json({ message: "Document deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= UPDATE DOCUMENT STATUS ================= */
export const updateDocumentStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!["pending", "signed", "cancelled"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const { data, error } = await supabaseAdmin
            .from("documents")
            .update({ status })
            .eq("id", id)
            .eq("user_id", req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= DOWNLOAD SIGNED DOCUMENT ================= */
export const downloadSignedDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { id } = req.params;

        const { data: doc, error } = await supabaseAdmin
            .from("documents")
            .select("file_path, user_id, status")
            .eq("id", id)
            .single();

        if (error) throw error;

        if (doc.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const signedPath = doc.file_path.replace(".pdf", "-signed.pdf");

        const { data: urlData, error: urlError } = await supabaseAdmin.storage
            .from("documents")
            .createSignedUrl(signedPath, 3600);

        if (urlError) throw urlError;

        res.json({ downloadUrl: urlData.signedUrl });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
