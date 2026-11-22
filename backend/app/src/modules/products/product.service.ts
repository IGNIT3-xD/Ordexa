import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";
import { ProductStatus } from "../../../generated/prisma/enums.js";
import { v2 as cloudinary } from "cloudinary";

export class ProductService {
    static async createProduct(
        businessId: string,
        data: { name: string; description?: string; variants: any[] },
        files?: Express.Multer.File[]
    ) {
        // Create the product and variants
        const product = await prisma.product.create({
            data: {
                businessId,
                name: data.name,
                description: data.description,
                variants: {
                    create: data.variants.map((v) => ({
                        businessId,
                        sku: v.sku,
                        size: v.size,
                        color: v.color,
                        price: v.price,
                        stock: v.stock,
                    })),
                },
            },
            omit: { createdAt: true, updatedAt: true, status: true },
            include: { variants: true },
        });

        // Upload images if provided
        if (files && files.length > 0) {
            // Upload all images to Cloudinary in parallel
            const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer));
            const urls = await Promise.all(uploadPromises);

            // Save to database
            await prisma.productImage.createMany({
                data: urls.map((url, index) => {
                    // Extract publicId from URL
                    const publicId = url.split("/").slice(-2).join("/").split(".")[0] ?? '';

                    return {
                        productId: product.id,
                        url,
                        publicId,
                        isPrimary: index === 0, // Make the first uploaded image primary
                    };
                }),
            });
        }

        // Return the product with its new images
        return prisma.product.findUnique({
            where: { id: product.id },
            include: {
                variants: {
                    select: {
                        sku: true,
                        size: true,
                        color: true,
                        price: true,
                        stock: true
                    }
                },
                images: {
                    select: {
                        url: true,
                        publicId: true,
                        isPrimary: true,
                    }
                }
            },
        });
    }

    static async getProducts(
        businessId: string,
        search?: string,
        status?: ProductStatus,
        includeDeleted: boolean = false
    ) {
        return prisma.product.findMany({
            where: {
                businessId,
                // If includeDeleted is true, we don't filter by isDeleted
                ...(includeDeleted ? {} : { isDeleted: false }),
                ...(status && { status }),
                ...(search && {
                    name: { contains: search, mode: "insensitive" },
                }),
            },
            include: {
                images: { where: { isPrimary: true } },
                variants: {
                    // If a product is not deleted, we still only want to show active variants
                    where: includeDeleted ? {} : { isDeleted: false },
                    select: { stock: true }
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    static async getProductById(businessId: string, productId: string, includeDeleted = false) {
        const product = await prisma.product.findFirst({
            where: {
                id: productId, businessId,
                ...(includeDeleted ? {} : { isDeleted: false })
            },
            include: {
                variants: {
                    where: includeDeleted ? {} : { isDeleted: false }
                },
                images: true,
            },
        });

        if (!product)
            throw new ApiError(404, "Product not found");

        return product;
    }

    static async updateProduct(businessId: string, productId: string, data: any) {
        await this.getProductById(businessId, productId);

        return prisma.product.update({
            where: { id: productId },
            data,
        });
    }

    static async addVariant(businessId: string, productId: string, data: any) {
        await this.getProductById(businessId, productId);

        return prisma.productVariant.create({
            data: {
                productId,
                businessId,
                sku: data.sku,
                size: data.size,
                color: data.color,
                price: data.price,
                stock: data.stock,
            },
        });
    }

    static async adjustStock(businessId: string, variantId: string, data: { quantity: number; reason: string; actorId: string }) {
        // Verify variant exists and belongs to this business
        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, businessId },
        });

        if (!variant)
            throw new ApiError(404, "Variant not found");

        // Prevent stock from going below zero
        if (variant.stock + data.quantity < 0) {
            throw new ApiError(400, `Cannot deduct stock. Only ${variant.stock} available.`);
        }

        // Update stock AND log the movement inside a transaction
        return prisma.$transaction(async (tx) => {
            const updated = await tx.productVariant.update({
                where: { id: variantId },
                data: { stock: { increment: data.quantity } },
            });

            await tx.stockMovement.create({
                data: {
                    variantId,
                    quantity: data.quantity,
                    reason: data.reason,
                    actorId: data.actorId,
                },
            });

            return updated;
        });
    }

    static async deleteProduct(businessId: string, productId: string) {
        await this.getProductById(businessId, productId);

        return prisma.product.update({
            where: { id: productId },
            data: { isDeleted: true, status: ProductStatus.ARCHIVED },
        });
    }

    static async deleteVariant(businessId: string, variantId: string) {
        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, businessId },
        });

        if (!variant)
            throw new ApiError(404, "Variant not found");

        await prisma.productVariant.update({
            where: { id: variantId },
            data: { isDeleted: true }
        });

        return { message: "Variant deleted successfully" };
    }

    static async updateVariant(businessId: string, variantId: string, data: any) {
        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, businessId },
        });

        if (!variant)
            throw new ApiError(404, "Variant not found");

        return prisma.productVariant.update({
            where: { id: variantId },
            data,
        });
    }

    static async restoreProduct(businessId: string, productId: string) {
        await this.getProductById(businessId, productId, true);

        return prisma.product.update({
            where: { id: productId },
            data: { isDeleted: false, status: ProductStatus.ACTIVE },
        });
    }

    static async restoreVariant(businessId: string, variantId: string) {
        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, businessId },
        });

        if (!variant)
            throw new ApiError(404, "Variant not found");

        return prisma.productVariant.update({
            where: { id: variantId },
            data: { isDeleted: false },
        });
    }

    static async updateImage(businessId: string, productId: string, imageId: string, isPrimary: boolean) {
        await this.getProductById(businessId, productId);

        if (isPrimary) {
            await prisma.productImage.updateMany({
                where: { productId },
                data: { isPrimary: false },
            });
        }

        return prisma.productImage.update({
            where: { id: imageId, productId },
            data: { isPrimary },
        });
    }

    static async deleteImage(businessId: string, productId: string, imageId: string) {
        await this.getProductById(businessId, productId);

        const image = await prisma.productImage.findFirst({
            where: { id: imageId, productId },
        });

        if (!image)
            throw new ApiError(404, "Image not found");

        try {
            await cloudinary.uploader.destroy(image.publicId);
        } catch (error) {
            console.error("Failed to delete from Cloudinary:", error);
        }

        await prisma.productImage.delete({ where: { id: imageId } });

        // If the deleted image was primary, assign a new primary
        if (image.isPrimary) {
            const nextImage = await prisma.productImage.findFirst({
                where: { productId },
                orderBy: { createdAt: "asc" }, // Pick the next oldest image
            });

            if (nextImage) {
                await prisma.productImage.update({
                    where: { id: nextImage.id },
                    data: { isPrimary: true },
                });
            }
        }

        return { message: "Image deleted successfully" };
    }

    static async uploadImages(
        businessId: string,
        productId: string,
        files: Express.Multer.File[]
    ) {
        await this.getProductById(businessId, productId);

        if (!files || files.length === 0) {
            throw new ApiError(400, "No image files provided");
        }

        const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer));
        const urls = await Promise.all(uploadPromises);

        // Check if this product has any images yet
        const existingImageCount = await prisma.productImage.count({
            where: { productId }
        });

        const createdImages = await prisma.$transaction(
            urls.map((url, index) => {
                const publicId = url.split("/").slice(-2).join("/").split(".")[0] ?? "";
                return prisma.productImage.create({
                    data: {
                        productId,
                        url,
                        publicId,
                        // If there are NO existing images, make the very first uploaded image primary
                        isPrimary: existingImageCount === 0 && index === 0,
                    },
                });
            })
        );

        return createdImages;
    }
}