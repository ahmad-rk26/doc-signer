import { Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { PDFDocument } from "pdf-lib";
import { sendEmail } from "../utils/emailUtils";
import { AuthRequest } from "../middleware/supabaseAuth";
import { v4 as uuidv4 } from "uuid";

/* ================= GET SIGNATURES ================= */
export const getSignatures = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("signatures")
            .select("*")
            .eq("document_id", id);

        if (error) throw error;

        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= SHARE SIGN LINK ================= */
export const shareSigningLink = async (req: AuthRequest, res: Response) => {
    try {
        const { documentId, recipientEmail } = req.body;

        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        if (!documentId || !recipientEmail) {
            return res.status(400).json({ error: "Document ID and recipient email are required" });
        }

        const token = uuidv4();

        const { error } = await supabaseAdmin
            .from("signing_sessions")
            .insert({
                document_id: documentId,
                recipient_email: recipientEmail,
                token,
                expires_at: new Date(Date.now() + 7 * 86400000),
            });

        if (error) throw error;

        const link = `${process.env.FRONTEND_URL || process.env.FRONTEND_URL_PRODUCTION || 'http://localhost:3000'}/sign/${token}`;

        // Try to send email, but don't fail if email service is not configured
        try {
            await sendEmail(
                recipientEmail,
                "Document Signature Request",
                `Please sign the document:\n${link}`
            );
            console.log(`✅ Email sent successfully to ${recipientEmail}`);
            res.json({ message: "Signing link sent via email", link });
        } catch (emailError: any) {
            console.warn("Email sending failed:", emailError.message);
            // Return success with link even if email fails
            res.json({
                message: "Signing link created (email not sent - please configure email service)",
                link,
                warning: "Email service not configured"
            });
        }
    } catch (err: any) {
        console.error("Share signing link error:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ================= UPLOAD SIGNATURE IMAGE ================= */

export const uploadSignatureImage = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { image } = req.body;

        if (!image)
            return res.status(400).json({ error: "Image missing" });

        // Extract base64 data and detect format
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: "Invalid image format" });
        }

        const imageType = matches[1]; // png, jpeg, jpg, etc.
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Use appropriate extension
        const extension = imageType === 'jpeg' ? 'jpg' : imageType;
        const path = `${req.user.id}/${uuidv4()}.${extension}`;

        const { error } = await supabaseAdmin.storage
            .from("signatures")
            .upload(path, buffer, {
                contentType: `image/${imageType}`,
                upsert: true,
            });

        if (error) throw error;

        res.json({ signaturePath: path });
    } catch (err: any) {
        console.error("UPLOAD SIGNATURE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ================= SAVE SIGNATURE ================= */

export const saveSignature = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const {
            documentId,
            x,
            y,
            page,
            signaturePath,
            width,
            height,
        } = req.body;

        const { error } = await supabaseAdmin.from("signatures").insert({
            document_id: documentId,
            user_id: req.user.id,
            x,
            y,
            page,
            width,
            height,
            signature_image: signaturePath,
            status: "signed",
        });

        if (error) throw error;

        res.json({ message: "Signature saved" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= FINALIZE DOCUMENT ================= */

export const finalizeSignature = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { documentId } = req.body;

        const { data: doc } = await supabaseAdmin
            .from("documents")
            .select("file_path, user_id")
            .eq("id", documentId)
            .single();

        if (!doc)
            return res.status(404).json({ error: "Document not found" });

        if (doc.user_id !== req.user.id)
            return res.status(403).json({ error: "Forbidden" });

        const { data: sigs } = await supabaseAdmin
            .from("signatures")
            .select("*")
            .eq("document_id", documentId);

        const { data: pdfFile } = await supabaseAdmin.storage
            .from("documents")
            .download(doc.file_path);

        const pdfDoc = await PDFDocument.load(
            await pdfFile!.arrayBuffer()
        );

        for (const sig of sigs || []) {
            if (!sig.signature_image) continue;

            const { data: img } = await supabaseAdmin.storage
                .from("signatures")
                .download(sig.signature_image);

            // Detect image type from file extension
            const imageExt = sig.signature_image.split('.').pop()?.toLowerCase();
            const imageBuffer = await img!.arrayBuffer();

            let image;
            try {
                if (imageExt === 'jpg' || imageExt === 'jpeg') {
                    image = await pdfDoc.embedJpg(imageBuffer);
                } else {
                    image = await pdfDoc.embedPng(imageBuffer);
                }
            } catch (embedError: any) {
                console.error("Image embed error:", embedError.message);
                // Try the other format if first one fails
                try {
                    if (imageExt === 'jpg' || imageExt === 'jpeg') {
                        image = await pdfDoc.embedPng(imageBuffer);
                    } else {
                        image = await pdfDoc.embedJpg(imageBuffer);
                    }
                } catch (retryError: any) {
                    console.error("Both formats failed:", retryError.message);
                    continue;
                }
            }

            const page = pdfDoc.getPage(sig.page - 1);

            const correctedY =
                page.getHeight() - sig.y - sig.height;

            page.drawImage(image, {
                x: sig.x,
                y: correctedY,
                width: sig.width,
                height: sig.height,
            });
        }

        const signedPdf = await pdfDoc.save();

        const signedPath = doc.file_path.replace(
            ".pdf",
            "-signed.pdf"
        );

        await supabaseAdmin.storage
            .from("documents")
            .upload(signedPath, Buffer.from(signedPdf), {
                contentType: "application/pdf",
                upsert: true,
            });

        await supabaseAdmin
            .from("documents")
            .update({ status: "signed" })
            .eq("id", documentId);

        res.json({ message: "Document signed", signedPath });
    } catch (err: any) {
        console.error("FINALIZE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

/* ================= DELETE SIGNATURE ================= */
export const deleteSignature = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;

        const { data: sig, error: fetchError } = await supabaseAdmin
            .from("signatures")
            .select("signature_image, user_id")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        if (sig.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (sig.signature_image) {
            await supabaseAdmin.storage
                .from("signatures")
                .remove([sig.signature_image]);
        }

        const { error: deleteError } = await supabaseAdmin
            .from("signatures")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        res.json({ message: "Signature deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= GET SIGNING SESSIONS ================= */
export const getSigningSessions = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { documentId } = req.params;

        const { data: doc, error: docError } = await supabaseAdmin
            .from("documents")
            .select("user_id")
            .eq("id", documentId)
            .single();

        if (docError) throw docError;

        if (doc.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { data, error } = await supabaseAdmin
            .from("signing_sessions")
            .select("*")
            .eq("document_id", documentId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= REVOKE SIGNING SESSION ================= */
export const revokeSigningSession = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { token } = req.params;

        const { data: session, error: sessionError } = await supabaseAdmin
            .from("signing_sessions")
            .select("document_id")
            .eq("token", token)
            .single();

        if (sessionError) throw sessionError;

        const { data: doc, error: docError } = await supabaseAdmin
            .from("documents")
            .select("user_id")
            .eq("id", session.document_id)
            .single();

        if (docError) throw docError;

        if (doc.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const { error: deleteError } = await supabaseAdmin
            .from("signing_sessions")
            .delete()
            .eq("token", token);

        if (deleteError) throw deleteError;

        res.json({ message: "Signing session revoked successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= RESEND SIGNING LINK ================= */
export const resendSigningLink = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { token } = req.params;

        const { data: session, error: sessionError } = await supabaseAdmin
            .from("signing_sessions")
            .select("document_id, recipient_email")
            .eq("token", token)
            .single();

        if (sessionError) throw sessionError;

        const { data: doc, error: docError } = await supabaseAdmin
            .from("documents")
            .select("user_id")
            .eq("id", session.document_id)
            .single();

        if (docError) throw docError;

        if (doc.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const link = `${process.env.FRONTEND_URL || process.env.FRONTEND_URL_PRODUCTION || 'http://localhost:3000'}/sign/${token}`;

        try {
            await sendEmail(
                session.recipient_email,
                "Document Signature Request (Reminder)",
                `Please sign the document:\n${link}`
            );
            console.log(`✅ Reminder email sent to ${session.recipient_email}`);
            res.json({ message: "Signing link resent successfully" });
        } catch (emailError: any) {
            console.error("Failed to resend email:", emailError.message);
            res.status(500).json({ error: "Failed to send email" });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

/* ================= BULK SHARE SIGNING LINKS ================= */
export const bulkShareSigningLinks = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });

        const { documentId, recipients } = req.body;

        console.log("Bulk share request:", { documentId, recipients });

        if (!Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: "Recipients array required" });
        }

        const { data: doc, error: docError } = await supabaseAdmin
            .from("documents")
            .select("user_id")
            .eq("id", documentId)
            .single();

        if (docError) throw docError;

        if (doc.user_id !== req.user.id) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const sessions = [];
        const errors = [];

        for (const email of recipients) {
            try {
                const token = uuidv4();

                const { error } = await supabaseAdmin
                    .from("signing_sessions")
                    .insert({
                        document_id: documentId,
                        recipient_email: email,
                        token,
                        expires_at: new Date(Date.now() + 7 * 86400000),
                    });

                if (error) {
                    console.error(`Failed to create session for ${email}:`, error);
                    errors.push({ email, error: "Failed to create session" });
                    continue;
                }

                const link = `${process.env.FRONTEND_URL || process.env.FRONTEND_URL_PRODUCTION || 'http://localhost:3000'}/sign/${token}`;

                try {
                    await sendEmail(
                        email,
                        "Document Signature Request",
                        `Please sign the document:\n${link}`
                    );
                    console.log(`Email sent to ${email}`);
                    sessions.push({ email, token, link });
                } catch (emailError: any) {
                    console.error(`Failed to send email to ${email}:`, emailError.message);
                    // Still add to sessions even if email fails
                    sessions.push({ email, token, link, emailFailed: true });
                }
            } catch (err: any) {
                console.error(`Error processing ${email}:`, err);
                errors.push({ email, error: err.message });
            }
        }

        console.log(`Bulk share complete: ${sessions.length} sessions created, ${errors.length} errors`);

        res.json({
            message: `Signing links sent to ${sessions.length} recipients`,
            sessions,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err: any) {
        console.error("Bulk share error:", err);
        res.status(500).json({ error: err.message });
    }
};
