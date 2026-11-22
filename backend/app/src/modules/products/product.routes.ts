import { Router } from "express";
import multer from "multer";
import { protect } from "../../middleware/auth.middleware.js";
import { resolveBusiness, requireRole } from "../../middleware/tenant.middleware.js";
import {
    createProduct,
    listProducts,
    getProduct,
    updateProduct,
    addVariant,
    adjustStock,
    deleteProduct,
    updateVariant,
    deleteVariant,
    restoreProduct,
    deleteImage,
    restoreVariant,
    updateImage,
    uploadImages,
} from "./product.controller.js";
import {
    createProductSchema,
    updateProductSchema,
    addVariantSchema,
    adjustStockSchema,
    updateVariantSchema,
    setPrimaryImageSchema,
    getProductsQuerySchema,
} from "./product.schema.js";
import { Role } from "../../../generated/prisma/enums.js";

const validate = (schema: any) => (req: any, res: any, next: any) => {
    const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
    });

    // Assign the parsed body (this is safe because body is mutable)
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) (req as any).validatedQuery = parsed.query;
    if (parsed.params) (req as any).validatedParams = parsed.params;

    next();
};

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// All product routes require authentication and a verified business context
router.use(protect);
router.use(resolveBusiness);

// READ operations (Anyone in the business can view)
router.get("/", validate(getProductsQuerySchema), listProducts);
router.get("/:productId", getProduct);

// WRITE operations (Owner & Manager only)
router.post(
    "/",
    requireRole([Role.OWNER, Role.MANAGER]),
    upload.array("images", 5),
    validate(createProductSchema),
    createProduct
);
router.patch("/:productId", requireRole([Role.OWNER, Role.MANAGER]), validate(updateProductSchema), updateProduct);
router.post("/:productId/variants", requireRole([Role.OWNER, Role.MANAGER]), validate(addVariantSchema), addVariant);
router.delete("/:productId", requireRole([Role.OWNER, Role.MANAGER]), deleteProduct);

// Variant specific routes
router.patch("/variants/:variantId", requireRole([Role.OWNER, Role.MANAGER]), validate(updateVariantSchema), updateVariant);
router.delete("/variants/:variantId", requireRole([Role.OWNER, Role.MANAGER]), deleteVariant);

// INVENTORY adjustments (Staff can also adjust stock, e.g., when new shipments arrive)
router.patch("/variants/:variantId/stock", requireRole([Role.OWNER, Role.MANAGER, Role.STAFF]), validate(adjustStockSchema), adjustStock);

// Restore routes
router.patch("/:productId/restore", requireRole([Role.OWNER, Role.MANAGER]), restoreProduct);
router.patch("/variants/:variantId/restore", requireRole([Role.OWNER, Role.MANAGER]), restoreVariant);

// Image routes
router.patch("/:productId/images/:imageId", requireRole([Role.OWNER, Role.MANAGER]), validate(setPrimaryImageSchema), updateImage);
router.delete("/:productId/images/:imageId", requireRole([Role.OWNER, Role.MANAGER]), deleteImage);
router.post(
    "/:productId/images",
    requireRole([Role.OWNER, Role.MANAGER]),
    upload.array("images", 5),
    uploadImages
);

export default router;