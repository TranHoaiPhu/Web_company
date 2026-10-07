/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { orderService, Order, OrderFilters } from "@/services/order.service";
import {
    Table,
    Button,
    Modal,
    Space,
    Input,
    Select,
    DatePicker,
    Row,
    Col,
    Card,
    Tag,
    Drawer,
    Divider,
    Tooltip,
    Form,
    App,
} from "antd";
import {
    EyeOutlined,
    DeleteOutlined,
    SearchOutlined,
    FilterOutlined,
    ClearOutlined,
    EditOutlined,
    MessageOutlined,
    MailOutlined,
    CommentOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { Can } from "@/components/common/AccessControl";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "orange",
    CONFIRMED: "blue",
    PAID: "green",
    CANCELLED: "red",
    REFUNDED: "purple",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
    UNPAID: "orange",
    PAID: "green",
    FAILED: "red",
    REFUNDED: "purple",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    CONFIRMED: "Đã xác nhận",
    PAID: "Hoàn thành",
    CANCELLED: "Hủy bỏ",
    REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    UNPAID: "Chưa thanh toán",
    PAID: "Đã thanh toán",
    FAILED: "Thanh toán thất bại",
    REFUNDED: "Đã hoàn tiền",
};

export default function OrderManagementPage() {
    const { message: messageApi, modal: modalApi } = App.useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderCodeParam = searchParams.get("order_code");
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 });
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [participantsLoading, setParticipantsLoading] = useState(false);

    // Edit states
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editForm] = Form.useForm();
    const [updating, setUpdating] = useState(false);

    // Filter states
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
    const [userIdFilter, setUserIdFilter] = useState("");
    const [dateRange, setDateRange] = useState<[any, any] | null>(null);

    const fetchOrders = async (page = 1, filters?: OrderFilters) => {
        setLoading(true);
        try {
            const params: OrderFilters = {
                page,
                limit: 10,
                search: searchText || undefined,
                status: statusFilter || undefined,
                payment_status: paymentStatusFilter || undefined,
                user_id: userIdFilter || undefined,
                ...filters,
            };

            if (dateRange?.[0]) {
                params.start_date = dateRange[0].format("YYYY-MM-DD");
            }
            if (dateRange?.[1]) {
                params.end_date = dateRange[1].format("YYYY-MM-DD");
            }

            const res = await orderService.getOrders(params);
            setOrders(res.data.orders);
            setPagination(res.data.pagination);
            console.log("Fetched Orders:", res.data);
            return res.data;
        } catch (error) {
            messageApi.error("Không thể tải danh sách đơn hàng");
            console.error(error);
            return null;
        }
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            if (orderCodeParam) {
                setSearchText(orderCodeParam);
                const data = await fetchOrders(1, { search: orderCodeParam });
                if (data && data.orders && data.orders.length > 0) {
                    const matchedOrder = data.orders.find((o: Order) => o.order_code === orderCodeParam);
                    if (matchedOrder) {
                        handleViewDetails(matchedOrder);
                    }
                }
            } else {
                fetchOrders(1);
            }
        };
        init();
    }, [orderCodeParam]);

    const handleSearch = () => {
        fetchOrders(1);
    };

    const handleClearFilters = () => {
        setSearchText("");
        setStatusFilter("");
        setPaymentStatusFilter("");
        setUserIdFilter("");
        setDateRange(null);
        fetchOrders(1, {
            search: undefined,
            status: undefined,
            payment_status: undefined,
            user_id: undefined,
            start_date: undefined,
            end_date: undefined,
        });
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailDrawerOpen(true);
        fetchParticipants(order.id);
    };

    const fetchParticipants = async (orderId: string) => {
        setParticipantsLoading(true);
        try {
            const res = await orderService.getOrderParticipants(orderId);
            setParticipants(res.data.participants);
        } catch (error) {
            messageApi.error("Không thể tải danh sách người đi");
            console.error(error);
        }
        setParticipantsLoading(false);
    };

    const handleDelete = async (id: string) => {
        try {
            await orderService.deleteOrder(id);
            messageApi.success("Xóa đơn hàng thành công");
            fetchOrders(pagination.page);
        } catch (error) {
            messageApi.error("Lỗi khi xóa đơn hàng");
        }
    };

    const handleEdit = (order: Order) => {
        setEditingOrder(order);
        editForm.setFieldsValue({
            contact_name: order.contact_name,
            contact_phone: order.contact_phone,
            contact_email: order.contact_email,
            status: order.status,
            payment_status: order.payment_status,
            note: order.note
        });
        setEditModalVisible(true);
    };

    const handleUpdateOrder = async () => {
        if (!editingOrder) return;
        try {
            const values = await editForm.validateFields();
            setUpdating(true);

            console.log("Updating order with values:", values);

            const updateData = {
                ...editingOrder,
                ...values
            };

            const res = await orderService.updateOrder(editingOrder.id, updateData);
            console.log("Update response:", res);

            messageApi.success("Cập nhật đơn hàng thành công");
            setEditModalVisible(false);

            // Sync selectedOrder if it's the same one being viewed in drawer
            if (selectedOrder && selectedOrder.id === editingOrder.id) {
                // If the update returns the new order, use it, otherwise merge
                setSelectedOrder({ ...selectedOrder, ...values });
            }

            fetchOrders(pagination.page);
        } catch (error: any) {
            console.error("Update error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || "Lỗi khi cập nhật đơn hàng";
            messageApi.error(errorMsg);
        } finally {
            setUpdating(false);
        }
    };

    const columns: TableColumnsType<Order> = [
        {
            title: "STT",
            key: "stt",
            width: 60,
            render: (_, __, index) => (pagination.page - 1) * 10 + index + 1,
            align: "center",
        },
        {
            title: "Mã đơn",
            dataIndex: "order_code",
            key: "order_code",
            width: 120,
            render: (text) => <span className="font-mono font-semibold">{text}</span>,
        },
        {
            title: "Khách hàng",
            key: "customer",
            width: 150,
            render: (_, record) => (
                <div>
                    <p className="font-medium text-gray-900">{record.contact_name}</p>
                    <p className="text-xs text-gray-500">{record.contact_email}</p>
                </div>
            ),
        },
        {
            title: "Tên tour",
            dataIndex: "tour_name",
            key: "tour_name",
            width: 200,
            render: (text: string) => (
                <div className="line-clamp-2 text-gray-700" title={text}>
                    {text}
                </div>
            ),
        },
        {
            title: "Ngày khởi hành",
            dataIndex: "schedule_start",
            key: "schedule_start",
            width: 130,
            render: (date) => date ? dayjs(date).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Số người",
            key: "participants",
            width: 100,
            render: (_, record) => (
                <span>
                    {record.total_participants}{" "}
                    <span className="text-gray-500 text-xs">người</span>
                </span>
            ),
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_price",
            key: "total_price",
            width: 120,
            render: (price) => (
                <span className="font-semibold text-blue-600">
                    {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                    }).format(Number(price))}
                </span>
            ),
            sorter: (a, b) => Number(a.total_price) - Number(b.total_price),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: 110,
            render: (status) => (
                <Tag color={STATUS_COLORS[status]}>
                    {STATUS_LABELS[status] || status}
                </Tag>
            ),
        },
        {
            title: "Thanh toán",
            dataIndex: "payment_status",
            key: "payment_status",
            width: 120,
            render: (payment_status) => (
                <Tag color={PAYMENT_STATUS_COLORS[payment_status]}>
                    {PAYMENT_STATUS_LABELS[payment_status] || payment_status}
                </Tag>
            ),
        },
        {
            title: "Hành động",
            key: "action",
            width: 150,
            fixed: "right",
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                            className="bg-blue-600 hover:bg-blue-700"
                        />
                    </Tooltip>

                    <Tooltip title="Liên hệ nhanh">
                        <Button
                            type="default"
                            size="small"
                            icon={<MessageOutlined />}
                            className="text-emerald-600 border-emerald-600 hover:text-emerald-700 hover:border-emerald-700"
                            onClick={() => {
                                modalApi.info({
                                    title: `Liên hệ với khách hàng ${record.contact_name}`,
                                    content: (
                                        <div className="mt-4 space-y-4">
                                            <p className="text-gray-500">Chọn phương thức liên hệ nhanh:</p>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    icon={<MessageOutlined className="text-blue-500" />}
                                                    block
                                                    onClick={() => {
                                                        const cleanPhone = record.contact_phone.replace(/\D/g, '');
                                                        window.open(`https://zalo.me/${cleanPhone}`, '_blank');
                                                    }}
                                                >
                                                    Chat Zalo (Số: {record.contact_phone})
                                                </Button>
                                                <Button
                                                    icon={<MailOutlined className="text-rose-500" />}
                                                    block
                                                    onClick={() => window.location.href = `mailto:${record.contact_email}?subject=Liên hệ về đơn hàng ${record.order_code}`}
                                                >
                                                    Gửi Email ({record.contact_email})
                                                </Button>
                                                <Button
                                                    icon={<CommentOutlined className="text-emerald-500" />}
                                                    block
                                                    onClick={() => {
                                                        Modal.destroyAll();
                                                        router.push(`/chat?email=${encodeURIComponent(record.contact_email)}`);
                                                    }}
                                                >
                                                    Hệ thống Chat
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                    okText: 'Đóng',
                                    maskClosable: true,
                                    width: 450,
                                });
                            }}
                        />
                    </Tooltip>

                    <Can permission="orders_edit">
                        <Tooltip title="Chỉnh sửa">
                            <Button
                                type="default"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            />
                        </Tooltip>
                    </Can>

                    <Can permission="orders_delete">
                        <Tooltip title="Xóa">
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Xác nhận xóa đơn hàng',
                                        content: `Bạn có chắc chắn muốn xóa đơn hàng ${record.order_code}?`,
                                        onOk: () => handleDelete(record.id)
                                    });
                                }}
                            />
                        </Tooltip>
                    </Can>
                </Space >
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-6 mb-8 hover:shadow-md transition-shadow">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Quản lý đơn hàng
                    </h1>
                    <p className="text-gray-500">
                        Xem, tìm kiếm và quản lý tất cả các đơn đặt tour của bạn
                    </p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center mb-4">
                    <FilterOutlined className="text-lg mr-2 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
                </div>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Tìm mã đơn, tên khách, email..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onPressEnter={handleSearch}
                            allowClear
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Trạng thái đơn hàng"
                            style={{ width: '100%' }}
                            allowClear
                            value={statusFilter || undefined}
                            onChange={(val) => setStatusFilter(val || "")}
                            options={[
                                { label: "Chờ xác nhận", value: "PENDING" },
                                { label: "Đã xác nhận", value: "CONFIRMED" },
                                { label: "Hoàn thành (Đã thanh toán)", value: "PAID" },
                                { label: "Hủy bỏ", value: "CANCELLED" },
                                { label: "Đã hoàn tiền", value: "REFUNDED" },
                            ]}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Trạng thái thanh toán"
                            style={{ width: '100%' }}
                            allowClear
                            value={paymentStatusFilter || undefined}
                            onChange={(val) => setPaymentStatusFilter(val || "")}
                            options={[
                                { label: "Chưa thanh toán", value: "UNPAID" },
                                { label: "Đã thanh toán", value: "PAID" },
                                { label: "Thanh toán thất bại", value: "FAILED" },
                                { label: "Đã hoàn tiền", value: "REFUNDED" },
                            ]}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <DatePicker.RangePicker
                            style={{ width: "100%" }}
                            placeholder={["Từ ngày", "Đến ngày"]}
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates as any)}
                            format="DD/MM/YYYY"
                        />
                    </Col>
                </Row>

                <Row gutter={[16, 16]} className="mt-4">
                    <Col>
                        <Button
                            type="primary"
                            icon={<SearchOutlined />}
                            onClick={handleSearch}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Tìm kiếm
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            icon={<ClearOutlined />}
                            onClick={handleClearFilters}
                        >
                            Xóa lọc
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={orders.map((order, idx) => ({
                        ...order,
                        key: order.id || idx,
                    }))}
                    loading={loading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        onChange: (page) => fetchOrders(page),
                        showSizeChanger: false,
                    }}
                    bordered={false}
                    scroll={{ x: 1400 }}
                    className="custom-table"
                />
            </div>

            {/* Detail Drawer */}
            <Drawer
                title={
                    selectedOrder && (
                        <div>
                            <p className="font-semibold text-lg">
                                Đơn hàng {selectedOrder.order_code}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                ID: {selectedOrder.id}
                            </p>
                        </div>
                    )
                }
                onClose={() => setDetailDrawerOpen(false)}
                open={detailDrawerOpen}
                width={600}
                bodyStyle={{ paddingBottom: 80 }}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Thông tin đơn hàng
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Mã đơn
                                    </p>
                                    <p className="font-mono font-semibold">
                                        {selectedOrder.order_code}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Trạng thái
                                    </p>
                                    <Tag color={STATUS_COLORS[selectedOrder.status]}>
                                        {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                                    </Tag>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Thanh toán
                                    </p>
                                    <Tag
                                        color={
                                            PAYMENT_STATUS_COLORS[
                                            selectedOrder.payment_status
                                            ]
                                        }
                                    >
                                        {
                                            PAYMENT_STATUS_LABELS[
                                            selectedOrder.payment_status
                                            ] || selectedOrder.payment_status
                                        }
                                    </Tag>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Ngày tạo
                                    </p>
                                    <p className="text-sm">
                                        {dayjs(selectedOrder.created_at).format(
                                            "DD/MM/YYYY HH:mm"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Customer Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Thông tin khách hàng
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Tên khách
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedOrder.contact_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Email
                                    </p>
                                    <p className="text-sm break-all">
                                        {selectedOrder.contact_email}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Điện thoại
                                    </p>
                                    <p className="text-sm">
                                        {selectedOrder.contact_phone}
                                    </p>
                                </div>
                                <div className="flex items-end gap-2 flex-wrap">
                                    <Button
                                        size="small"
                                        icon={<MessageOutlined />}
                                        type="link"
                                        className="p-0 text-emerald-600"
                                        onClick={() => {
                                            const cleanPhone = selectedOrder.contact_phone.replace(/\D/g, '');
                                            window.open(`https://zalo.me/${cleanPhone}`, '_blank');
                                        }}
                                    >
                                        Zalo
                                    </Button>
                                    <Divider type="vertical" />
                                    <Button
                                        size="small"
                                        icon={<MailOutlined />}
                                        type="link"
                                        className="p-0 text-rose-600"
                                        onClick={() => window.location.href = `mailto:${selectedOrder.contact_email}?subject=Liên hệ về đơn hàng ${selectedOrder.order_code}`}
                                    >
                                        Email
                                    </Button>
                                    <Divider type="vertical" />
                                    <Button
                                        size="small"
                                        icon={<CommentOutlined />}
                                        type="link"
                                        className="p-0 text-blue-600"
                                        onClick={() => {
                                            setDetailDrawerOpen(false);
                                            router.push(`/chat?email=${encodeURIComponent(selectedOrder.contact_email)}`);
                                        }}
                                    >
                                        Chat hỗ trợ
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Tour Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Thông tin tour
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Tên tour
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedOrder.tour_name}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                            Ngày khởi hành
                                        </p>
                                        <p className="text-sm">
                                            {dayjs(
                                                selectedOrder.schedule_start
                                            ).format("DD/MM/YYYY")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                            Ngày kết thúc
                                        </p>
                                        <p className="text-sm">
                                            {dayjs(
                                                selectedOrder.schedule_end
                                            ).format("DD/MM/YYYY")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Participants counts */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Số lượng khách
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Người lớn
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {selectedOrder.adult_quantity}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Trẻ em
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {selectedOrder.child_quantity}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Em bé
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {selectedOrder.infant_quantity}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        {/* Pricing */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                Chi tiết giá
                            </h3>
                            <div className="space-y-2 bg-gray-50 p-4 rounded">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Giá gốc
                                    </span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(Number(selectedOrder.subtotal))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                        Giảm giá
                                    </span>
                                    <span className="font-medium text-red-600">
                                        -
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(Number(selectedOrder.discount_amount))}
                                    </span>
                                </div>
                                <Divider className="my-2" />
                                <div className="flex justify-between text-base font-semibold">
                                    <span>Tổng cộng</span>
                                    <span className="text-blue-600">
                                        {new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                        }).format(Number(selectedOrder.total_price))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {selectedOrder.special_requests && (
                            <>
                                <Divider />
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        Yêu cầu đặc biệt
                                    </h3>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                        {selectedOrder.special_requests}
                                    </p>
                                </div>
                            </>
                        )}

                        {selectedOrder.note && (
                            <>
                                <Divider />
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        Ghi chú hệ thống
                                    </h3>
                                    <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-100 italic">
                                        {selectedOrder.note}
                                    </p>
                                </div>
                            </>
                        )}

                        <Divider />

                        {/* Participants List */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                Danh sách người đi ({participants.length})
                            </h3>
                            {participantsLoading ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Đang tải...</p>
                                </div>
                            ) : participants.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {participants.map((participant, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-gray-50 p-4 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                                        >
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">
                                                        Họ tên
                                                    </p>
                                                    <p className="font-medium">
                                                        {participant.full_name}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">
                                                        Email
                                                    </p>
                                                    <p className="text-xs break-all">
                                                        {participant.email || "-"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">
                                                        Điện thoại
                                                    </p>
                                                    <p className="text-sm">
                                                        {participant.phone || "-"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">
                                                        Ngày sinh
                                                    </p>
                                                    <p className="text-sm">
                                                        {participant.date_of_birth
                                                            ? dayjs(participant.date_of_birth).format(
                                                                "DD/MM/YYYY"
                                                            )
                                                            : "-"}
                                                    </p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-gray-500 text-xs mb-1">
                                                        Ghi chú
                                                    </p>
                                                    <p className="text-sm text-gray-700">
                                                        {participant.notes || "(không có)"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded">
                                    <p className="text-gray-500 text-sm">
                                        Không có thông tin người đi
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Edit Modal */}
            <Modal
                title={`Chỉnh sửa đơn hàng ${editingOrder?.order_code}`}
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={handleUpdateOrder}
                confirmLoading={updating}
                width={600}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form
                    form={editForm}
                    layout="vertical"
                    className="mt-4"
                >
                    <Row gutter={16}>
                        <Col span={24}>
                            <h4 className="text-sm font-semibold mb-4 text-blue-600 border-b pb-2">Thông tin liên hệ</h4>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="contact_name"
                                label="Tên khách hàng"
                                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="contact_email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email' },
                                    { type: 'email', message: 'Email không hợp lệ' }
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="contact_phone"
                                label="Số điện thoại"
                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={24} className="mt-4">
                            <h4 className="text-sm font-semibold mb-4 text-blue-600 border-b pb-2">Trạng thái đơn hàng</h4>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Trạng thái đơn"
                                rules={[{ required: true }]}
                            >
                                <Select options={[
                                    { label: "Chờ xác nhận", value: "PENDING" },
                                    { label: "Đã xác nhận", value: "CONFIRMED" },
                                    { label: "Hoàn thành (Đã thanh toán)", value: "PAID" },
                                    { label: "Hủy bỏ", value: "CANCELLED" },
                                    { label: "Đã hoàn tiền", value: "REFUNDED" },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="payment_status"
                                label="Thanh toán"
                                rules={[{ required: true }]}
                            >
                                <Select options={[
                                    { label: "Chưa thanh toán", value: "UNPAID" },
                                    { label: "Đã thanh toán", value: "PAID" },
                                    { label: "Thanh toán thất bại", value: "FAILED" },
                                    { label: "Đã hoàn tiền", value: "REFUNDED" },
                                ]} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                name="note"
                                label="Ghi chú hệ thống"
                            >
                                <Input.TextArea rows={3} placeholder="Ghi chú nội bộ cho đơn hàng này..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}
