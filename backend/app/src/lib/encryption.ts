import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(env.ENCRYPTION_KEY, "hex"),
        iv
    );

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (encryptedText: string): string => {
    const parts = encryptedText.split(":");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
    }

    const ivHex = parts[0];
    const authTagHex = parts[1];
    const encryptedData = parts[2];

    // Runtime checks to satisfy TypeScript
    if (!ivHex || !authTagHex || !encryptedData) {
        throw new Error("Corrupted encrypted data");
    }

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(env.ENCRYPTION_KEY, "hex"),
        Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};