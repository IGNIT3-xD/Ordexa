import { type Request, type Response } from "express";
import crypto from "node:crypto";
import { asyncHandler } from "../../../utils/AsyncHandler.js";
import { ApiError } from "../../../utils/AppError.js";
import { MetaAdapter } from "./meta.adapter.js";
import { prisma } from "../../../lib/prisma.js";
import { encrypt } from "../../../lib/encryption.js";
import { env } from "../../../config/env.js";
import { redisConnection } from "../../../lib/queue.js";

export const connectMeta = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    // Generate a secure random state
    const state = crypto.randomBytes(32).toString("hex");

    // Store it in Redis for 10 minutes (600 seconds)
    await redisConnection.set(`oauth:meta:${state}`, req.tenant.businessId, "EX", 600);

    const scopes = ["pages_show_list", "pages_messaging", "pages_manage_metadata"];
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${env.META_REDIRECT_URI}&state=${state}&scope=${scopes.join(",")}`;

    res.json({ authUrl });
});

export const metaCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=denied`);
    }

    if (!code || !state) {
        return res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=failed`);
    }

    // Atomically read and delete the state so it can only be used once.
    const redisKey = `oauth:meta:${state}`;
    const businessId = await redisConnection.getdel(redisKey);

    if (!businessId) {
        console.error("Invalid or expired OAuth state");
        return res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=invalid_state`);
    }

    try {
        // Exchange code for token
        const userToken = await MetaAdapter.getAccessToken(code as string);

        // Get long-lived token
        const longUserToken = await MetaAdapter.getLongLivedUserToken(userToken);

        // Get pages
        const pages = await MetaAdapter.getUserPages(longUserToken);
        if (!pages || pages.length === 0) {
            return res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=no_pages`);
        }

        const selectedPage = pages[0];

        // Encrypt and save
        const encryptedToken = encrypt(selectedPage.access_token);

        await prisma.socialConnection.upsert({
            where: { businessId },
            update: {
                pageId: selectedPage.id,
                pageName: selectedPage.name,
                pageAccessToken: encryptedToken,
            },
            create: {
                businessId,
                pageId: selectedPage.id,
                pageName: selectedPage.name,
                pageAccessToken: encryptedToken,
            },
        });

        try {
            await MetaAdapter.subscribeAppToPage(selectedPage.id, selectedPage.access_token);
        } catch (error) {
            console.error("Webhook subscription failed:", error);
        }

        res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=success`);
    } catch (err) {
        console.error("OAuth callback error:", err);
        res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=error`);
    }
});