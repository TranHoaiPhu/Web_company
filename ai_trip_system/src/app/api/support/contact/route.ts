import { NextRequest, NextResponse } from "next/server";
import { BOOKING_API_URL } from "@/config/api";

export async function POST(request: NextRequest) {
  try {
    const { order, message } = await request.json();
    if (!order || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call Backend API to send email
    const res = await fetch(`${BOOKING_API_URL}/support/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error: unknown) {
    console.error("Send support email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gửi email thất bại!" },
      { status: 500 }
    );
  }
}
