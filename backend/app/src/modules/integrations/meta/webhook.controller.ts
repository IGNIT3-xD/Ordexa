import { type Request, type Response } from "express";
import { env } from "../../../config/env.js";
import { prisma } from "../../../lib/prisma.js";

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
export const handleWebhook = async (req: Request, res: Response) => {
    const body = req.body;

    if (body.object === "page") {
        for (const entry of body.entry) {
            const pageId = entry.id;

            for (const webhookEvent of entry.messaging) {
                const senderPsid = webhookEvent.sender.id;

                // If the customer sent a message, you can log it or match it.
                // For example, you could look for a phone number in the message text to link the PSID.
                console.log(`Received message from PSID: ${senderPsid} on Page: ${pageId}`);

                // Here you would find the business by Page ID and save the PSID to the Customer record.
            }
        }
        res.status(200).send("EVENT_RECEIVED");
    } else {
        res.sendStatus(404);
    }
};