import { z } from "zod";

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    BACKEND_API_URL: z.url(),
    FRONTEND_URL: z.url(),

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

    ENCRYPTION_KEY: z.string().min(1),

    SSLCOMMERZ_STORE_ID: z.string().min(1),
    SSLCOMMERZ_STORE_PASSWORD: z.string().min(1),
    SSLCOMMERZ_IS_SANDBOX: z.string().min(1),
    BACKEND_URL: z.url(),

    META_APP_ID: z.string().min(1),
    META_APP_SECRET: z.string().min(1),
    META_REDIRECT_URI: z.string().min(1),
    META_VERIFY_TOKEN: z.string().min(1),

    FRAUDBD_API_KEY: z.string().min(1),
    FRAUDBD_API_URL: z.url(),

    STEADFAST_WEBHOOK_SECRET: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;