/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/services/payments/payment.service";
import { orderService } from "@/services/orders/order.service";
import { cookies } from "next/headers";

// VNPay configuration
const VNP_HASH_SECRET = process.env.VNP_HASHSECRET || "WZOG3RRCG39GY4DWMT9G7MQMHSGBU2G4";

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

function encodeInfo(obj: any) {
  return btoa(encodeURIComponent(JSON.stringify(obj)));
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const vnpParams: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      vnpParams[key] = value;
    }

    // Verify signature
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedParams = sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    const signature = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (signature !== secureHash) {
      console.error("VNPay signature verification failed");
      return NextResponse.redirect(
        new URL("/payment?status=failed&error=signature", request.url)
      );
    }

    const {
      vnp_Amount,
      vnp_BankCode,
      vnp_OrderInfo,
      vnp_TransactionNo,
      vnp_ResponseCode,
      vnp_TransactionStatus,
    } = vnpParams;

    console.log("VNPay callback received:", vnpParams);

    let data: any = null;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const order_code = vnp_OrderInfo.split("#")[1] || vnp_OrderInfo;

    // Update DB if success
    if (vnp_ResponseCode === "00" && vnp_TransactionStatus === "00") {
      try {
        const payload = {
          order_code: order_code,
          payment_method: "VNPAY" as const,
          amount: Number(vnp_Amount) / 100,
          transaction_code: vnp_TransactionNo,
          gateway_response: vnpParams,
        };
        console.log("VNPAY SUCCESS UPDATE PAYLOAD:", payload);
        const res = await paymentService.updatePaymentForTour(payload);
        data = res;
      } catch (err) {
        console.error("VNPAY DB update error:", err);
      }
    }

    // Nếu data vẫn chưa có (thất bại hoặc DB lỗi)
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
                amount: Number(vnp_Amount) / 100,
                payment_method: "VNPAY",
                errorCode: vnp_ResponseCode,
                errorMsg: "Giao dịch không thành công",
                bankcode: vnp_BankCode,
                transaction_code: vnp_TransactionNo
              }
            }
          };
        }
      } catch (err) {
        console.error("Error fetching order info for VNPay page:", err);
        data = {
          success: true,
          data: {
            infoBooking: {
              order_code: order_code,
              name: "Đơn đặt tour của bạn"
            },
            paymentInfo: {
              amount: Number(vnp_Amount) / 100,
              payment_method: "VNPAY",
              errorCode: vnp_ResponseCode,
              bankcode: vnp_BankCode
            }
          }
        };
      }
    }

    const encoded = encodeInfo(data);
    const status = (vnp_ResponseCode === "00" && vnp_TransactionStatus === "00") ? "success" : "failed";

    return NextResponse.redirect(
      new URL(`/payment?status=${status}&info=${encoded}`, request.url),
    );
  } catch (error) {
    console.error("Error processing VNPay callback:", error);
    return NextResponse.redirect(
      new URL("/booking?payment=failed&error=processing", request.url),
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
