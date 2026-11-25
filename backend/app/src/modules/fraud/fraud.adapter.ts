import axios from "axios";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/AppError.js";

export interface FraudCheckResult {
    score: number;
    status: "SAFE" | "RISKY" | "FAILED";
    data: {
        totalParcels: number;
        cancelledParcels: number;
        deliveredParcels: number;
        successRate: number;
        cancelRate: number;
        rawSummary: any; // Store the full breakdown (Pathao, Steadfast, etc.)
    };
}

export class FraudAdapter {
    static async checkPhoneNumber(phone: string): Promise<FraudCheckResult> {
        try {
            console.log(`[FraudChecker] Calling FraudBD API for: ${phone}`);

            const response = await axios.post(
                env.FRAUDBD_API_URL,
                { phone_number: phone },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "api_key": env.FRAUDBD_API_KEY,
                    },
                    timeout: 10000,
                }
            );

            const { status, message, data } = response.data;

            // Handle API-level failure (e.g., invalid phone format, daily limit reached)
            if (!status || !data) {
                throw new ApiError(400, message || "FraudBD returned an error");
            }

            // Extract the summary data
            const { totalSummary, Summaries } = data;

            // If FraudBD has no data on this customer, they return total: 0
            if (!totalSummary || totalSummary.total === 0) {
                return {
                    score: 0,
                    status: "SAFE",
                    data: {
                        totalParcels: 0,
                        cancelledParcels: 0,
                        deliveredParcels: 0,
                        successRate: 0,
                        cancelRate: 0,
                        rawSummary: Summaries,
                    },
                };
            }

            // Use their built-in cancelRate as the score (0-100)
            const score = Math.round(totalSummary.cancelRate);

            return {
                score,
                status: score > 50 ? "RISKY" : "SAFE",
                data: {
                    totalParcels: totalSummary.total,
                    cancelledParcels: totalSummary.cancel,
                    deliveredParcels: totalSummary.success,
                    successRate: totalSummary.successRate,
                    cancelRate: totalSummary.cancelRate,
                    rawSummary: Summaries,
                },
            };
        } catch (error: any) {
            console.error("FraudBD API Error:", error.response?.data || error.message);

            // If the API is unreachable or limits are hit, we throw.
            // The worker will catch this and mark the submission as FAILED.
            throw new ApiError(
                500,
                error.response?.data?.message || "Failed to check fraud status with FraudBD"
            );
        }
    }
}