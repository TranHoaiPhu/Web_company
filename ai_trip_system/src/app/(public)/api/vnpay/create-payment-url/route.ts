import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { format } from "date-fns";

// VNPay configuration
const VNP_TMN_CODE = process.env.VNP_TMNCODE || "V7ND59LX";
const VNP_HASH_SECRET = process.env.VNP_HASHSECRET || "WZOG3RRCG39GY4DWMT9G7MQMHSGBU2G4";
const VNP_URL =
  process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURN_URL =
  process.env.VNP_RETURN_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL || "https://ai-trip-system-frontend-40205731279.us-central1.run.app"}/api/vnpay/callback`;

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const amount = formData.get("amount") as string;
    const orderDesc = formData.get("order_desc") as string;
    const bankCode = formData.get("bank_code") as string;

    if (!amount || !orderDesc) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Generate unique order ID and transaction reference
    const orderId = format(new Date(), "yyyyMMddHHmmss");
    const txnRef = orderId + Math.floor(Math.random() * 1000);

    // Create VNPay parameters
    let vnpParams: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Amount: (parseInt(amount) * 100).toString(), // VNPay requires amount in VND cents
      vnp_CreateDate: format(new Date(), "yyyyMMddHHmmss"),
      vnp_CurrCode: "VND",
      vnp_IpAddr:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1",
      vnp_Locale: "vn",
      vnp_OrderInfo: orderDesc,
      vnp_OrderType: "other",
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_TxnRef: txnRef,
    };

    // Add bank code if provided
    if (bankCode && bankCode.trim()) {
      vnpParams.vnp_BankCode = bankCode;
    }

    // Sort parameters
    vnpParams = sortObject(vnpParams);

    // Create query string for signature
    const signData = new URLSearchParams(vnpParams).toString();

    // Generate HMAC SHA512 signature
    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    const signature = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Add signature to parameters
    vnpParams.vnp_SecureHash = signature;

    // Create final payment URL
    const paymentUrl =
      VNP_URL + "?" + new URLSearchParams(vnpParams).toString();

    console.log("VNPay Payment URL created:", paymentUrl);

    // Return the payment URL as plain text (to match the original form action)
    return new NextResponse(paymentUrl, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error creating VNPay payment URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
