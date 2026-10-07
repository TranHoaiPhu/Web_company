/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Home,
  Eye,
  Download,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/hooks";
import { orderService } from "@/services/orders/order.service";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const decodePayment = (encoded: string | null) => {
  if (!encoded) return null;
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
};

// Helper để format giờ VN chuẩn xác
const formatDateTimeVn = (dateInput: string | Date) => {
  if (!dateInput) return "";

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(dateInput);
  }
};

// Demo component - toggle between success/failure states
export default function PaymentResult() {
  const { t: tPayment } = useTranslation("payment");
  const params = useSearchParams();
  const status = params.get("status") || "success";

  // Decode raw info from URL
  const rawData = useMemo(() => decodePayment(params.get("info")), [params]);

  console.log("Raw decoded payment info:", rawData);

  // Check if this is a nested data structure (success case from API) 
  // or flat structure (failed case directly from VNPay callback)
  const isNestedData = rawData?.data !== undefined;
  const paymentData = isNestedData ? rawData.data : rawData;

  // For success case - extract from nested structure
  const paymentInfo = paymentData?.paymentInfo;
  const infoBooking = paymentData?.infoBooking;

  // For failed case - extract from flat structure
  const failedOrderCode = rawData?.order_code;
  const failedAmount = rawData?.amount;
  const failedErrorCode = rawData?.error_code;
  const failedBankCode = rawData?.bank_code;

  // VNPay error code mapping
  const vnpayErrorMessages: Record<string, string> = {
    "00": "Giao dịch thành công",
    "07": "Trừ tiền thành công, giao dịch bị nghi ngờ (liên quan đến lừa đảo, giao dịch bất thường)",
    "09": "Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng",
    "10": "Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
    "11": "Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch",
    "12": "Thẻ/Tài khoản của quý khách bị khóa",
    "13": "Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)",
    "24": "Quý khách đã hủy giao dịch",
    "51": "Tài khoản của quý khách không đủ số dư để thực hiện giao dịch",
    "65": "Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày",
    "75": "Ngân hàng thanh toán đang bảo trì",
    "79": "Quý khách nhập sai mật khẩu thanh toán quá số lần quy định",
    "99": "Lỗi không xác định",
  };

  // State for fetched order details (for failed/cancelled cases)
  const [fetchedOrder, setFetchedOrder] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Determine if we have valid data from the initial info param
  const hasSuccessData = infoBooking && paymentInfo;

  // Extract order code for fetching if needed
  const orderCodeToFetch = isNestedData ? infoBooking?.order_code : rawData?.order_code;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderCodeToFetch || hasSuccessData || isFetching) return;

      setIsFetching(true);
      try {
        const token = Cookies.get("token") || "";
        const orderData = await orderService.getOrderByCode(orderCodeToFetch, token);
        if (orderData) {
          console.log("Fetched order details:", orderData);
          setFetchedOrder(orderData);
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchOrderDetails();
  }, [orderCodeToFetch, hasSuccessData]);

  // Combine data: use nested data if available, otherwise use fetched data
  const displayBooking = infoBooking || fetchedOrder;
  const displayAmount = paymentInfo?.amount || failedAmount;
  console.log("Display booking:", displayBooking);
  console.log("Display amount:", displayAmount);

  // Build uiData for success case
  const successUiData = {
    bookingId: displayBooking?.order_code || "#BK123456",
    tourName: displayBooking?.name || "Tour du lịch",
    people: [
      displayBooking?.adult_quantity
        ? `${displayBooking?.adult_quantity} ${tPayment("summary.adults")}`
        : "",
      displayBooking?.child_quantity
        ? `${displayBooking?.child_quantity} ${tPayment("summary.children")}`
        : "",
      displayBooking?.infant_quantity
        ? `${displayBooking?.infant_quantity} ${tPayment("summary.infants")}`
        : "",
    ]
      .filter(Boolean)
      .join(", "),
    amount: displayAmount
      ? Number(displayAmount).toLocaleString("vi-VN") + "₫"
      : "",
    txnRef: paymentInfo?.transaction_code || "",
    time: paymentInfo?.paid_at
      ? formatDateTimeVn(paymentInfo.paid_at)
      : formatDateTimeVn(new Date()),
    paymentMethod: paymentInfo?.payment_method || "VNPay",
    bankCode: paymentInfo?.bankcode || "",
    errorCode: "",
    errorMsg: "",
  };



  // Build uiData for failed case (from VNPay callback)
  const failedUiData = {
    bookingId: orderCodeToFetch || "#BK123456",
    tourName: displayBooking?.tour_name || "Đơn hàng thanh toán thất bại",
    people: [
      displayBooking?.adult_quantity
        ? `${displayBooking?.adult_quantity} ${tPayment("summary.adults")}`
        : "",
      displayBooking?.child_quantity
        ? `${displayBooking?.child_quantity} ${tPayment("summary.children")}`
        : "",
      displayBooking?.infant_quantity
        ? `${displayBooking?.infant_quantity} ${tPayment("summary.infants")}`
        : "",
    ]
      .filter(Boolean)
      .join(", "),
    amount: displayAmount ? Number(displayAmount).toLocaleString("vi-VN") + "₫" : "",
    txnRef: "",
    time: formatDateTimeVn(new Date()),
    paymentMethod: "VNPay",
    bankCode: failedBankCode || "",
    errorCode: failedErrorCode || "",
    errorMsg: vnpayErrorMessages[failedErrorCode || "99"] || "Giao dịch thất bại",
  };

  console.log("Success UI Data:", successUiData);
  console.log("Failed UI Data:", failedUiData);
  // Determine if we should show real failed data
  const hasFailedData = orderCodeToFetch || failedAmount || failedErrorCode;

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      {status === "success" && hasSuccessData && (
        <PaymentSuccess data={successUiData} />
      )}
      {status === "success" && !hasSuccessData && (
        <InvalidPayment />
      )}
      {status === "failed" && (
        <PaymentFailed data={hasFailedData ? failedUiData : {
          bookingId: "Không xác định",
          tourName: "Giao dịch thất bại",
          people: "",
          amount: "",
          errorCode: "99",
          errorMsg: "Không thể xác minh thông tin giao dịch",
          time: formatDateTimeVn(new Date()),
        }} isFetching={isFetching} />
      )}
      {status === "cancelled" && (
        <PaymentCancelled data={{
          bookingId: orderCodeToFetch || "Không xác định",
          tourName: displayBooking?.name || "Giao dịch đã hủy",
          amount: displayAmount ? Number(displayAmount).toLocaleString("vi-VN") + "₫" : "",
          people: [
            displayBooking?.adult_quantity
              ? `${displayBooking?.adult_quantity} ${tPayment("summary.adults")}`
              : "",
            displayBooking?.child_quantity
              ? `${displayBooking?.child_quantity} ${tPayment("summary.children")}`
              : "",
            displayBooking?.infant_quantity
              ? `${displayBooking?.infant_quantity} ${tPayment("summary.infants")}`
              : "",
          ]
            .filter(Boolean)
            .join(", "),
          time: formatDateTimeVn(new Date()),
        }} isFetching={isFetching} />
      )}
    </div>
  );
}

