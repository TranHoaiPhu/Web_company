/* eslint-disable @typescript-eslint/no-explicit-any */
import httpBooking from '../httpBooking'
export const orderService = {
    async getOrderByCode(orderCode: string, token?: string) {
        try {
            const response = await httpBooking.get(`/orders/${orderCode}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể lấy thông tin đơn hàng. Vui lòng thử lại.'
            );
        }
    },

    // /api/orders/my - Lấy danh sách đơn hàng của người dùng hiện tại
    async getMyOrders(token: string) {
        try {
            const response = await httpBooking.get('/orders/my', {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể lấy danh sách đơn hàng. Vui lòng thử lại.'
            );
        }
    },
}
