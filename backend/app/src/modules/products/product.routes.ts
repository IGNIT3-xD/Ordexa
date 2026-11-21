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
    uploadImage,
    deleteProduct,
    updateVariant,
    deleteVariant,
} from "./product.controller.js";
import {
    createProductSchema,
    updateProductSchema,
    addVariantSchema,
    adjustStockSchema,
    updateVariantSchema,
} from "./product.schema.js";
import { Role } from "../../../generated/prisma/enums.js";

const validate = (schema: any) => (req: any, res: any, next: any) => {
    // Zod .parse() returns the validated, transformed data
    const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
    });

    // Assign the parsed (and transformed) data back to req
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
};

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// All product routes require authentication and a verified business context
router.use(protect);
router.use(resolveBusiness);

// READ operations (Anyone in the business can view)
router.get("/", listProducts);
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
router.post("/:productId/images", requireRole([Role.OWNER, Role.MANAGER]), upload.single("image"), uploadImage);
router.delete("/:productId", requireRole([Role.OWNER, Role.MANAGER]), deleteProduct);

// Variant specific routes
router.patch("/variants/:variantId", requireRole([Role.OWNER, Role.MANAGER]), validate(updateVariantSchema), updateVariant);
router.delete("/variants/:variantId", requireRole([Role.OWNER, Role.MANAGER]), deleteVariant);

// INVENTORY adjustments (Staff can also adjust stock, e.g., when new shipments arrive)
router.patch("/variants/:variantId/stock", requireRole([Role.OWNER, Role.MANAGER, Role.STAFF]), validate(adjustStockSchema), adjustStock);

export default router;