// Invalid/Fake Payment Attempt Component
function InvalidPayment() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4" />
          </div>
          <div
            className={`relative z-10 transition-all duration-700 ${mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          >
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4 backdrop-blur-sm">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Thông tin không hợp lệ</h1>
            <p className="text-amber-100 mt-2">Không thể xác minh giao dịch thanh toán</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Không thể hiển thị thông tin thanh toán</p>
                <p>
                  Dữ liệu thanh toán không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại
                  trạng thái đơn hàng trong phần <strong>Lịch sử đơn hàng</strong> của bạn.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Nếu bạn vừa thanh toán thành công, đơn hàng sẽ được cập nhật trong vài phút.</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={() => router.push("/order-history")}
              className="flex items-center justify-center gap-2 bg-amber-600 text-white font-semibold py-3 px-4 rounded-xl shadow hover:bg-amber-700 transition-all hover:shadow-lg"
            >
              <Eye className="w-4 h-4" />
              Xem đơn hàng
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl shadow hover:shadow-lg transition-all hover:bg-gray-50"
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              <span>1900-xxxx</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              <span>support@travelvn.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Success Page Component
function PaymentSuccess({ data }: { data: any }) {
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownloadInvoice = async () => {
    if (!data.bookingId || data.bookingId.startsWith('#')) {
      toast.error("Không tìm thấy mã đơn hàng hợp lệ để tải hóa đơn.");
      return;
    }

    setIsDownloading(true);
    try {
      const token = Cookies.get('token') || '';
      const orderData = await orderService.getOrderByCode(data.bookingId, token);

      if (!orderData) {
        throw new Error("Không lấy được dữ liệu đơn hàng");
      }

      const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return String(dateInput);
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'Asia/Ho_Chi_Minh'
        });
      };
      const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Hóa đơn - ${orderData.order_code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
            .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
            .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
            .logo span { color: #1e40af; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { font-size: 24px; color: #333; margin-bottom: 8px; }
            .invoice-info p { color: #666; font-size: 14px; }
            .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
            .status.paid { background: #dcfce7; color: #166534; }
            .status.confirmed { background: #dbeafe; color: #1e40af; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
            .info-value { font-size: 14px; color: #111827; font-weight: 500; }
            .tour-box { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
            .tour-name { font-size: 22px; font-weight: bold; margin-bottom: 10px; }
            .tour-detail { font-size: 14px; opacity: 0.9; display: flex; gap: 20px; flex-wrap: wrap; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 13px; }
            td { font-size: 14px; color: #111827; }
            .participant-type { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .type-adult { background: #dbeafe; color: #1e40af; }
            .type-child { background: #f3e8ff; color: #7c3aed; }
            .type-infant { background: #fce7f3; color: #be185d; }
            .price-section { background: #f9fafb; padding: 25px; border-radius: 12px; margin-top: 30px; }
            .price-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .price-row.total { font-size: 20px; font-weight: bold; color: #3b82f6; padding-top: 15px; margin-top: 10px; border-top: 2px solid #e5e7eb; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
            .footer p { margin-bottom: 5px; }
            @media print {
              body { padding: 0; background: white; }
              .invoice { box-shadow: none; padding: 20px; }
              .no-print { display: none !important; }
            }
            .print-btn { position: fixed; top: 20px; right: 20px; background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
            .print-btn:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <button class="print-btn no-print" onclick="window.print()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7"></path>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"></path>
              <path d="M6 14h12v8H6z"></path>
            </svg>
            In hóa đơn / Lưu PDF
          </button>
          
          <div class="invoice">
            <div class="header">
              <div class="logo">Travel<span>VN</span></div>
              <div class="invoice-info">
                <h2>HÓA ĐƠN</h2>
                <p><strong>Mã đơn:</strong> ${orderData.order_code}</p>
                <p><strong>Ngày tạo:</strong> ${formatDate(orderData.start_date)}</p>
                <span class="status ${orderData.payment_status === 'PAID' ? 'paid' : 'confirmed'}">
                  ${orderData.payment_status === 'PAID' ? '✓ Đã thanh toán' : 'Chờ thanh toán'}
                </span>
              </div>
            </div>

            <div class="tour-box">
              <div class="tour-name">${orderData.tour_name}</div>
              <div class="tour-detail">
                <span>${orderData.location_name || 'Việt Nam'}</span>
                <span>${formatDate(orderData.start_date)} - ${formatDate(orderData.end_date)}</span>
                <span>${orderData.participants?.length || 0} khách</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Thông tin liên hệ</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Họ và tên</div>
                  <div class="info-value">${orderData.contact_name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Số điện thoại</div>
                  <div class="info-value">${orderData.contact_phone}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${orderData.contact_email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phương thức thanh toán</div>
                  <div class="info-value">${orderData.payment_method || 'VNPay'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Danh sách hành khách (${orderData.participants?.length || 0} người)</div>
              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Họ và tên</th>
                    <th>Loại khách</th>
                    <th>Giới tính</th>
                    <th>Ngày sinh</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderData.participants?.map((p: any, i: number) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td><strong>${p.full_name}</strong></td>
                      <td>
                        <span class="participant-type type-${p.participant_type.toLowerCase()}">
                          ${p.participant_type === 'ADULT' ? 'Người lớn' : p.participant_type === 'CHILD' ? 'Trẻ em' : 'Em bé'}
                        </span>
                      </td>
                      <td>${p.gender === 'MALE' ? 'Nam' : p.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</td>
                      <td>${new Date(p.date_of_birth).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>

            <div class="price-section">
              <div class="section-title" style="border: none; margin-bottom: 10px;">Chi tiết thanh toán</div>
              <div class="price-row">
                <span>Giá tour</span>
                <span>${parseFloat(orderData.subtotal).toLocaleString('vi-VN')}₫</span>
              </div>
              ${parseFloat(orderData.discount_amount) > 0 ? `
                <div class="price-row" style="color: #16a34a;">
                  <span>Giảm giá</span>
                  <span>-${parseFloat(orderData.discount_amount).toLocaleString('vi-VN')}₫</span>
                </div>
              ` : ''}
              <div class="price-row total">
                <span>Tổng cộng</span>
                <span>${parseFloat(orderData.total_price).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            <div class="footer">
              <p><strong>TravelVN</strong> - Nền tảng đặt tour du lịch hàng đầu Việt Nam</p>
              <p>Hotline: 1900 0000 | Email: support@travelvn.com</p>
              <p style="margin-top: 15px; font-size: 12px;">Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
      }
    } catch (error: any) {
      console.error("Lỗi khi tải hóa đơn:", error);
      toast.error(error.message || "Không thể tải hóa đơn. Vui lòng thử lại sau.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full opacity-20 blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl animate-float-delayed"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Success Icon */}
        <div
          className={`flex justify-center mb-6 transition-all duration-700 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 shadow-2xl">
              <CheckCircle
                className="w-16 h-16 text-white animate-draw-check"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          className={`text-center mb-8 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600 text-lg">
            Đơn đặt tour của bạn đã được xác nhận
          </p>
        </div>

        {/* Payment Card */}
        <div
          className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="space-y-4">
            <InfoRow
              label="Mã đơn"
              value={data.bookingId}
              delay={400}
              mounted={mounted}
              valueClass="text-blue-600 font-semibold"
            />
            <InfoRow
              label="Tour"
              value={data.tourName}
              delay={450}
              mounted={mounted}
            />
            <InfoRow
              label="Số người"
              value={data.people}
              delay={500}
              mounted={mounted}
            />
            <div
              className={`h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent transition-all duration-700 delay-550 ${mounted ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
            ></div>
            <InfoRow
              label="Tổng tiền"
              value={data.amount}
              delay={600}
              mounted={mounted}
              valueClass="text-green-600 font-bold text-xl"
            />
            <InfoRow
              label="Phương thức"
              value={
                <span className="flex items-center gap-2">
                  {data.paymentMethod}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    {data.bankCode}
                  </span>
                </span>
              }
              delay={650}
              mounted={mounted}
            />
            <InfoRow
              label="Thời gian"
              value={data.time}
              delay={700}
              mounted={mounted}
            />
            <InfoRow
              label="Mã GD"
              value={data.txnRef}
              delay={750}
              mounted={mounted}
              valueClass="font-mono text-sm"
            />
          </div>

          {/* Status Badge */}
          <div
            className={`mt-6 flex items-center justify-between transition-all duration-700 delay-800 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold text-sm animate-pulse-slow">
              <CheckCircle className="w-4 h-4" />
              Đã thanh toán
            </span>
            <img
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='24' viewBox='0 0 60 24'%3E%3Ctext x='0' y='16' font-family='Arial' font-size='14' font-weight='bold' fill='%230066CC'%3EVNPay%3C/text%3E%3C/svg%3E"
              alt="VNPay"
              className="h-6"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 transition-all duration-700 delay-900 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <button
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => router.push(`/order-history/${data.bookingId}`)}
          >
            <Eye className="w-4 h-4" />
            Chi tiết
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-semibold py-3 px-4 rounded-xl shadow hover:shadow-lg transition-all hover:scale-105 active:scale-95 hover:bg-blue-50"
            onClick={() => router.push("/")}
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl shadow hover:shadow-lg transition-all hover:scale-105 active:scale-95 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Hóa đơn
          </button>
        </div>

        {/* Support Info */}
        <div
          className={`text-center text-gray-500 text-sm space-y-2 transition-all duration-700 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-medium text-gray-700">Cần hỗ trợ?</p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="tel:18001234"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition hover:scale-105"
            >
              <Phone className="w-4 h-4" />
              1800 1234
            </a>
            <a
              href="mailto:support@travelVN.com"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition hover:scale-105"
            >
              <Mail className="w-4 h-4" />
              support@travelVN.com
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// Failed Page Component
function PaymentFailed({ data, isFetching }: { data: any; isFetching?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getErrorMessage = (code: string | number) => {
    const errors: Record<string, string> = {
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "Thẻ chưa đăng ký Internet Banking",
      "10": "Xác thực không đúng quá 3 lần",
      "11": "Đã hết hạn chờ thanh toán",
      "12": "Thẻ/Tài khoản bị khóa",
      "13": "Sai mật khẩu OTP",
      "24": "Khách hàng hủy giao dịch",
      "51": "Tài khoản không đủ số dư",
      "65": "Vượt quá hạn mức giao dịch",
      "75": "Ngân hàng đang bảo trì",
      "79": "Sai mật khẩu quá số lần quy định",
      "99": "Lỗi không xác định",
    };
    return errors[String(code)] || "Giao dịch không thành công";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full opacity-10 blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full opacity-10 blur-3xl animate-float-delayed"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Error Icon */}
        <div
          className={`flex justify-center mb-6 transition-all duration-700 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
        >
          <div className="relative">
            <div className="relative bg-gradient-to-br from-red-400 to-red-600 rounded-full p-6 shadow-2xl">
              <XCircle
                className="w-16 h-16 text-white animate-shake"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          className={`text-center mb-8 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-600 text-lg">
            Giao dịch của bạn không thể hoàn tất
          </p>
        </div>

        {/* Error Card */}
        <div
          className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-red-100 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Error Alert */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">
                Mã lỗi: {data.errorCode}
              </p>
              <p className="text-red-700 text-sm">
                {getErrorMessage(data.errorCode)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow
              label="Mã đơn"
              value={data.bookingId}
              delay={400}
              mounted={mounted}
            />
            <InfoRow
              label="Tour"
              value={isFetching ? "Đang tải..." : data.tourName}
              delay={450}
              mounted={mounted}
              valueClass={isFetching ? "text-gray-400 animate-pulse" : ""}
            />
            <InfoRow
              label="Số người"
              value={isFetching ? "Đang tải..." : data.people}
              delay={500}
              mounted={mounted}
              valueClass={isFetching ? "text-gray-400 animate-pulse" : ""}
            />
            <div
              className={`h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent transition-all duration-700 delay-550 ${mounted ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
            ></div>
            <InfoRow
              label="Số tiền"
              value={data.amount}
              delay={600}
              mounted={mounted}
              valueClass="text-gray-700 font-bold text-xl"
            />
            <InfoRow
              label="Thời gian"
              value={data.time}
              delay={650}
              mounted={mounted}
            />
          </div>

          {/* Status Badge */}
          <div
            className={`mt-6 transition-all duration-700 delay-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
              <XCircle className="w-4 h-4" />
              Thanh toán thất bại
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 transition-all duration-700 delay-800 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <button
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => router.push(`/order-history/${data.bookingId}`)}
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl shadow hover:shadow-lg transition-all hover:scale-105 active:scale-95 hover:bg-gray-50"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {/* Help Section */}
        <div
          className={`bg-blue-50 rounded-xl p-4 mb-6 transition-all duration-700 delay-900 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-semibold text-blue-900 mb-2">Cần giúp đỡ?</p>
          <ul className="text-sm text-blue-800 space-y-1.5 list-disc list-inside">
            <li>Kiểm tra số dư tài khoản</li>
            <li>Đảm bảo thẻ đã kích hoạt thanh toán online</li>
            <li>Thử lại với phương thức thanh toán khác</li>
          </ul>
        </div>

        {/* Support Info */}
        <div
          className={`text-center text-gray-500 text-sm space-y-2 transition-all duration-700 delay-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-medium text-gray-700">Liên hệ hỗ trợ</p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="tel:18001234"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition hover:scale-105"
            >
              <Phone className="w-4 h-4" />
              1800 1234
            </a>
            <a
              href="mailto:[EMAIL_ADDRESS]"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition hover:scale-105"
            >
              <Mail className="w-4 h-4" />
              [EMAIL_ADDRESS]
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px) rotate(-5deg);
          }
          75% {
            transform: translateX(4px) rotate(5deg);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Cancelled Page Component
function PaymentCancelled({ data, isFetching }: { data: any; isFetching?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full opacity-10 blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-200 rounded-full opacity-10 blur-3xl animate-float-delayed"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Warning Icon */}
        <div
          className={`flex justify-center mb-6 transition-all duration-700 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}
        >
          <div className="relative">
            <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-6 shadow-2xl">
              <AlertCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          className={`text-center mb-8 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Đã hủy thanh toán
          </h1>
          <p className="text-gray-600 text-lg">
            Bạn đã hủy giao dịch thanh toán
          </p>
        </div>

        {/* Info Card */}
        <div
          className={`bg-white rounded-2xl shadow-xl p-6 mb-6 border border-orange-100 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="space-y-4">
            <InfoRow
              label="Mã đơn"
              value={data.bookingId}
              delay={400}
              mounted={mounted}
            />
            <InfoRow
              label="Tour"
              value={isFetching ? "Đang tải..." : data.tourName}
              delay={450}
              mounted={mounted}
              valueClass={isFetching ? "text-gray-400 animate-pulse" : ""}
            />
            <InfoRow
              label="Số người"
              value={isFetching ? "Đang tải..." : data.people}
              delay={500}
              mounted={mounted}
              valueClass={isFetching ? "text-gray-400 animate-pulse" : ""}
            />
            <div
              className={`h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent transition-all duration-700 delay-500 ${mounted ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
            ></div>
            <InfoRow
              label="Số tiền"
              value={data.amount}
              delay={550}
              mounted={mounted}
              valueClass="text-gray-700 font-bold text-xl"
            />
            <InfoRow
              label="Thời gian"
              value={data.time}
              delay={600}
              mounted={mounted}
            />
          </div>

          {/* Status Badge */}
          <div
            className={`mt-6 transition-all duration-700 delay-650 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm">
              <AlertCircle className="w-4 h-4" />
              Đã hủy bởi người dùng
            </span>
          </div>
        </div>

        {/* Info Message */}
        <div
          className={`bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 transition-all duration-700 delay-700 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-orange-800 text-sm">
            <strong>Lưu ý:</strong> Tour của bạn vẫn chưa được đặt. Vui lòng
            hoàn tất thanh toán để xác nhận đơn hàng.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 transition-all duration-700 delay-800 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <button
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            onClick={() => router.push(`/order-history/${data.bookingId}`)}
          >
            <RefreshCw className="w-4 h-4" />
            Thanh toán lại
          </button>
          <button
            className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl shadow hover:shadow-lg transition-all hover:scale-105 active:scale-95 hover:bg-gray-50"
            onClick={() => router.push("/")}
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>

        {/* Support Info */}
        <div
          className={`text-center text-gray-500 text-sm space-y-2 transition-all duration-700 delay-900 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <p className="font-medium text-gray-700">Cần hỗ trợ?</p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="tel:18001234"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition hover:scale-105"
            >
              <Phone className="w-4 h-4" />
              1800 1234
            </a>
            <a
              href="mailto:support@travelVN.com"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition hover:scale-105"
            >
              <Mail className="w-4 h-4" />
              support@travelVN.com
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Helper Component for Info Rows
function InfoRow({
  label,
  value,
  delay,
  mounted,
  valueClass = ""
}: {
  label: string;
  value: string | React.ReactNode;
  delay: number;
  mounted: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between transition-all duration-500 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="text-gray-500 font-medium">{label}:</span>
      <span className={`text-gray-800 ${valueClass}`}>{value}</span>
    </div>
  );
}
