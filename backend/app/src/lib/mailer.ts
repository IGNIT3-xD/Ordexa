import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ejs from "ejs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || "smtp.gmail.com",
    port: Number(env.SMTP_PORT) || 587,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export const sendVerificationEmail = async (to: string, code: string, name?: string) => {
    if (!env.SMTP_HOST) {
        console.log(`\n📧 [DEV] Verification code for ${to} is: ${code}\n`);
        return;
    }

    const templatePath = path.join(__dirname, "../templates/verify-email.ejs");
    const html = await ejs.renderFile(templatePath, { code, name });

    await transporter.sendMail({
        from: `${env.SMTP_EMAIL_SENDER}`,
        to,
        subject: "Your Ordexa Verification Code",
        html,
    });
};

export const sendWelcomeEmail = async (to: string, name?: string) => {
    const loginUrl = `${env.FRONTEND_URL}/login`;

    if (!env.SMTP_HOST) {
        console.log(`\n📧 [DEV] Welcome email would be sent to ${to}\n`);
        return;
    }

    const templatePath = path.join(__dirname, "../templates/welcome.ejs");
    const html = await ejs.renderFile(templatePath, { name, loginUrl });

    await transporter.sendMail({
        from: `${env.SMTP_EMAIL_SENDER}`,
        to,
        subject: "Welcome to Ordexa - Account Verified",
        html: html,
    });
};

export const sendPasswordResetEmail = async (to: string, code: string, name?: string) => {
    if (!env.SMTP_HOST) {
        console.log(`\n📧 [DEV] Password reset code for ${to} is: ${code}\n`);
        return;
    }

    const templatePath = path.join(__dirname, "../templates/forgot-password.ejs");
    const html = await ejs.renderFile(templatePath, { code, name });

    await transporter.sendMail({
        from: `${env.SMTP_EMAIL_SENDER}`,
        to,
        subject: "Reset your Ordexa Password",
        html: html,
    });
};

export const sendInviteEmail = async (to: string, businessName: string, role: string, rawToken: string) => {
    const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${rawToken}`;

    if (!env.SMTP_HOST) {
        console.log(`\n📧 [DEV] Invite link for ${to}: ${inviteUrl}\n`);
        return;
    }

    const templatePath = path.join(__dirname, "../templates/invite.ejs");
    const html = await ejs.renderFile(templatePath, { businessName, role, inviteUrl });

    await transporter.sendMail({
        from: `${env.SMTP_EMAIL_SENDER}`,
        to,
        subject: `Invitation to join ${businessName}`,
        html,
    });
};