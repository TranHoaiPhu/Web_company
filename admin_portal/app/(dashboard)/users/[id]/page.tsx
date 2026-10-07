'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Space,
    message,
    Tag,
    Card,
    Typography,
    Tooltip,
    Avatar,
    Statistic,
    Row,
    Col,
    Badge,
    Divider,
    Spin,
    Empty,
    Descriptions,
    Tabs
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    UnlockOutlined,
    KeyOutlined,
    EditOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ArrowLeftOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    ShoppingOutlined,
    DollarOutlined
} from '@ant-design/icons';
import {
    ShieldCheck,
    Crown,
    Mail,
    Phone,
    MapPin,
    MessageCircle,
    Layout,
    Lightbulb,
    ChevronDown,
    TrendingUp
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import {
    userService,
    User,
    UserStatistics,
} from '@/services/user.service';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    /* ------------------------------------------------------------------------
       STATE MANAGEMENT
       ------------------------------------------------------------------------ */

    // User Data States
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userStats, setUserStats] = useState<UserStatistics | null>(null);

    // Orders States
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [hasMoreOrders, setHasMoreOrders] = useState(true);
    const [totalOrders, setTotalOrders] = useState(0);

    /* ------------------------------------------------------------------------
       HELPER FUNCTIONS
       ------------------------------------------------------------------------ */

    /**
     * Get membership rank based on total spending
     */
    const getMembershipRank = (totalSpent: number) => {
        if (totalSpent >= 20000000) return { name: 'Kim cương', color: 'purple', icon: <Crown size={16} className="text-purple-600" /> };
        if (totalSpent >= 5000000) return { name: 'Vàng', color: 'gold', icon: <SafetyCertificateOutlined className="text-amber-500" /> };
        if (totalSpent >= 1000000) return { name: 'Bạc', color: 'blue', icon: <ShieldCheck size={16} className="text-blue-500" /> };
        return { name: 'Đồng', color: 'orange', icon: <UserOutlined className="text-orange-500" /> };
    };

    /* ------------------------------------------------------------------------
       DATA FETCHING
       ------------------------------------------------------------------------ */

    /**
     * Fetch user data and statistics
     */
    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [userData, statsData] = await Promise.all([
                userService.getById(id),
                userService.getStatistics(id)
            ]);
            setUser(userData);
            setUserStats(statsData);

            // Initial orders fetch
            fetchOrders(1, true);
        } catch (error) {
            console.error('Error fetching user detail:', error);
            message.error('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    }, [id]);

    /**
     * Fetch user orders with pagination
     */
    const fetchOrders = async (page: number, refresh = false) => {
        if (!id) return;
        setOrdersLoading(true);
        try {
            const response = await userService.getUserOrders(id, { page, limit: 5 });
            const newOrders = response.data?.orders || [];
            const pagination = response.data?.pagination;

            if (refresh) {
                setUserOrders(newOrders);
            } else {
                setUserOrders(prev => [...prev, ...newOrders]);
            }

            setTotalOrders(pagination?.totalItems || 0);
            setHasMoreOrders(pagination?.hasNextPage || false);
            setOrdersPage(page);
        } catch (error) {
            console.error('Error fetching orders:', error);
            message.error('Không thể tải danh sách đơn hàng');
        } finally {
            setOrdersLoading(false);
        }
    };

    /**
     * Load more orders
     */
    const handleLoadMore = () => {
        fetchOrders(ordersPage + 1);
    };

    /* ------------------------------------------------------------------------
       LIFECYCLE
       ------------------------------------------------------------------------ */

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ------------------------------------------------------------------------
       RENDER CONDITIONS
       ------------------------------------------------------------------------ */

    // Loading State
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    // Empty State
    if (!user) {
        return (
            <div className="p-8 text-center">
                <Empty description="Không tìm thấy người dùng" />
                <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="mt-4">
                    Quay lại
                </Button>
            </div>
        );
    }

    /* ========================================================================
       MAIN RENDER
       ======================================================================== */

    return (
        <div className="max-w-8xl mx-auto p-8 space-y-10 animate-in fade-in duration-500">

            {/* ================================================================
                SECTION 1: HEADER & BREADCRUMB
                ================================================================ */}
            <div className="flex items-center justify-between mb-2 p-2">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/users')}
                    className="border-none shadow-none bg-transparent hover:bg-slate-100 rounded-xl font-bold text-slate-500"
                >
                    Danh sách người dùng
                </Button>
            </div>

            {/* ================================================================
                SECTION 2: PROFILE HEADER
                ================================================================ */}
            <div className="relative p-5 bg-white rounded-[1rem] border border-slate-100 shadow-sm overflow-hidden">

                {/* Membership Badge - Top Right */}
                <div className="absolute top-0 right-0 p-10">
                    {userStats && (
                        <Tag
                            color={getMembershipRank(userStats.totalSpent).color}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full border-none font-bold uppercase tracking-wider shadow-sm text-sm"
                        >
                            {getMembershipRank(userStats.totalSpent).icon}
                            Hạng {getMembershipRank(userStats.totalSpent).name}
                        </Tag>
                    )}
                </div>

                {/* Profile Content */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">

                    {/* Avatar */}
                    <Avatar
                        size={160}
                        src={user.avatar_url}
                        icon={<UserOutlined />}
                        className="border-4 border-white shadow-2xl flex-shrink-0"
                    />

                    {/* User Information */}
                    <div className="flex-1 text-center md:text-left pt-2">

                        {/* Name & Status Badge */}
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                            <h2 className="text-4xl font-bold text-slate-800 tracking-tight">
                                {user.full_name}
                            </h2>
                            <Badge
                                status={user.status === 'ACTIVE' ? 'success' : 'error'}
                                text={user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                                className="px-5 py-1.5 bg-slate-50 rounded-full border border-slate-100 font-bold text-[10px] uppercase tracking-widest"
                            />
                        </div>

                        {/* Contact Information */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-8 text-slate-500 mb-10 font-medium">
                            <div className="flex items-center gap-2.5 hover:text-indigo-600 transition-colors">
                                <Mail size={20} className="text-indigo-400" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2.5 hover:text-indigo-600 transition-colors">
                                <Phone size={20} className="text-indigo-400" />
                                {user.phone || 'Chưa cập nhật'}
                            </div>
                            <div className="flex items-center gap-2.5 hover:text-indigo-600 transition-colors">
                                <MapPin size={20} className="text-indigo-400" />
                                {user.address || 'Chưa cập nhật'}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <Button
                                type="primary"
                                icon={<MessageCircle size={20} />}
                                onClick={() => router.push(`/chat?email=${encodeURIComponent(user.email)}`)}
                                className="bg-indigo-600 hover:!bg-indigo-700 h-14 px-10 rounded-[1.25rem] font-bold flex items-center gap-3 border-none shadow-xl shadow-indigo-100 text-base"
                            >
                                Nhắn tin Hỗ trợ
                            </Button>
                            <Button
                                icon={<EditOutlined />}
                                className="h-14 px-8 rounded-[1.25rem] font-bold border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-600 text-base"
                            >
                                Sửa thông tin
                            </Button>
                            <Button
                                icon={user.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
                                danger={user.status === 'ACTIVE'}
                                className="h-14 px-8 rounded-[1.25rem] font-bold text-base"
                            >
                                {user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Visual Background Effects */}
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            </div>

            {/* ================================================================
                SECTION 3: CONTENT TABS
                ================================================================ */}
            <Tabs
                defaultActiveKey="1"
                className="custom-detail-tabs bg-white p-14 rounded-[1rem] border border-slate-100 shadow-sm min-h-[600px]"
            >

                {/* ============================================================
                    TAB 1: OVERVIEW (TỔNG QUAN)
                    ============================================================ */}
                <Tabs.TabPane
                    tab={
                        <span className="flex items-center gap-2 px-4 py-2 text-base font-bold transition-all">
                            <Layout size={20} /> Tổng quan
                        </span>
                    }
                    key="1"
                >
                    <div className="space-y-12 p-10">
                        {userStats ? (
                            <>
                                {/* --- Statistics Cards Grid --- */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full">

                                    {/* Card: Total Orders */}
                                    <Card className="border-0 shadow-md rounded-xl hover:shadow-xl transition-shadow bg-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="overflow-hidden">
                                                <p className="text-slate-500 text-sm font-medium mb-1 truncate">
                                                    Tổng đơn hàng
                                                </p>
                                                <p className="text-3xl font-bold text-slate-900">
                                                    {userStats.totalOrders}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex flex-shrink-0 items-center justify-center">
                                                <ShoppingOutlined className="text-2xl text-indigo-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Card: Completed Orders */}
                                    <Card className="border-0 shadow-md rounded-xl hover:shadow-xl transition-shadow bg-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="overflow-hidden">
                                                <p className="text-slate-500 text-sm font-medium mb-1 truncate">
                                                    Hoàn thành
                                                </p>
                                                <p className="text-3xl font-bold text-emerald-600">
                                                    {userStats.completedOrders}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex flex-shrink-0 items-center justify-center">
                                                <CheckCircleOutlined className="text-2xl text-emerald-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Card: Cancelled Orders */}
                                    <Card className="border-0 shadow-md rounded-xl hover:shadow-xl transition-shadow bg-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="overflow-hidden">
                                                <p className="text-slate-500 text-sm font-medium mb-1 truncate">
                                                    Đơn đã hủy
                                                </p>
                                                <p className="text-3xl font-bold text-rose-600">
                                                    {userStats.cancelledOrders}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-rose-100 rounded-lg flex flex-shrink-0 items-center justify-center">
                                                <CloseCircleOutlined className="text-2xl text-rose-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Card: Total Spending */}
                                    <Card className="border-0 shadow-md rounded-xl hover:shadow-xl transition-shadow bg-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="overflow-hidden">
                                                <p className="text-slate-500 text-sm font-medium mb-1 truncate">
                                                    Tổng chi tiêu
                                                </p>
                                                <p className="text-2xl font-bold text-slate-900 flex items-baseline">
                                                    {userStats.totalSpent.toLocaleString('vi-VN')}
                                                    <span className="text-sm ml-1">₫</span>
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-amber-100 rounded-lg flex flex-shrink-0 items-center justify-center">
                                                <DollarOutlined className="text-2xl text-amber-600" />
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Card: Average Order Value */}
                                    <Card className="border-0 shadow-md rounded-xl hover:shadow-xl transition-shadow bg-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="overflow-hidden">
                                                <p className="text-slate-500 text-sm font-medium mb-1 truncate">
                                                    Giá trị TB
                                                </p>
                                                <p className="text-2xl font-bold text-slate-900 flex items-baseline">
                                                    {Math.round(userStats.avgOrderValue).toLocaleString('vi-VN')}
                                                    <span className="text-sm ml-1">₫</span>
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex flex-shrink-0 items-center justify-center">
                                                <TrendingUp size={24} className="text-purple-600" />
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* --- Membership Info Card --- */}
                                <Card className="bg-indigo-50 border-0 p-4 mb-5 rounded-[2rem] mb-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-slate-600 text-sm mb-1 font-medium">
                                                Khách hàng từ
                                            </p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {dayjs(user.created_at).format('DD/MM/YYYY')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-600 text-sm mb-1 font-medium">
                                                Tỷ lệ hủy đơn
                                            </p>
                                            <p className={`text-2xl font-bold ${userStats?.cancellationRate > 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {userStats?.cancellationRate.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        ) : (
                            <Empty description="Không có dữ liệu thống kê" />
                        )}

                        {/* --- User Details Description Table --- */}
                        <div className="mt-10">
                            <Descriptions
                                column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                                bordered
                                className="bg-slate-50 rounded-[2rem] overflow-hidden mt-10 border border-slate-100 shadow-inner"
                                labelStyle={{
                                    backgroundColor: 'rgba(248, 250, 252, 0.5)',
                                    fontWeight: 700,
                                    width: '220px',
                                    padding: '28px',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    fontSize: '11px',
                                    letterSpacing: '0.15em',
                                    borderRight: '1px solid #f1f5f9'
                                }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    padding: '28px',
                                    color: '#1e293b',
                                    fontWeight: 600,
                                    fontSize: '15px'
                                }}
                            >
                                <Descriptions.Item label="Định danh email">
                                    {user.email}
                                </Descriptions.Item>
                                <Descriptions.Item label="Cấp độ tài khoản">
                                    <Tag
                                        color={user.role === 'ADMIN' ? 'red' : 'blue'}
                                        className="rounded-xl font-bold border-none px-4 py-1 text-xs uppercase tracking-wider"
                                    >
                                        {user.role}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Liên lạc chính">
                                    {user.phone || 'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Địa chỉ cung cấp">
                                    {user.address || 'Chưa cập nhật'}
                                </Descriptions.Item>
                                <Descriptions.Item label="ID tham chiếu">
                                    <code className="bg-slate-900 text-slate-300 px-3 py-1 rounded-lg text-xs font-mono tracking-tight">
                                        {user.user_id}
                                    </code>
                                </Descriptions.Item>
                                <Descriptions.Item label="Chỉnh sửa lần cuối">
                                    {dayjs(user.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>

                    </div>
                </Tabs.TabPane>

                <Tabs.TabPane
                    className="pl-10 pr-10"
                    tab={
                        <span className="flex items-center gap-2 px-4 py-2 text-base font-bold transition-all">
                            <ClockCircleOutlined /> Lịch sử đơn hàng
                        </span>
                    }
                    key="2"
                >
                    <div className="pt-8 space-y-8">

                        {/* --- Header with Badge --- */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-4">
                                <span className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                                Danh mục giao dịch
                                <Badge
                                    count={totalOrders}
                                    overflowCount={9999}
                                    style={{
                                        backgroundColor: '#6366f1',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        height: '24px',
                                        minWidth: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                />
                            </h3>
                        </div>

                        {/* --- Orders Table --- */}
                        <Table
                            dataSource={userOrders}
                            loading={ordersLoading && userOrders.length === 0}
                            pagination={false}
                            className="custom-premium-table border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm"
                            rowKey="id"
                            columns={[
                                {
                                    title: 'Mã đơn',
                                    dataIndex: 'order_code',
                                    key: 'code',
                                    render: (text) => (
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200" />
                                            <span className="font-mono text-indigo-600 font-bold tracking-tighter text-base">
                                                {text}
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Thời điểm',
                                    dataIndex: 'created_at',
                                    key: 'date',
                                    render: (date) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">
                                                {dayjs(date).format('DD [Tháng] MM, YYYY')}
                                            </span>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                {dayjs(date).format('HH:mm:ss')}
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Tổng thanh toán',
                                    dataIndex: 'total_price',
                                    key: 'price',
                                    render: (price) => (
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-xl font-bold text-slate-800 tracking-tight">
                                                {price?.toLocaleString('vi-VN')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                vnd
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    title: 'Trạng thái lệnh',
                                    dataIndex: 'status',
                                    key: 'status',
                                    render: (status) => {
                                        const statusMap: any = {
                                            'COMPLETED': { color: 'emerald', text: 'Hoàn thành' },
                                            'PENDING': { color: 'blue', text: 'Đang xử lý' },
                                            'CANCELLED': { color: 'rose', text: 'Đã hủy bỏ' },
                                            'PAID': { color: 'cyan', text: 'Thanh toán OK' }
                                        };
                                        const s = statusMap[status] || { color: 'slate', text: status };
                                        return (
                                            <div className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] bg-${s.color}-50 text-${s.color}-600 border border-${s.color}-100 shadow-sm`}>
                                                {s.text}
                                            </div>
                                        );
                                    }
                                },
                                {
                                    title: 'Hành động',
                                    key: 'action',
                                    align: 'right',
                                    render: (_, record) => (
                                        <Button
                                            type="text"
                                            size="large"
                                            icon={<EyeOutlined />}
                                            onClick={() => router.push(`/orders?order_code=${record.order_code}`)}
                                            className="text-indigo-600 hover:bg-indigo-50 rounded-2xl font-bold tracking-tight"
                                        >
                                            Chi tiết
                                        </Button>
                                    )
                                }
                            ]}
                        />

                        {/* --- Load More Button --- */}
                        {hasMoreOrders && (
                            <div className="flex justify-center mt-12 mb-6">
                                <Button
                                    onClick={handleLoadMore}
                                    loading={ordersLoading}
                                    className="h-16 px-12 rounded-[1.5rem] font-bold text-indigo-600 border-2 border-slate-100 hover:border-indigo-600 hover:text-indigo-700 flex items-center gap-4 bg-white shadow-2xl shadow-indigo-50 transition-all duration-300 transform hover:scale-105 active:scale-95"
                                >
                                    Tải thêm các đơn hàng cũ
                                    <ChevronDown size={24} className="animate-bounce" />
                                </Button>
                            </div>
                        )}

                        {/* --- End of List Divider --- */}
                        {!hasMoreOrders && userOrders.length > 0 && (
                            <div className="text-center py-12 px-10">
                                <Divider className="!border-slate-100 font-bold text-slate-300 text-[10px] uppercase tracking-[0.5em]">
                                    Hết danh sách giao dịch
                                </Divider>
                            </div>
                        )}

                        {/* --- Empty State --- */}
                        {userOrders.length === 0 && !ordersLoading && (
                            <div className="py-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                <Empty
                                    description={
                                        <span className="font-bold text-slate-300 uppercase tracking-widest text-xs">
                                            Chưa có bất kỳ giao dịch nào
                                        </span>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </Tabs.TabPane>

                {/* ============================================================
                    TAB 3: NOTES (GHI CHÚ) - Coming Soon
                    ============================================================ */}
                <Tabs.TabPane
                    tab={
                        <span className="flex items-center gap-2 px-4 py-2 text-base font-bold text-slate-400 transition-all">
                            <Lightbulb size={20} /> Ghi chú
                        </span>
                    }
                    key="3"
                >
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-200 border border-slate-100 shadow-inner">
                                <Lightbulb size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
                                Tính năng Đang hoàn thiện
                            </h3>
                            <p className="text-slate-400 max-w-sm mx-auto font-medium text-base">
                                Bạn sẽ sớm có thể lưu lại các ghi chú cá nhân hóa về thói quen đặt tour và yêu cầu riêng của từng khách hàng.
                            </p>
                            <Button
                                className="mt-8 h-14 px-10 rounded-2xl font-bold border-slate-200 text-slate-400 disabled"
                                disabled
                            >
                                Chờ cập nhật
                            </Button>
                        </div>
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
}