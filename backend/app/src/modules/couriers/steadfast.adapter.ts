import axios from "axios";
import { ApiError } from "../../utils/AppError.js";

export class SteadfastAdapter {
    private static baseUrl = "https://portal.packzy.com/api/v1";

    static async createShipment(credentials: { apiKey: string; secretKey: string }, order: any) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/create_order`,
                {
                    invoice: order.orderNumber,
                    recipient_name: order.customerName,
                    recipient_phone: order.customerPhone,
                    recipient_address: order.deliveryAddress,
                    cod_amount: Number(order.totalAmount),
                    note: `Ordexa Order: ${order.orderNumber}`,
                },
                {
                    headers: {
                        "Api-Key": credentials.apiKey,
                        "Secret-Key": credentials.secretKey,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                consignmentId: response.data.consignment.id.toString(),
                trackingCode: response.data.consignment.tracking_code,
            };
        } catch (error: any) {
            console.error("Steadfast API Error:", error.response?.data || error.message);
            throw new ApiError(400, "Failed to book shipment with Steadfast");
        }
    }

    // Check if a parcel already exists by invoice (orderNumber)
    static async getOrderByInvoice(credentials: { apiKey: string; secretKey: string }, invoice: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/get_order_by_invoice/${invoice}`,
                {
                    headers: {
                        "Api-Key": credentials.apiKey,
                        "Secret-Key": credentials.secretKey,
                    },
                }
            );

            // Steadfast returns 200 with empty or 404 when the invoice doesn't exist
            if (response.data && response.data.consignment) {
                return {
                    consignmentId: response.data.consignment.id.toString(),
                    trackingCode: response.data.consignment.tracking_code,
                };
            }
            return null;
        } catch (error: any) {
            if (error.response?.status === 404)
                return null;

            throw new ApiError(500, "Failed to check existing shipment with Steadfast");
        }
    }
}