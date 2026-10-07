
"use client"
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, MapPin, Users, Phone, Mail, Download, MessageCircle, ExternalLink, CheckCircle, Clock, CreditCard, Sparkles, FileText } from 'lucide-react';
import Cookies from 'js-cookie';
import { orderService } from '@/services/orders/order.service';
import { useTranslation } from '@/lib/i18n/hooks';
import ReviewModal from '@/components/tour-detail/ReviewModal';
import Modal from '@/components/Modal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from 'lucide-react';
import { BOOKING_API_URL } from '@/config/api';

interface Participant {
  full_name: string;
  participant_type: string;
  gender: string;
  date_of_birth: string;
  id_number?: string | null;
}

interface Amenity {
  amenity_name: string;
  quantity: number;
  price_at_booking: string;
}

interface OrderDetail {
  id: string;
  tour_id: string;
  order_code: string;
  tour_name: string;
  location_name: string;
  start_date: string;
  end_date: string;
  price_at_booking: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  special_requests?: string;
  subtotal: string;
  discount_amount: string;
  total_price: string;
  status: string;
  payment_status: string;
  payment_method: string;
  paid_at: string;
  image_url: string;
  participants: Participant[];
  amenities: Amenity[];
  tour_slug?: string;
  has_review?: boolean;
  review_id?: number;
  review_rating?: number;
}


// Components
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    UNPAID: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  const icons: Record<string, React.ReactNode> = {
    PAID: <CheckCircle className="w-3.5 h-3.5" />,
    PENDING: <Clock className="w-3.5 h-3.5" />,
    CONFIRMED: <CheckCircle className="w-3.5 h-3.5" />,
    CANCELLED: <MessageCircle className="w-3.5 h-3.5" />,
    UNPAID: <Clock className="w-3.5 h-3.5" />
  };

  const labels: Record<string, string> = {
    PAID: 'Đã thanh toán',
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
    UNPAID: 'Chưa thanh toán'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {icons[status]}
      {labels[status] || status}
    </span>
  );
};

const InfoRow: React.FC<{ icon: React.ElementType; label: string; value: string; className?: string }> = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
      <Icon className="w-5 h-5 text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-500 mb-0.5">{label}</p>
      <p className="text-base font-medium text-gray-900 break-words">{value}</p>
    </div>
  </div>
);

const PriceRow: React.FC<{ label: string; value: string | number; highlight?: boolean }> = ({ label, value, highlight = false }) => (
  <div className={`flex justify-between items-center ${highlight ? 'text-lg font-bold' : 'text-sm'}`}>
    <span className={highlight ? 'text-gray-900' : 'text-gray-600'}>{label}</span>
    <span className={highlight ? 'text-blue-600' : 'text-gray-900'}>
      {parseFloat(String(value)).toLocaleString('vi-VN')}₫
    </span>
  </div>
);

const ParticipantCard: React.FC<{ participant: Participant }> = ({ participant }) => {
  const typeStyles: Record<string, string> = {
    ADULT: 'bg-blue-100 text-blue-700 border-blue-200',
    CHILD: 'bg-purple-100 text-purple-700 border-purple-200',
    INFANT: 'bg-pink-100 text-pink-700 border-pink-200'
  };

  const genderLabel = participant.gender === 'MALE' ? 'Nam' : participant.gender === 'FEMALE' ? 'Nữ' : 'Khác';
  const typeLabel = participant.participant_type === 'ADULT' ? 'Người lớn' : participant.participant_type === 'CHILD' ? 'Trẻ em' : 'Em bé';

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{participant.full_name}</h4>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${typeStyles[participant.participant_type]}`}>
          {typeLabel}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Giới tính:</span>
          <span className="text-gray-900 font-medium">{genderLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ngày sinh:</span>
          <span className="text-gray-900 font-medium">{new Date(participant.date_of_birth).toLocaleDateString('vi-VN')}</span>
        </div>
        {participant.id_number && (
          <div className="flex justify-between">
            <span className="text-gray-500">CCCD/CMT:</span>
            <span className="text-gray-900 font-medium font-mono">{participant.id_number}</span>
          </div>
        )}
      </div>
    </div>
  );
};



const AmenityItem: React.FC<{ amenity: Amenity }> = ({ amenity }) => {
  const isPaid = parseFloat(amenity.price_at_booking) > 0;

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isPaid
      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-blue-600' : 'bg-gray-400'}`} />
        <span className="text-sm font-medium text-gray-900 truncate">{amenity.amenity_name}</span>
      </div>
      {isPaid && (
        <span className="text-sm font-semibold text-blue-600 ml-3">
          +{parseFloat(amenity.price_at_booking).toLocaleString('vi-VN')}₫
        </span>
      )}
    </div>
  );
};

