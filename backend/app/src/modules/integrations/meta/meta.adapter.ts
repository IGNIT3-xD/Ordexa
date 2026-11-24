import axios from "axios";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/AppError.js";

export class MetaAdapter {
    private static baseUrl = "https://graph.facebook.com/v20.0";

    // 1. Exchange the code for a User Access Token
    static async getAccessToken(code: string) {
        const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
            params: {
                client_id: env.META_APP_ID,
                client_secret: env.META_APP_SECRET,
                redirect_uri: env.META_REDIRECT_URI,
                code,
            },
        });
        return response.data.access_token;
    }

    // 2. Get the Pages this user manages
    static async getUserPages(userAccessToken: string) {
        const response = await axios.get(`${this.baseUrl}/me/accounts`, {
            params: { access_token: userAccessToken },
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
                }
            );
            return response.data;
        } catch (error: any) {
            console.error("Meta Send Error:", error.response?.data || error.message);
            throw new ApiError(500, "Failed to send Messenger message");
        }
    }
}