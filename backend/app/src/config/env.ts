import { z } from "zod";

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    BACKEND_API_URL: z.string().min(1),
    FRONTEND_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),

    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),

    SMTP_PORT: z.string(),
    SMTP_USER: z.string(),
    SMTP_HOST: z.string(),
    SMTP_PASS: z.string(),
    SMTP_EMAIL_SENDER: z.string(),

    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
    REDIS_PASSWORD: z.string(),
    REDIS_TLS: z
        .string()
        .default("false")
        .transform((val) => val === "true"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;