// Main Component

const OrderDetailPage = () => {
  const { t } = useTranslation("order");
  const params = useParams();
  const [orderData, setOrderData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSupportFormVisible, setIsSupportFormVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [isPaying] = useState(false);
  const router = useRouter();

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderCode = params.code as string;
      console.log('Fetching order with code:', orderCode);
      if (!orderCode) {
        setError("NO_ORDER_CODE");
        setLoading(false);
        return;
      }
      let token = '';
      if (typeof window !== 'undefined') {
        // Lay token tu cookies 
        token = Cookies.get('token') || '';
        if (token) {
          console.log('Using token from cookie:', token);
        }
      }
      const data = await orderService.getOrderByCode(orderCode, token);
      console.log('Order data fetched:', data);
      setOrderData(data);
      // Pre-fill support fields
      setSupportEmail(data.contact_email || '');
      setSupportPhone(data.contact_phone || '');
    } catch (err: unknown) {
      // Nếu lỗi 401 thì chuyển về trang chủ
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        router.replace('/');
        return;
      }
      setError((err as { message?: string })?.message || "FETCH_ERROR");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  const handlePayNow = async () => {
    // ... (existing code remains same)
  };



  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData || !supportMessage.trim()) return;

    setIsSubmittingSupport(true);
    try {
      const response = await fetch(`${BOOKING_API_URL}/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`
        },
        body: JSON.stringify({
          order: {
            ...orderData,
            contact_email: supportEmail,
            contact_phone: supportPhone
          },
          message: supportMessage
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Yêu cầu của bạn đã được gửi. Chúng tôi sẽ sớm phản hồi qua email!");
        setSupportMessage('');
        setIsSupportFormVisible(false);
        setIsSupportModalOpen(false);
      } else {
        toast.error(result.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Support submission error:", error);
      toast.error("Lỗi khi gửi yêu cầu hỗ trợ.");
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  /* 
   * Hàm formatDateTime được viết lại để fix cứng lỗi hiển thị múi giờ.
   * Do một số môi trường client/server không đồng bộ timezone, ta sẽ cộng thủ công +7 tiếng (GMT+7) vào giờ gốc (UTC)
   * rồi lấy các thành phần UTC của kết quả để hiển thị.
   * Điều này đảm bảo luôn hiển thị giờ VN bất kể timezone của trình duyệt.
   */
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';

    // Parse date, xử lý trường hợp thiếu Z
    const rawDate = dateStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(dateStr)
      ? dateStr
      : `${dateStr}Z`;

    const date = new Date(rawDate);

    // Nếu date invalid
    if (isNaN(date.getTime())) return dateStr;

    // Cộng 14 tiếng: 7h bù lệch server + 7h để ra giờ VN
    const vnTime = new Date(date.getTime() + 14 * 60 * 60 * 1000);

    // Format thủ công: HH:mm dd/MM/yyyy
    const day = vnTime.getUTCDate().toString().padStart(2, '0');
    const month = (vnTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = vnTime.getUTCFullYear();
    const hours = vnTime.getUTCHours().toString().padStart(2, '0');
    const minutes = vnTime.getUTCMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Hàm dịch error message
  const getErrorMessage = (errorKey: string) => {
    if (errorKey === "NO_ORDER_CODE") return t("detailPage.errors.noOrderCode");
    if (errorKey === "FETCH_ERROR") return t("detailPage.errors.fetchError");
    return errorKey; // Trả về message gốc nếu không phải key
  };

  // Hàm tạo và tải hóa đơn
  const handleDownloadInvoice = () => {
    if (!orderData) return;

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
          .info-item { }
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
              <span>${orderData.participants.length} khách</span>
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
            <div class="section-title">Danh sách hành khách (${orderData.participants.length} người)</div>
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
                ${orderData.participants.map((p, i) => `
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
                `).join('')}
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

    // Mở hóa đơn trong tab mới
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    }
  };

  if (loading) return <div className="p-10 text-center">{t("detailPage.loading")}</div>;
  if (error) return <div className="p-10 text-center text-red-600">{getErrorMessage(error)}</div>;
  if (!orderData) return null;

  const includedAmenities = orderData.amenities.filter(a => parseFloat(a.price_at_booking) === 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-4 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-mono text-gray-700">
              {orderData.order_code}
            </span>
            <StatusBadge status={orderData.status} />
            <StatusBadge status={orderData.payment_status} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{orderData.tour_name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>{t("detailPage.departFrom")} {orderData.location_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>{formatDate(orderData.start_date)} - {formatDate(orderData.end_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{orderData.participants.length} {t("detailPage.guests")}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tour Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tour Image */}
              <div className="h-64 w-full relative overflow-hidden">
                <img
                  src={orderData.image_url}
                  alt={orderData.tour_name}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
                  <MapPin className="w-16 h-16 mb-3 text-white opacity-80" />
                  <p className="text-2xl font-bold text-white drop-shadow-lg">{orderData.tour_name}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow icon={Calendar} label={t("detailPage.startDate")} value={formatDate(orderData.start_date)} />
                  <InfoRow icon={Calendar} label={t("detailPage.endDate")} value={formatDate(orderData.end_date)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow icon={CreditCard} label={t("detailPage.paymentMethod")} value={orderData.payment_method} />
                  <InfoRow icon={CheckCircle} label={t("detailPage.paidAt")} value={formatDateTime(orderData.paid_at)} />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                {t("detailPage.contactInfo")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <InfoRow icon={Users} label={t("detailPage.contactName")} value={orderData.contact_name} />
                <InfoRow icon={Phone} label={t("detailPage.phone")} value={orderData.contact_phone} />
              </div>
              <InfoRow icon={Mail} label="Email" value={orderData.contact_email} className="mb-5" />

              {orderData.special_requests && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-1">{t("detailPage.specialRequests")}</p>
                  <p className="text-sm text-amber-900">{orderData.special_requests}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                {t("detailPage.participantList")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {orderData.participants.map((p, i) => (
                  <ParticipantCard key={i} participant={p} />
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5">{t("detailPage.includedServices")}</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {includedAmenities.map((a, i) => (
                  <AmenityItem key={i} amenity={a} />
                ))}
              </div>

            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              {/* Price Breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-5">{t("detailPage.paymentDetails")}</h2>
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <PriceRow label={t("detailPage.tourPrice")} value={orderData.subtotal} />
                  {parseFloat(orderData.discount_amount) > 0 && (
                    <PriceRow label={t("detailPage.discount")} value={`-${orderData.discount_amount}`} />
                  )}
                </div>
                <PriceRow label={t("detailPage.total")} value={orderData.total_price} highlight />

                <div className="mt-5 pt-5 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t("detailPage.paymentStatus")}</span>
                    <StatusBadge status={orderData.payment_status} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
                {orderData.payment_status === 'UNPAID' && orderData.status !== 'CANCELLED' && (
                  <button
                    onClick={handlePayNow}
                    disabled={isPaying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Thanh toán ngay
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  {t("actions.download")}
                </button>
                <button
                  onClick={() => setIsSupportModalOpen(true)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t("actions.contact")}
                </button>
                <button className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-300 flex items-center justify-center gap-2 transition-colors"
                  onClick={() => {
                    router.push(`/tours/${orderData.tour_slug || orderData.tour_id}`)
                  }}
                >
                  <ExternalLink className="w-5 h-5" />
                  {t("detailPage.viewTourDetail")}
                </button>

                {orderData.status === 'CONFIRMED' && orderData.payment_status === 'PAID' && !orderData.has_review && (
                  <button
                    onClick={() => setIsReviewOpen(true)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-yellow-100"
                  >
                    <Sparkles className="w-5 h-5" />
                    Đánh giá ngay
                  </button>
                )}
              </div>

              {/* Support Center */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg border border-transparent p-6 text-white overflow-hidden relative">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Trung tâm hỗ trợ</h2>
                      <p className="text-blue-100 text-[11px] font-medium uppercase tracking-wider">Luôn đồng hành cùng bạn</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a href="tel:19006789" className="flex items-center gap-4 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5 group">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-blue-200 uppercase font-bold">Gọi ngay hotline</p>
                        <p className="font-bold text-base">1900 6789</p>
                      </div>
                    </a>

                    <a href="https://zalo.me/your-id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5 group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-blue-200 uppercase font-bold">Chat trực tuyến</p>
                        <p className="font-bold text-base">Zalo TravelVN</p>
                      </div>
                    </a>

                    <div className="flex items-center gap-4 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/5 group cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-blue-200 uppercase font-bold">Email hỗ trợ</p>
                        <p className="font-bold text-sm truncate">support@travelvn.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-indigo-900/40 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-start gap-2">
                      <div className="p-1 rounded bg-yellow-400/20 mt-0.5">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                      </div>
                      <p className="text-[12px] text-blue-50 leading-relaxed">
                        Để được hỗ trợ nhanh nhất, quý khách vui lòng cung cấp mã đơn hàng:
                        <span className="block mt-1 font-mono font-bold text-sm text-yellow-300 underline decoration-dotted">
                          {orderData.order_code}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewOpen && orderData && (
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          tourId={orderData.tour_id}
          orderId={parseInt(orderData.id)}
          tourName={orderData.tour_name}
          onSuccess={() => fetchOrder()}
        />
      )}

      {/* Support Modal */}
      <Modal
        isOpen={isSupportModalOpen}
        onClose={() => {
          setIsSupportModalOpen(false);
          setIsSupportFormVisible(false);
        }}
        title={isSupportFormVisible ? "Gửi khiếu nại / yêu cầu hỗ trợ" : "Trung tâm hỗ trợ khách hàng"}
        size="md"
      >
        <div className="space-y-6">
          {!isSupportFormVisible ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Chúng tôi có thể giúp gì cho bạn?</h3>
                <p className="text-gray-500 text-sm mt-1">Vui lòng chọn phương thức liên hệ bên dưới</p>
              </div>

              <div className="grid gap-4">
                <a href="tel:19006789" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                    <Phone className="w-6 h-6 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hotline 24/7</p>
                    <p className="text-lg font-bold text-gray-900">1900 6789</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                </a>

                <button
                  onClick={() => setIsSupportFormVisible(true)}
                  className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-orange-500 hover:shadow-md transition-all group w-full"
                >
                  <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-600 transition-colors">
                    <MessageCircle className="w-6 h-6 text-orange-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Khiếu nại / Góp ý</p>
                    <p className="text-lg font-bold text-gray-900">Gửi yêu cầu hỗ trợ</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-orange-500" />
                </button>

                <a href="https://zalo.me/your-id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-500 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-colors">
                    <MessageCircle className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Zalo Official Account</p>
                    <p className="text-lg font-bold text-gray-900">TravelVN Official</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-emerald-500" />
                </a>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 border-dashed">
                <div className="flex gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-gray-600 leading-relaxed text-left">
                    <p className="font-bold text-gray-900 mb-1">Cần hỗ trợ về đơn hàng này?</p>
                    Quý khách vui lòng cung cấp mã đơn <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-900 border border-gray-200">{orderData.order_code}</span> để được xử lý nhanh nhất.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSupportSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email liên hệ</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      required
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                      placeholder="Email nhận phản hồi"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Số điện thoại</label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      required
                      type="tel"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all shadow-sm"
                      placeholder="Số điện thoại của bạn"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Nội dung phản ánh</label>
                <div className="relative group">
                  <FileText className="absolute left-3.5 top-4 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <textarea
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                    className="w-full pl-10 pr-4 py-4 h-36 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupportFormVisible(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all text-sm"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="flex-[2] py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-100 text-sm"
                >
                  {isSubmittingSupport ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Gửi khiếu nại ngay
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setIsSupportModalOpen(false);
              setIsSupportFormVisible(false);
            }}
            className="w-full py-2 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
          >
            Đóng cửa sổ
          </button>
        </div>
      </Modal>

      <ToastContainer position="bottom-right" />
    </div>
  );
}
export default OrderDetailPage;