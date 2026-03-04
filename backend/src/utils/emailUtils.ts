import nodemailer from "nodemailer";

/* =====================================================
   CREATE EMAIL TRANSPORTER
===================================================== */

const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("EMAIL_USER or EMAIL_PASS not set in environment variables");
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    console.log("Email configuration loaded:", {
        host: "smtp.gmail.com",
        port: 587,
        user: process.env.EMAIL_USER
            ? `${process.env.EMAIL_USER.substring(0, 3)}***`
            : "NOT SET",
        passConfigured: !!process.env.EMAIL_PASS,
    });

    return transporter;
};

const transporter = createTransporter();

/* =====================================================
   VERIFY EMAIL CONNECTION (runs once on startup)
===================================================== */

(async () => {
    try {
        await transporter.verify();
        console.log("Email server is ready to send messages");
    } catch (error: any) {
        console.error("Email transporter verification failed");
        console.error(error.message);
        console.error("Check EMAIL_USER and EMAIL_PASS in environment variables");
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
        console.log(`Sending email to: ${to}`);

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
                        font-weight:600;">
                 Sign Document
              </a>
            </div>

            <p style="font-size:14px;color:#6b7280;">
              This link will expire in 7 days.
              If you did not expect this email, you can ignore it safely.
            </p>
          </div>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent successfully");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);

        return info;
    } catch (error: any) {
        console.error("Email sending failed");
        console.error("Recipient:", to);
        console.error("Error:", error.message);

        if (error.code === "EAUTH") {
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