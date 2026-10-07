"use client";
import React, { forwardRef } from 'react';
import { MapPin, Phone, Mail, Globe, Calendar, Users, CreditCard, CheckCircle } from 'lucide-react';

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
}

interface InvoiceTemplateProps {
  order: OrderDetail;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order }, ref) => {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatPrice = (price: string | number) =>
    parseFloat(String(price)).toLocaleString('vi-VN') + '₫';

  const getParticipantType = (type: string) => {
    switch (type) {
      case 'ADULT': return 'Người lớn';
      case 'CHILD': return 'Trẻ em';
      case 'INFANT': return 'Em bé';
      default: return type;
    }
  };

  const getGender = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      default: return 'Khác';
    }
  };

  const invoiceNumber = `INV-${order.order_code.replace('ORD-', '')}`;
  const currentDate = new Date().toLocaleDateString('vi-VN');

  return (
    <div ref={ref} className="bg-white p-8 max-w-[800px] mx-auto" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-orange-500">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TravelVN</h1>
              <p className="text-sm text-gray-500">Travel & Tours</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>123 Đường ABC, Quận 1, TP.HCM</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-500" />
              <span>0123 456 789</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" />
              <span>support@travelvn.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-500" />
              <span>www.travelvn.com</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg mb-4">
            <h2 className="text-xl font-bold">HÓA ĐƠN</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-gray-500">Số hóa đơn:</span>
              <span className="font-semibold text-gray-900">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-gray-500">Ngày xuất:</span>
              <span className="font-medium text-gray-900">{currentDate}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-gray-500">Mã đơn hàng:</span>
              <span className="font-mono font-semibold text-orange-600">{order.order_code}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            {order.payment_status === 'PAID' ? (
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">ĐÃ THANH TOÁN</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full">
                <span className="font-semibold">CHỜ THANH TOÁN</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Thông tin khách hàng</h3>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">{order.contact_name}</p>
            <p className="text-gray-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              {order.contact_phone}
            </p>
            <p className="text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {order.contact_email}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Thông tin thanh toán</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức:</span>
              <span className="font-medium text-gray-900">{order.payment_method || 'VNPay'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ngày thanh toán:</span>
              <span className="font-medium text-gray-900">{order.paid_at ? formatDateTime(order.paid_at) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className={`font-semibold ${order.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tour Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{order.tour_name}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Khởi hành: <strong>{formatDate(order.start_date)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Kết thúc: <strong>{formatDate(order.end_date)}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Điểm khởi hành: <strong>{order.location_name || 'Chưa xác định'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Số khách: <strong>{order.participants?.length || 0} người</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      {order.participants && order.participants.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Danh sách khách tham gia
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">STT</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Họ và tên</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Loại</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Giới tính</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ngày sinh</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">CCCD/CMT</th>
                </tr>
              </thead>
              <tbody>
                {order.participants.map((p, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-3 px-4 text-gray-600">{i + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{p.full_name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.participant_type === 'ADULT' ? 'bg-blue-100 text-blue-700' :
                          p.participant_type === 'CHILD' ? 'bg-purple-100 text-purple-700' :
                            'bg-pink-100 text-pink-700'
                        }`}>
                        {getParticipantType(p.participant_type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{getGender(p.gender)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(p.date_of_birth)}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{p.id_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Amenities */}
      {order.amenities && order.amenities.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ đi kèm</h3>
          <div className="grid grid-cols-2 gap-3">
            {order.amenities.map((a, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${parseFloat(a.price_at_booking) > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                <span className="text-gray-700">{a.amenity_name}</span>
                {parseFloat(a.price_at_booking) > 0 && (
                  <span className="font-semibold text-blue-600">+{formatPrice(a.price_at_booking)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-500" />
          Chi tiết thanh toán
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Giá tour trọn gói</span>
            <span className="font-medium text-gray-900">{formatPrice(order.subtotal)}</span>
          </div>
          {parseFloat(order.discount_amount) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Giảm giá</span>
              <span className="font-medium">-{formatPrice(order.discount_amount)}</span>
            </div>
          )}
          <div className="border-t border-gray-300 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">TỔNG CỘNG</span>
              <span className="text-2xl font-bold text-orange-600">{formatPrice(order.total_price)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      {order.special_requests && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <h4 className="font-semibold text-amber-800 mb-2">📝 Yêu cầu đặc biệt</h4>
          <p className="text-amber-900">{order.special_requests}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-200 pt-6 mt-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">Cảm ơn quý khách đã sử dụng dịch vụ của <strong className="text-blue-600">TravelVN</strong>!</p>
          <p className="text-sm text-gray-500">Chúc quý khách có chuyến đi vui vẻ và nhiều kỷ niệm đẹp.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Hotline hỗ trợ</p>
            <p>0123 456 789</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Email</p>
            <p>support@travelvn.com</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Website</p>
            <p>www.travelvn.com</p>
          </div>
        </div>

        <div className="text-center mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2026 TravelVN. All rights reserved. | Đây là hóa đơn điện tử hợp lệ.
          </p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
