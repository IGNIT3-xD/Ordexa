import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "ordexa/profiles" },
            (error, result) => {
                if (error || !result) return reject(error || new Error("Upload failed"));
                resolve(result.secure_url);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

export const uploadPdfToCloudinary = (fileBuffer: Buffer, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "ordexa/invoices",
                resource_type: "raw",
                type: "upload",
                public_id: fileName,
                format: "pdf"
            },
            (error, result) => {
                if (error || !result) return reject(error || new Error("PDF Upload failed"));
                resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
};