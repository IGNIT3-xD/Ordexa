import { type Request, type Response } from "express";
import { env } from "../../../config/env.js";
import crypto from "node:crypto";

// Meta calls this GET endpoint once to verify the webhook
export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
        console.log("✅ Meta Webhook Verified!");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
};

// Meta calls this POST endpoint on every message
export const handleWebhook = async (req: any, res: Response) => {
    // 1. Verify Meta Signature
    const signature = req.headers["x-hub-signature-256"] as string;

    if (!signature) {
        console.warn("🚨 Missing Meta webhook signature");
        return res.status(401).send("Missing signature");
    }

    if (!req.rawBody) {
        console.error("Raw body not captured. Cannot verify signature.");
        return res.status(500).send("Internal server error");
    }

    const expectedSignature = `sha256=${crypto
        .createHmac("sha256", env.META_APP_SECRET)
        .update(req.rawBody)
        .digest("hex")}`;

    // Timing safe comparison prevents timing attacks
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
        // console.warn("🚨 Invalid Meta webhook signature");
        return res.status(401).send("Invalid signature");
    }

    // 2. Process the verified payload
    const body = req.body;

    if (body.object === "page") {
        for (const entry of body.entry) {
            const pageId = entry.id;

            for (const webhookEvent of entry.messaging) {
                const senderPsid = webhookEvent.sender.id;

                // console.log(`✅ Verified message from PSID: ${senderPsid} on Page: ${pageId}`);

                // Find business by pageId and attach PSID to Customer/Submission
                // (You can implement the logic to link PSID to a submission here)
            }
        }
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
};