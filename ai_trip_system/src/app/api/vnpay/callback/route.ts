/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/services/payments/payment.service";

// VNPay configuration
const VNP_HASH_SECRET =
  process.env.VNP_HASHSECRET || "WZOG3RRCG39GY4DWMT9G7MQMHSGBU2G4";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ai-trip-system-frontend-40205731279.us-central1.run.app";

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

    // Extract transaction info
    const {
      vnp_Amount,
      vnp_BankCode,
      vnp_OrderInfo,
      vnp_PayDate,
      vnp_TmnCode,
      vnp_TxnRef,
      vnp_TransactionNo,
      vnp_ResponseCode,
      vnp_TransactionStatus,
      vnp_CardType,
      vnp_BankTranNo,
    } = vnpParams;

    console.log("VNPay callback received:", vnpParams);

    // Verify signature FIRST
    if (signature !== secureHash) {
      console.error("VNPay signature verification failed");
      return NextResponse.redirect(new URL("/payment?status=failed&error=signature", appUrl));
    }

    // Check if payment was successful
    const isSuccess = vnp_ResponseCode === "00" && vnp_TransactionStatus === "00";

    // Extract order code
    const order_code = vnp_OrderInfo.split("#")[1] || vnp_OrderInfo;

    // Only update DB if payment was successful
    if (isSuccess) {
      try {
        const payload = {
          order_code: order_code,
          payment_method: "VNPAY" as const,
          amount: Number(vnp_Amount) / 100, // VNPay trả về số tiền * 100
          transaction_code: vnp_TransactionNo,
          gateway_response: {
            vnp_Amount,
            vnp_BankCode,
            vnp_OrderInfo,
            vnp_PayDate,
            vnp_TmnCode,
            vnp_TxnRef,
            vnp_TransactionNo,
            vnp_ResponseCode,
            vnp_TransactionStatus,
            vnp_CardType,
            vnp_BankTranNo,
          },
        };
        console.log("PAYMENT UPDATE PAYLOAD:", payload);
        const res = await paymentService.updatePaymentForTour(payload);
        console.log("Payment record updated in DB:", res);

        const encoded = encodeInfo(res);
        console.log("VNPay payment successful:", vnp_TxnRef);
        return NextResponse.redirect(new URL(`/payment?status=success&info=${encoded}`, appUrl));
      } catch (err) {
        console.error("DB update error:", err);
        // Even if DB update fails, redirect to success page with order info
        const fallbackData = { order_code, amount: Number(vnp_Amount) / 100 };
        const encoded = encodeInfo(fallbackData);
        return NextResponse.redirect(new URL(`/payment?status=success&info=${encoded}`, appUrl));
      }
    } else {
      // Payment failed - redirect immediately without DB update
      console.log("VNPay payment failed:", vnp_ResponseCode, vnp_TransactionStatus);

      // Create failed payment info for display
      const failedData = {
        order_code,
        amount: Number(vnp_Amount) / 100,
        error_code: vnp_ResponseCode,
        bank_code: vnp_BankCode,
      };
      const encoded = encodeInfo(failedData);
      return NextResponse.redirect(new URL(`/payment?status=failed&info=${encoded}`, appUrl));
    }
  } catch (error) {
    console.error("Error processing VNPay callback:", error);
    return NextResponse.redirect(new URL("/payment?status=failed&error=processing", appUrl));
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
