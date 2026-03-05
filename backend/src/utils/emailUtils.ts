import { Resend } from 'resend';

/* =====================================================
   EMAIL SERVICE CONFIGURATION
   
   Using Resend instead of Gmail SMTP because:
   - Render blocks outgoing SMTP connections (port 587/465)
   - Resend uses HTTPS API (no port blocking issues)
   - Free tier: 3,000 emails/month
   - Better deliverability
===================================================== */

const resend = new Resend(process.env.RESEND_API_KEY);

/* =====================================================
   VERIFY EMAIL CONFIGURATION (runs once on startup)
===================================================== */

(async () => {
    if (!process.env.RESEND_API_KEY) {
        console.error("⚠️ RESEND_API_KEY not set in environment variables");
        console.error("Email functionality will not work!");
        console.error("\n📝 Setup instructions:");
        console.error("1. Sign up at https://resend.com");
        console.error("2. Get your API key from https://resend.com/api-keys");
        console.error("3. Add RESEND_API_KEY to your .env file");
        console.error("4. Verify your domain or use onboarding@resend.dev for testing\n");
    } else {
        console.log("✅ Resend email service configured");
        console.log("📧 API Key:", process.env.RESEND_API_KEY.substring(0, 10) + "...");
    }
})();

/* =====================================================
   SEND EMAIL FUNCTION
===================================================== */

export const sendEmail = async (
    to: string,
    subject: string,
    text: string
) => {
    try {
        console.log(`� Attempting to send email to: ${to}`);
        console.log(`📧 Subject: ${subject}`);

        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY not configured");
        }

        // Extract signing link from last line
        const signLink = text.split("\n").pop() || "";

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'DoSign <onboarding@resend.dev>',
            to: [to],
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width:600px;margin:auto;padding:20px;">
                  
                  <div style="background:linear-gradient(135deg,#667eea,#764ba2);
                              padding:25px;border-radius:10px 10px 0 0;">
                    <h1 style="color:white;margin:0;">DoSign</h1>
                  </div>

                  <div style="background:#f9fafb;padding:25px;border-radius:0 0 10px 10px;">
                    <h2 style="color:#4F46E5;">Document Signature Request</h2>

                    <p style="color:#374151;font-size:16px;">
                      You have been requested to sign a document.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                      <a href="${signLink}"
                         style="background:#4F46E5;color:white;
                                padding:14px 30px;
                                text-decoration:none;
                                border-radius:8px;
                                font-weight:600;
                                display:inline-block;">
                         Sign Document
                      </a>
                    </div>

                    <p style="font-size:14px;color:#6b7280;">
                      This link will expire in 7 days.
                      If you did not expect this email, you can ignore it safely.
                    </p>

                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">

                    <p style="font-size:12px;color:#9ca3af;">
                      Or copy and paste this link:<br>
                      <a href="${signLink}" style="color:#4F46E5;word-break:break-all;">${signLink}</a>
                    </p>
                  </div>
                </div>
            `,
        });

        if (error) {
            throw error;
        }

        console.log("✅ Email sent successfully");
        console.log("📬 Email ID:", data?.id);

        return data;
    } catch (error: any) {
        console.error("❌ Email sending failed");
        console.error("📧 Recipient:", to);
        console.error("🔴 Error:", error.message || error);

        if (error.message?.includes("API key")) {
            console.error("\n⚠️ Invalid or missing Resend API key");
            console.error("Get your API key at: https://resend.com/api-keys\n");
        }

        throw new Error(`Email sending failed: ${error.message || error}`);
    }
};
