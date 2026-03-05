import nodemailer from "nodemailer";

/* =====================================================
   CREATE EMAIL TRANSPORTER
===================================================== */

const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("⚠️ EMAIL_USER or EMAIL_PASS not set in environment variables");
        console.error("Email functionality will not work!");
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    console.log("📧 Email configuration loaded:", {
        host: "smtp.gmail.com",
        port: 587,
        user: process.env.EMAIL_USER
            ? `${process.env.EMAIL_USER.substring(0, 3)}***`
            : "NOT SET",
        passConfigured: !!process.env.EMAIL_PASS,
        passLength: process.env.EMAIL_PASS?.length || 0
    });

    return transporter;
};

const transporter = createTransporter();

/* =====================================================
   VERIFY EMAIL CONNECTION (runs once on startup)
===================================================== */

(async () => {
    try {
        console.log("🔍 Verifying email connection...");
        await transporter.verify();
        console.log("✅ Email server is ready to send messages");
    } catch (error: any) {
        console.error("❌ Email transporter verification failed");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("\n📝 Troubleshooting steps:");
        console.error("1. Check EMAIL_USER is correct Gmail address");
        console.error("2. Check EMAIL_PASS is a valid Gmail App Password (16 characters, no spaces)");
        console.error("3. Enable 2-Step Verification in your Google Account");
        console.error("4. Generate App Password at: https://myaccount.google.com/apppasswords");
        console.error("5. Make sure 'Less secure app access' is NOT needed for App Passwords\n");
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
        console.log(`📤 Attempting to send email to: ${to}`);
        console.log(`📧 Subject: ${subject}`);

        // Extract signing link from last line
        const signLink = text.split("\n").pop();

        const mailOptions = {
            from: `"DoSign Document Signing" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
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
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Email sent successfully");
        console.log("📬 Message ID:", info.messageId);
        console.log("📨 Response:", info.response);

        return info;
    } catch (error: any) {
        console.error("❌ Email sending failed");
        console.error("📧 Recipient:", to);
        console.error("🔴 Error code:", error.code);
        console.error("🔴 Error message:", error.message);

        if (error.code === "EAUTH") {
            console.error("\n⚠️ Authentication Error - Your Gmail credentials are incorrect");
            console.error("Please check:");
            console.error("1. EMAIL_USER is your full Gmail address");
            console.error("2. EMAIL_PASS is a 16-character App Password (not your Gmail password)");
            console.error("3. Generate new App Password at: https://myaccount.google.com/apppasswords\n");
            throw new Error(
                "Email authentication failed. Check EMAIL_USER and EMAIL_PASS credentials."
            );
        }

        if (error.code === "ECONNECTION") {
            throw new Error("Cannot connect to Gmail SMTP server.");
        }

        throw new Error(`Email sending failed: ${error.message}`);
    }
};