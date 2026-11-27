import axios from "axios";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/AppError.js";

export class MetaAdapter {
    private static baseUrl = "https://graph.facebook.com/v20.0";

    static async subscribeAppToPage(pageId: string, pageAccessToken: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${pageId}/subscribed_apps`,
                {},
                {
                    params: { access_token: pageAccessToken },
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000,
                }
            );
            console.log(`✅ Successfully subscribed app to Page: ${pageId}`);
            return response.data;
        } catch (error: any) {
            console.error(`❌ Failed to subscribe app to Page ${pageId}:`, error.response?.data || error.message);
            throw new ApiError(500, "Failed to subscribe to Facebook Page webhooks");
        }
    }

    // 1. Exchange the code for a User Access Token
    static async getAccessToken(code: string) {
        const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
            params: {
                client_id: env.META_APP_ID,
                client_secret: env.META_APP_SECRET,
                redirect_uri: env.META_REDIRECT_URI,
                code,
            },
            timeout: 15000,
        });
        return response.data.access_token;
    }

    // 2. Get the Pages this user manages
    static async getUserPages(userAccessToken: string) {
        const response = await axios.get(`${this.baseUrl}/me/accounts`, {
            params: { access_token: userAccessToken },
            timeout: 15000,
        });
        return response.data.data;
    }

    // 3. Send a Utility Template Message
    static async sendMessage(pageAccessToken: string, psid: string, text: string) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/me/messages`,
                {
                    recipient: { id: psid },
                    message: { text: text },
                },
                {
                    params: { access_token: pageAccessToken },
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000,
                }
            );
            return response.data;
        } catch (error: any) {
            console.error("Meta Send Error:", error.response?.data || error.message);
            throw new ApiError(500, "Failed to send Messenger message");
        }
    }

    static async getLongLivedUserToken(shortLivedToken: string) {
        try {
            const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
                params: {
                    grant_type: "fb_exchange_token",
                    client_id: env.META_APP_ID,
                    client_secret: env.META_APP_SECRET,
                    fb_exchange_token: shortLivedToken,
                },
                timeout: 15000,
            });
            return response.data.access_token;
        } catch (error: any) {
            console.error("Meta Long-Lived Token Error:", error.response?.data || error.message);
            throw new ApiError(500, "Failed to exchange for long-lived token");
        }
    }
}