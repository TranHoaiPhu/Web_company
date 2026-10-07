/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/services/payments/payment.service";
import { orderService } from "@/services/orders/order.service";
import { cookies } from "next/headers";

// MoMo configuration
const MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
const MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";

function encodeInfo(obj: any) {
    return btoa(encodeURIComponent(JSON.stringify(obj)));
}

function parseOrderCode(orderId: string): string {
    if (!orderId) return "";
    const parts = orderId.split("_");
    // Nếu có dạng ORD-123_timestamp thì lấy phần đầu, còn không thì lấy nguyên orderId
    return parts.length > 1 ? parts.slice(0, -1).join("_") : orderId;
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const params: Record<string, string> = {};

        // Extract all query parameters
        for (const [key, value] of url.searchParams.entries()) {
            params[key] = value;
        }

        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = params;

        console.log("MoMo callback received:", params);

        // Verify signature
        const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const expectedSignature = crypto
            .createHmac("sha256", MOMO_SECRET_KEY)
            .update(rawSignature)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("MoMo signature verification failed");
            // Vẫn redirect nhưng báo lỗi signature
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ai-trip-system-frontend-40205731279.us-central1.run.app";
            return NextResponse.redirect(
                new URL("/payment?status=failed&error=signature", appUrl)
            );
        }

        let data: any = null;
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        const order_code = parseOrderCode(orderId);

        // Trường hợp THÀNH CÔNG (resultCode = "0")
        if (resultCode === "0") {
            try {
                const payload = {
                    order_code: order_code,
                    payment_method: "MOMO" as const,
                    amount: Number(amount),
                    transaction_code: transId,
                    gateway_response: {
                        partnerCode,
                        orderId,
                        requestId,
                        amount,
                        orderInfo,
                        orderType,
                        transId,
                        resultCode: Number(resultCode),
                        message,
                        payType,
                        responseTime,
                        extraData
                    }
                };

                console.log("MOMO SUCCESS UPDATE PAYLOAD:", payload);
                const res = await paymentService.updatePaymentForTour(payload);
                data = res;
            } catch (err) {
                console.error("MOMO DB update error:", err);
            }
        }

        // Ta cố gắng lấy info order để hiển thị
        if (!data || !data.success) {
            try {
                const orderRes = await orderService.getOrderByCode(order_code, token);
                if (orderRes) {
                    data = {
                        success: true,
                        data: {
                            infoBooking: {
                                order_code: orderRes.order_code,
                                name: orderRes.tour_name,
                                adult_quantity: orderRes.adult_quantity,
                                child_quantity: orderRes.child_quantity,
                                infant_quantity: orderRes.infant_quantity
                            },
                            paymentInfo: {
                                amount: amount,
                                payment_method: "MOMO",
                                errorCode: resultCode,
                                errorMsg: message,
                                transaction_code: transId
                            }
                        }
                    };
                }
            } catch (err) {
                console.error("Error fetching order info for MoMo page:", err);
                data = {
                    success: true,
                    data: {
                        infoBooking: {
                            order_code: order_code,
                            name: "Đơn đặt tour của bạn"
                        },
                        paymentInfo: {
                            amount: amount,
                            payment_method: "MOMO",
                            errorCode: resultCode,
                            errorMsg: message
                        }
                    }
                };
            }
        }

        const encoded = encodeInfo(data);
        const status = resultCode === "0" ? "success" : "failed";

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ai-trip-system-frontend-40205731279.us-central1.run.app";

        return NextResponse.redirect(
            new URL(`/payment?status=${status}&info=${encoded}`, appUrl)
        );

    } catch (error) {
        console.error("Error processing MoMo callback:", error);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ai-trip-system-frontend-40205731279.us-central1.run.app";
        return NextResponse.redirect(
            new URL("/booking?payment=failed&error=processing", appUrl)
        );
    }
}

export async function POST(request: NextRequest) {
    // Handle POST callback from MoMo (IPN - Instant Payment Notification)
    try {
        const body = await request.json();

        const {
            partnerCode,
            orderId,
            requestId,
            amount,
            orderInfo,
            orderType,
            transId,
            resultCode,
            message,
            payType,
            responseTime,
            extraData,
            signature
        } = body;

        console.log("MoMo IPN received:", body);

        // Verify signature
        const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const expectedSignature = crypto
            .createHmac("sha256", MOMO_SECRET_KEY)
            .update(rawSignature)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("MoMo IPN signature verification failed");
            return NextResponse.json(
                { success: false, message: "Invalid signature" },
                { status: 400 }
            );
        }

        // Update database if payment successful
        if (resultCode === 0) {
            try {
                const order_code = parseOrderCode(orderId);
                const payload = {
                    order_code: order_code,
                    payment_method: "MOMO" as const,
                    amount: Number(amount),
                    transaction_code: transId,
                    gateway_response: body
                };

                await paymentService.updatePaymentForTour(payload);
                console.log("MoMo IPN: Payment updated successfully");
            } catch (err) {
                console.error("MoMo IPN: DB update error:", err);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Notification received"
        });
    } catch (error) {
        console.error("Error processing MoMo IPN:", error);
        return NextResponse.json(
            { success: false, message: "Processing error" },
            { status: 500 }
        );
    }
}
