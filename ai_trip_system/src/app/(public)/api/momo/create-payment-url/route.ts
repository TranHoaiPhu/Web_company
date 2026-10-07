import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// MoMo configuration
const MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || "MOMO";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_ENDPOINT = process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
const MOMO_RETURN_URL =
    process.env.MOMO_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || "https://ai-trip-system-frontend-40205731279.us-central1.run.app"}/api/momo/callback`;
const MOMO_NOTIFY_URL =
    process.env.MOMO_NOTIFY_URL ||
    `${process.env.NEXT_PUBLIC_BOOKING_API_URL || "https://booking-tour-api-v5tqubp6lq-uc.a.run.app/api"}/payments/momo/notify`;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const amountRaw = formData.get("amount") as string;
        const orderId = formData.get("order_id") as string;
        const orderInfo = formData.get("order_info") as string;

        // Đảm bảo amount là số nguyên (MoMo không chấp nhận số thập phân cho VND)
        const amount = Math.round(parseFloat(amountRaw)).toString();

        if (!amount || !orderId || !orderInfo) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const requestId = orderId + "_" + Date.now();
        const requestType = "captureWallet";
        const extraData = "";

        // Sign the request
        const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_NOTIFY_URL}&orderId=${requestId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${MOMO_RETURN_URL}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto
            .createHmac("sha256", MOMO_SECRET_KEY)
            .update(rawSignature)
            .digest("hex");

        const requestBody = {
            partnerCode: MOMO_PARTNER_CODE,
            accessKey: MOMO_ACCESS_KEY,
            requestId: requestId,
            amount: amount,
            orderId: requestId,
            orderInfo: orderInfo,
            redirectUrl: MOMO_RETURN_URL,
            ipnUrl: MOMO_NOTIFY_URL,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: "vi"
        };

        // Call MoMo API
        const response = await fetch(MOMO_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (result.resultCode === 0) {
            console.log("MoMo Payment URL created:", result.payUrl);
            return new NextResponse(result.payUrl, {
                status: 200,
                headers: {
                    "Content-Type": "text/plain"
                }
            });
        } else {
            console.error("MoMo API Error:", result);
            return NextResponse.json(
                { error: result.message || "Error from MoMo API" },
                { status: 400 }
            );
        }

    } catch (error: unknown) {
        console.error("Error creating MoMo payment URL:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
