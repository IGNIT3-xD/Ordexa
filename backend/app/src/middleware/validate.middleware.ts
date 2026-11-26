import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";

export const validate = (schema: any) => (req: any, res: Response, next: NextFunction) => {
    try {
        // Parse the request against the schema
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        // OVERWRITE req.body with the sanitized Zod output
        if (parsed.body) {
            req.body = parsed.body;
        }

        // Handle Express 5 query/params immutability
        if (parsed.query) {
            (req as any).validatedQuery = parsed.query;
        }
        if (parsed.params) {
            (req as any).validatedParams = parsed.params;
        }

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                status: "error",
                message: "Validation Error",
                details: error.issues.map((e: any) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            });
        }
        next(error);
    }
};