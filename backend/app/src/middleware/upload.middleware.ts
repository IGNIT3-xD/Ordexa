import multer from "multer";
import { ApiError } from "../utils/AppError.js";

const storage = multer.memoryStorage();

// Whitelist safe image MIME types
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

const fileFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                400,
                "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed."
            ) as any
        );
    }
};

export const secureUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 5,
    },
    fileFilter,
});