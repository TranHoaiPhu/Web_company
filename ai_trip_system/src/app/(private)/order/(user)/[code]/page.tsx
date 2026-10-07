"use client"
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, MapPin, Users, Phone, Mail, Download, MessageCircle, ExternalLink, CheckCircle, Clock, CreditCard } from 'lucide-react';
import Cookies from 'js-cookie';
import { orderService } from '@/services/orders/order.service';

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
  tour_slug?: string;
  amenities: Amenity[];
}


// Components
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  const icons: Record<string, React.ReactNode> = {
    PAID: <CheckCircle className="w-3.5 h-3.5" />,
    PENDING: <Clock className="w-3.5 h-3.5" />,
    CONFIRMED: <CheckCircle className="w-3.5 h-3.5" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {icons[status]}
      {status === 'PAID' ? 'Đã thanh toán' : status === 'PENDING' ? 'Chờ xác nhận' : 'Đã xác nhận'}
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
  const params = useParams();
  const [orderData, setOrderData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const orderCode = params.code as string;
        if (!orderCode) {
          setError('Không tìm thấy mã đơn hàng trên URL.');
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
        setOrderData(data);
      } catch (err: unknown) {
        // Nếu lỗi 401 thì chuyển về trang chủ
        if ((err as { response?: { status?: number } })?.response?.status === 401) {
          router.replace('/');
          return;
        }
        setError((err as { message?: string })?.message || 'Lỗi khi lấy dữ liệu đơn hàng.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [params.code, router]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  /* 
   * Hàm formatDateTime được viết lại để fix cứng lỗi hiển thị múi giờ.
   * Cộng thủ công +7 tiếng (GMT+7) vào giờ gốc (UTC)
   */
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const rawDate = dateStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : `${dateStr}Z`;

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return dateStr;

    // Cộng 14 tiếng: 7h bù lệch server + 7h để ra giờ VN
    const vnTime = new Date(date.getTime() + 14 * 60 * 60 * 1000);
    const day = vnTime.getUTCDate().toString().padStart(2, '0');
    const month = (vnTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = vnTime.getUTCFullYear();
    const hours = vnTime.getUTCHours().toString().padStart(2, '0');
    const minutes = vnTime.getUTCMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu đơn hàng...</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
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
              <span>Khởi hành từ {orderData.location_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>{formatDate(orderData.start_date)} - {formatDate(orderData.end_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{orderData.participants.length} khách</span>
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
                  <InfoRow icon={Calendar} label="Ngày khởi hành" value={formatDate(orderData.start_date)} />
                  <InfoRow icon={Calendar} label="Ngày kết thúc" value={formatDate(orderData.end_date)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow icon={CreditCard} label="Phương thức thanh toán" value={orderData.payment_method} />
                  <InfoRow icon={CheckCircle} label="Thanh toán lúc" value={formatDateTime(orderData.paid_at)} />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Thông tin liên hệ
              </h2>
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <InfoRow icon={Users} label="Người liên hệ" value={orderData.contact_name} />
                <InfoRow icon={Phone} label="Số điện thoại" value={orderData.contact_phone} />
              </div>
              <InfoRow icon={Mail} label="Email" value={orderData.contact_email} className="mb-5" />

              {orderData.special_requests && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Yêu cầu đặc biệt</p>
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
                Danh sách khách tham gia
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {orderData.participants.map((p, i) => (
                  <ParticipantCard key={i} participant={p} />
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Dịch vụ bao gồm</h2>
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
                <h2 className="text-xl font-bold text-gray-900 mb-5">Chi tiết thanh toán</h2>
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <PriceRow label="Giá tour trọn gói" value={orderData.subtotal} />
                  {parseFloat(orderData.discount_amount) > 0 && (
                    <PriceRow label="Giảm giá" value={`-${orderData.discount_amount}`} />
                  )}
                </div>
                <PriceRow label="Tổng cộng" value={orderData.total_price} highlight />

                <div className="mt-5 pt-5 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Trạng thái thanh toán</span>
                    <StatusBadge status={orderData.payment_status} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-5 h-5" />
                  Tải hóa đơn
                </button>
                <button className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-300 flex items-center justify-center gap-2 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  Liên hệ hỗ trợ
                </button>
                <button
                  onClick={() => router.push(`/tours/${orderData.tour_slug || orderData.id}`)}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-300 flex items-center justify-center gap-2 transition-colors">
                  <ExternalLink className="w-5 h-5" />
                  Xem chi tiết tour
                </button>

                <button className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-300 flex items-center justify-center gap-2 transition-colors">
                  <ExternalLink className="w-5 h-5" />
                  Đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default OrderDetailPage;