import { type Request, type Response } from "express";
import { asyncHandler } from "../../../utils/AsyncHandler.js";
import { ApiError } from "../../../utils/AppError.js";
import { MetaAdapter } from "./meta.adapter.js";
import { prisma } from "../../../lib/prisma.js";
import { encrypt } from "../../../lib/encryption.js";
import { env } from "../../../config/env.js";

export const connectMeta = asyncHandler(async (req: Request, res: Response) => {
    if (!req.tenant)
        throw new ApiError(500, "Tenant missing");

    // Redirect user to Facebook OAuth
    const scopes = ["pages_show_list", "pages_messaging", "pages_manage_metadata"];
    const state = req.tenant.businessId;

    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${env.META_REDIRECT_URI}&state=${state}&scope=${scopes.join(",")}`;

    res.json({ authUrl });
});

export const metaCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const businessId = state as string;

    if (!code || !businessId) {
        return res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=failed`);
    }

    // 1. Get User Token
    const userToken = await MetaAdapter.getAccessToken(code as string);

    // 2. Get Pages
    const pages = await MetaAdapter.getUserPages(userToken);
    if (!pages || pages.length === 0) {
        return res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=no_pages`);
    }

    // For MVP, we will just grab the first Page. In production, let the user select.
    const selectedPage = pages[0];

    // 3. Encrypt and Save
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

    res.redirect(`${env.FRONTEND_URL}/dashboard/integrations?status=success`);
});