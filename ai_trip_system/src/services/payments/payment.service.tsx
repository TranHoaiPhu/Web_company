/* eslint-disable @typescript-eslint/no-explicit-any */

import httpBooking from "../httpBooking"

export type PaymentMethod = 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'COD';

export interface PaymentInitiateRequest {
    orderId: string;
    paymentMethod: PaymentMethod;
    bankCode?: string; // For VNPay
    returnUrl?: string;
}

export interface PaymentInitiateResponse {
    success: boolean;
    data: {
        paymentUrl: string;
        paymentCode: string;
        orderId: number;
        orderCode: string;
    };
    message?: string;
}

export interface PaymentStatusResponse {
    success: boolean;
    message: string;
    data?: {
        payment_status: string;
        transaction_code?: string;
        paid_at?: string;
    };
}

export interface VNPayCallbackData {
    vnp_Amount: string;
    vnp_BankCode: string;
    vnp_OrderInfo: string;
    vnp_PayDate: string;
    vnp_TmnCode: string;
    vnp_TxnRef: string;
    vnp_TransactionNo: string;
    vnp_ResponseCode: string;
    vnp_TransactionStatus: string;
    vnp_CardType?: string;
    vnp_BankTranNo?: string;
}

export interface MoMoCallbackData {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: string;
    orderInfo: string;
    orderType: string;
    transId: string;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: string;
    extraData: string;
    signature: string;
}

export const paymentService = {
    /**
     * Create VNPay payment URL
     */
    async createVNPayPayment(orderId: string, bankCode?: string, returnUrl?: string): Promise<PaymentInitiateResponse> {
        try {
            const response = await httpBooking.post('/payments/vnpay/create', {
                orderId,
                bankCode,
                returnUrl
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể tạo thanh toán VNPay. Vui lòng thử lại.'
            );
        }
    },

    /**
     * Create MoMo payment URL
     */
    async createMoMoPayment(orderId: string, returnUrl?: string): Promise<PaymentInitiateResponse> {
        try {
            const response = await httpBooking.post('/payments/momo/create', {
                orderId,
                returnUrl
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể tạo thanh toán MoMo. Vui lòng thử lại.'
            );
        }
    },

    /**
     * Create ZaloPay payment URL
     */
    async createZaloPayPayment(orderId: string, returnUrl?: string): Promise<PaymentInitiateResponse> {
        try {
            const response = await httpBooking.post('/payments/zalopay/create', {
                orderId,
                returnUrl
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể tạo thanh toán ZaloPay. Vui lòng thử lại.'
            );
        }
    },

    /**
     * Generic payment initiation (auto-select based on method)
     */
    async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
        switch (request.paymentMethod) {
            case 'VNPAY':
                return this.createVNPayPayment(request.orderId, request.bankCode, request.returnUrl);
            case 'MOMO':
                return this.createMoMoPayment(request.orderId, request.returnUrl);
            case 'ZALOPAY':
                return this.createZaloPayPayment(request.orderId, request.returnUrl);
            default:
                throw new Error('Phương thức thanh toán không được hỗ trợ');
        }
    },

    /**
     * Check payment status
     */
    async checkPaymentStatus(transactionRef: string): Promise<PaymentStatusResponse> {
        try {
            const response = await httpBooking.get('/payments/status', {
                params: { transactionRef },
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại.'
            );
        }
    },

    /**
     * Update payment status after callback from payment gateway
     */
    async updatePaymentForTour(paymentData: {
        order_code: string;
        payment_method: PaymentMethod;
        amount: number;
        transaction_code: string;
        gateway_response: VNPayCallbackData | MoMoCallbackData | any;
    }) {
        try {
            const response = await httpBooking.post('/payments', paymentData);
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Không thể cập nhật trạng thái thanh toán. Vui lòng thử lại.'
            );
        }
    }
};