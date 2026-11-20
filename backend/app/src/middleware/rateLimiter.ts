import rateLimit from "express-rate-limit";

// Strict limiter for Login & Verification (brute-force protection)
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        status: "error",
        message: "Too many attempts, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Slightly looser limiter for Registration (prevent spam accounts)
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 registrations per hour
    message: {
        status: "error",
        message: "Too many accounts created from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});