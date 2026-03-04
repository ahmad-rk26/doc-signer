import { Router, Response, Request } from "express";
import { supabaseAdmin } from "../config/supabase";
import { PDFDocument } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/* ================= PUBLIC DOC BY TOKEN ================= */
router.get("/docs/:token", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const { data: session, error: sessionError } = await supabaseAdmin
            .from("signing_sessions")
            .select("document_id, recipient_email, expires_at")
            .eq("token", token)
            .single();

        if (sessionError || !session)
            return res.status(404).json({ error: "Invalid or expired token" });

        if (new Date(session.expires_at) < new Date())
            return res.status(410).json({ error: "Token expired" });

        const { data: doc, error: docError } = await supabaseAdmin
            .from("documents")
            .select("id, file_path, status")
            .eq("id", session.document_id)
            .single();

        if (docError || !doc)
            return res.status(404).json({ error: "Document not found" });

        res.json(doc);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= SIGNED URL ================= */
router.get("/storage", async (req: Request, res: Response) => {
    try {
        let path = req.query.path as string;

        if (!path)
            return res.status(400).json({ error: "Path required" });

        path = decodeURIComponent(path.replace(/\+/g, " "));

        const { data, error } = await supabaseAdmin.storage
            .from("documents")
            .createSignedUrl(path, 900);

        if (error) throw error;

        res.json({ url: data.signedUrl });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/* ================= UPLOAD SIGNATURE IMAGE (PUBLIC) ================= */
router.post("/upload-signature", async (req: Request, res: Response) => {
    try {
        const { image, token } = req.body;

        if (!image)
            return res.status(400).json({ error: "Image missing" });

        if (!token)
            return res.status(400).json({ error: "Token required" });

        // Extract base64 data and detect format
        const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: "Invalid image format" });
        }

        const imageType = matches[1]; // png, jpeg, jpg, etc.
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        console.log("Uploading signature:", { imageType, size: buffer.length });

        // Use appropriate extension
        const extension = imageType === 'jpeg' ? 'jpg' : imageType;
        const path = `public/${uuidv4()}.${extension}`;

        const { error } = await supabaseAdmin.storage
            .from("signatures")
            .upload(path, buffer, {
                contentType: `image/${imageType}`,
                upsert: true,
            });

        if (error) {
            console.error("Upload error:", error);
            throw error;
        }

        console.log("Signature uploaded:", path);
        res.json({ path });
    } catch (err: any) {
        console.error("UPLOAD SIGNATURE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ================= PUBLIC SIGN DOCUMENT ================= */
router.post("/sign", async (req: Request, res: Response) => {
    try {
        const { token, x, y, page, signaturePath, width, height } = req.body;

        console.log("Sign request received:", { token, x, y, page, signaturePath, width, height });

        if (!token)
            return res.status(400).json({ error: "Token required" });

        const { data: session, error: sessionError } = await supabaseAdmin
            .from("signing_sessions")
            .select("document_id, recipient_email, expires_at")
            .eq("token", token)
            .single();

        if (sessionError || !session) {
            console.error("Session error:", sessionError);
            return res.status(404).json({ error: "Invalid token" });
        }

        if (new Date(session.expires_at) < new Date())
            return res.status(410).json({ error: "Token expired" });

        const documentId = session.document_id;
        console.log("Document ID:", documentId);

        // Get the document owner's user_id
        const { data: doc, error: docError } = await supabaseAdmin
            .from("documents")
            .select("file_path, user_id")
            .eq("id", documentId)
            .single();

        if (docError || !doc) {
            console.error("Document fetch error:", docError);
            return res.status(404).json({ error: "Document not found" });
        }

        console.log("Document path:", doc.file_path, "Owner:", doc.user_id);

        const { error: sigError } = await supabaseAdmin
            .from("signatures")
            .insert({
                document_id: documentId,
                user_id: doc.user_id, // Use document owner's user_id
                x,
                y,
                page,
                width,
                height,
                signature_image: signaturePath,
                status: "signed",
            });

        if (sigError) {
            console.error("Signature insert error:", sigError);
            throw sigError;
        }

        console.log("Signature inserted");

        // Mark the signing session as completed
        await supabaseAdmin
            .from("signing_sessions")
            .update({
                status: "completed",
                signed_at: new Date().toISOString()
            })
            .eq("token", token);

        console.log("Signing session marked as completed");

        // Create audit log entry for signature
        await supabaseAdmin
            .from("audits")
            .insert({
                document_id: documentId,
                user_id: doc.user_id,
                action: `Document signed by ${session.recipient_email}`,
                ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
            });

        console.log("Audit log created");

        const { data: sigs } = await supabaseAdmin
            .from("signatures")
            .select("*")
            .eq("document_id", documentId);

        console.log("Total signatures:", sigs?.length);

        const { data: pdfFile, error: pdfDownloadError } = await supabaseAdmin.storage
            .from("documents")
            .download(doc.file_path);

        if (pdfDownloadError || !pdfFile) {
            console.error("PDF download error:", pdfDownloadError);
            throw new Error("Failed to download PDF");
        }

        console.log("PDF downloaded");

        const pdfDoc = await PDFDocument.load(
            await pdfFile.arrayBuffer()
        );

        console.log("PDF loaded, pages:", pdfDoc.getPageCount());

        for (const sig of sigs || []) {
            if (!sig.signature_image) continue;

            console.log("Processing signature:", sig.signature_image);

            const { data: img, error: imgError } = await supabaseAdmin.storage
                .from("signatures")
                .download(sig.signature_image);

            if (imgError || !img) {
                console.error("Signature image download error:", imgError);
                continue;
            }

            // Detect image type from file extension
            const imageExt = sig.signature_image.split('.').pop()?.toLowerCase();
            const imageBuffer = await img.arrayBuffer();

            let image;
            try {
                if (imageExt === 'jpg' || imageExt === 'jpeg') {
                    console.log("Embedding JPEG image");
                    image = await pdfDoc.embedJpg(imageBuffer);
                } else {
                    console.log("Embedding PNG image");
                    image = await pdfDoc.embedPng(imageBuffer);
                }
            } catch (embedError: any) {
                console.error("Image embed error:", embedError.message);
                // Try the other format if first one fails
                try {
                    if (imageExt === 'jpg' || imageExt === 'jpeg') {
                        console.log("Retrying as PNG");
                        image = await pdfDoc.embedPng(imageBuffer);
                    } else {
                        console.log("Retrying as JPEG");
                        image = await pdfDoc.embedJpg(imageBuffer);
                    }
                } catch (retryError: any) {
                    console.error("Both formats failed:", retryError.message);
                    continue;
                }
            }

            const pdfPage = pdfDoc.getPage(sig.page - 1);
            const correctedY = pdfPage.getHeight() - sig.y - sig.height;

            pdfPage.drawImage(image, {
                x: sig.x,
                y: correctedY,
                width: sig.width,
                height: sig.height,
            });

            console.log("Signature added to page", sig.page);
        }

        const signedPdf = await pdfDoc.save();
        console.log("PDF saved, size:", signedPdf.length);

        const signedPath = doc.file_path.replace(".pdf", "-signed.pdf");

        const { error: uploadError } = await supabaseAdmin.storage
            .from("documents")
            .upload(signedPath, Buffer.from(signedPdf), {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            throw uploadError;
        }

        console.log("Signed PDF uploaded:", signedPath);

        await supabaseAdmin
            .from("documents")
            .update({ status: "signed" })
            .eq("id", documentId);

        // Create audit log entry for document finalization
        await supabaseAdmin
            .from("audits")
            .insert({
                document_id: documentId,
                user_id: doc.user_id,
                action: "Document finalized and signed PDF generated",
                ip: req.ip || req.headers['x-forwarded-for'] || 'unknown'
            });

        const { data: downloadUrl } = await supabaseAdmin.storage
            .from("documents")
            .createSignedUrl(signedPath, 3600);

        console.log("Document signed successfully");

        res.json({
            message: "Document signed successfully",
            signedPath,
            downloadUrl: downloadUrl?.signedUrl,
        });
    } catch (err: any) {
        console.error("SIGN ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

/* ================= CHECK SESSION STATUS ================= */
router.get("/session/:token/status", async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const { data: session, error } = await supabaseAdmin
            .from("signing_sessions")
            .select("document_id, recipient_email, expires_at, created_at")
            .eq("token", token)
            .single();

        if (error || !session)
            return res.status(404).json({ error: "Invalid token" });

        const isExpired = new Date(session.expires_at) < new Date();

        const { data: doc } = await supabaseAdmin
            .from("documents")
            .select("status")
            .eq("id", session.document_id)
            .single();

        res.json({
            valid: !isExpired,
            expired: isExpired,
            documentStatus: doc?.status,
            recipientEmail: session.recipient_email,
            expiresAt: session.expires_at,
            createdAt: session.created_at,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;