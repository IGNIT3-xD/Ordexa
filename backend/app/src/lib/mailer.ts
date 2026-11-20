import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(env.SMTP_PORT) || 587,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export const sendVerificationEmail = async (to: string, code: string) => {
    if (!env.SMTP_HOST) {
        console.log(`\n📧 [DEV] Verification code for ${to} is: ${code}\n`);
        return;
    }

    await transporter.sendMail({
        from: `${env.SMTP_SENDER_EMAIL}`,
        to,
        subject: "Your Ordexa Verification Code",
        html: `<h2>Your verification code is: <b>${code}</b></h2><p>This code expires in 15 minutes.</p>`,
    });
};