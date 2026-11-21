import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/AppError.js";
import { uploadToCloudinary } from "../../lib/cloudinary.js";
import { ProductStatus } from "../../../generated/prisma/enums.js";

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

    static async getProducts(businessId: string, search?: string, status?: ProductStatus) {
        return prisma.product.findMany({
            where: {
                businessId,
                ...(status && { status }),
                ...(search && {
                    name: { contains: search, mode: "insensitive" },
                }),
                status: ProductStatus.ACTIVE
            },
            include: {
                images: { where: { isPrimary: true } },
                variants: { select: { stock: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    static async getProductById(businessId: string, productId: string) {
        const product = await prisma.product.findFirst({
            where: { id: productId, businessId },
            include: {
                variants: true,
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

    static async addProductImage(businessId: string, productId: string, fileBuffer: Buffer) {
        await this.getProductById(businessId, productId);

        const url = await uploadToCloudinary(fileBuffer);

        // Extract publicId from URL (Cloudinary URLs contain the public ID)
        const publicId = url.split("/").slice(-2).join("/").split(".")[0] ?? '';

        // Check if this is the first image to set as primary
        const imageCount = await prisma.productImage.count({ where: { productId } });
        const isPrimary = imageCount === 0;

        return prisma.productImage.create({
            data: {
                productId,
                url,
                publicId,
                isPrimary,
            },
        });
    }
}