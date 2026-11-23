import axios from "axios";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/AppError.js";

export class SSLCommerzAdapter {
    private static getBaseUrl() {
        return env.SSLCOMMERZ_IS_SANDBOX === "true"
            ? "https://sandbox.sslcommerz.com"
            : "https://securepay.sslcommerz.com";
    }

    static async initiatePayment(payload: {
        tranId: string;
        amount: number;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        customerAddress: string;
        productName: string;
    }) {
        const data = new URLSearchParams({
            store_id: env.SSLCOMMERZ_STORE_ID,
            store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
            total_amount: payload.amount.toString(),
            currency: "BDT",
            tran_id: payload.tranId,
            success_url: `${env.BACKEND_URL}/api/billing/success`,
            fail_url: `${env.BACKEND_URL}/api/billing/fail`,
            cancel_url: `${env.BACKEND_URL}/api/billing/cancel`,
            cus_name: payload.customerName,
            cus_email: payload.customerEmail,
            cus_phone: payload.customerPhone,
            cus_add1: payload.customerAddress,
            cus_city: "Dhaka",
            cus_country: "Bangladesh",
            shipping_method: "NO",
            product_name: payload.productName,
            product_category: "SaaS",
            product_profile: "general",
        });

        try {
            const response = await axios.post(
                `${this.getBaseUrl()}/gwprocess/v4/api.php`,
                data.toString(),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );

            if (response.data?.status === "SUCCESS") {
                return response.data.GatewayPageURL; // Return the URL where the user pays
            }

            throw new ApiError(400, "Failed to initiate payment");
        } catch (error: any) {
            console.error("SSLCommerz Init Error:", error.response?.data || error.message);
            throw new ApiError(500, "Payment gateway error");
        }
    }

    static async validatePayment(valId: string) {
        try {
            const response = await axios.get(
                `${this.getBaseUrl()}/validator/api/validationserverAPI.php`,
                {
                    params: {
                        val_id: valId,
                        store_id: env.SSLCOMMERZ_STORE_ID,
                        store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
                        format: "json",
                    },
                }
            );
            return response.data; // Contains status, amount, tran_id, etc.
        } catch (error: any) {
            console.error("SSLCommerz Validation Error:", error.message);
            throw new ApiError(500, "Failed to validate payment");
        }
    }
}