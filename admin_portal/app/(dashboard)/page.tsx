"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, DatePicker, Button, Table, Tag, Progress, Spin, Empty, Tooltip, Avatar } from 'antd';
import { Can } from '@/components/common/AccessControl';
import { AuthService } from '@/services/auth.service';
import { useLayoutContext } from '@/context/LayoutContext';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { statisticsService, DashboardOverviewData, DashboardSchedulesData } from '@/services/statistics.service';

// Dynamic import charts to avoid SSR issues
const Pie = dynamic(() => import('@ant-design/charts').then(mod => mod.Pie), { ssr: false });
const Bar = dynamic(() => import('@ant-design/charts').then(mod => mod.Bar), { ssr: false });
const Area = dynamic(() => import('@ant-design/charts').then(mod => mod.Area), { ssr: false });

const { RangePicker } = DatePicker;

// Format currency
const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)}B ₫`;
    }
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M ₫`;
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Format number
const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
};

// Status colors
const STATUS_COLORS: Record<string, string> = {
    PENDING: '#F59E0B',
    CONFIRMED: '#3B82F6',
    PAID: '#10B981',
    CANCELLED: '#EF4444',
    REFUNDED: '#6B7280',
    OPEN: '#10B981',
    FULL: '#EF4444',
};

// KPI Card Component
interface KPICardProps {
    title: string;
    value: string | number;
    change?: number | null;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change }) => (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="text-slate-600 text-sm font-medium mb-2">{title}</div>
        <div className="text-3xl font-bold text-slate-900 mb-2">{value}</div>
        {change !== null && change !== undefined && (
            <div className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs kỳ trước
            </div>
        )}
    </div>
);

// Schedule KPI Card Component
interface ScheduleKPIProps {
    title: string;
    value: string | number;
}

const ScheduleKPI: React.FC<ScheduleKPIProps> = ({ title, value }) => (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
        <div className="text-slate-600 text-sm mb-1">{title}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
);

export default function DashboardPage() {
    const { isAdmin, userProfile, isLoadingPermissions } = useLayoutContext();
    const jwtUser = AuthService.getCurrentUser();
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState<DashboardOverviewData | null>(null);
    const [schedulesData, setSchedulesData] = useState<DashboardSchedulesData | null>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().subtract(30, 'day'),
        dayjs()
    ]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [overview, schedules] = await Promise.all([
                statisticsService.getDashboardOverview({
                    startDate: dateRange[0].format('YYYY-MM-DD'),
                    endDate: dateRange[1].format('YYYY-MM-DD'),
                }),
                statisticsService.getDashboardSchedules()
            ]);
            setOverviewData(overview);
            setSchedulesData(schedules);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Revenue Area Chart Config
    const revenueChartConfig = {
        data: overviewData?.revenueByTime || [],
        xField: 'date',
        yField: 'revenue',
        smooth: true,
        areaStyle: {
            fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
        },
        line: {
            color: '#1890ff',
        },
        xAxis: {
            label: {
                formatter: (v: string) => dayjs(v).format('DD/MM'),
            },
        },
        yAxis: {
            label: {
                formatter: (v: string) => formatCurrency(Number(v)),
            },
        },
        tooltip: {
            formatter: (datum: { date: string; revenue: number; orders: number }) => {
                return {
                    name: 'Doanh thu',
                    value: formatCurrency(datum.revenue),
                };
            },
        },
        height: 300,
    };

    // Orders Status Pie Config
    const orderStatusConfig = {
        data: overviewData?.ordersByStatus || [],
        angleField: 'count',
        colorField: 'status',
        radius: 0.8,
        innerRadius: 0.6,
        color: (datum: { status: string }) => STATUS_COLORS[datum.status] || '#6B7280',
        label: {
            type: 'outer',
            formatter: (datum: any) => {
                if (!datum) return '';
                const p = datum.percentage !== undefined ? datum.percentage : (datum.percent ? datum.percent * 100 : 0);
                return `${Number(p).toFixed(1)}%`;
            },
        },
        legend: {
            position: 'bottom' as const,
        },
        statistic: {
            title: {
                content: 'Tổng',
                style: { fontSize: '14px' },
            },
            content: {
                content: `${overviewData?.summary?.totalOrders || 0}`,
                style: { fontSize: '24px', fontWeight: 'bold' },
            },
        },
        height: 300,
    };

    // Revenue by Category Pie Config
    const categoryConfig = {
        data: overviewData?.revenueByCategory || [],
        angleField: 'revenue',
        colorField: 'categoryName',
        radius: 0.8,
        innerRadius: 0.6,
        label: {
            type: 'outer',
            formatter: (datum: any) => {
                if (!datum) return '';
                const p = datum.percentage !== undefined ? datum.percentage : (datum.percent ? datum.percent * 100 : 0);
                return `${Number(p).toFixed(1)}%`;
            },
        },
        legend: {
            position: 'bottom' as const,
        },
        interactions: [{ type: 'element-active' }],
        height: 300,
    };

    // Top Tours Bar Config
    const topToursConfig = {
        data: (overviewData?.topTours || []).slice(0, 5).reverse(),
        xField: 'bookingCount',
        yField: 'tourName',
        seriesField: 'tourName',
        color: '#1890ff',
        label: {
            position: 'right' as const,
            formatter: (v: any) => {
                const count = typeof v === 'object' ? v.bookingCount : v;
                return count !== undefined ? `${count} đặt` : '';
            },
        },
        legend: false as const,
        xAxis: {
            label: {
                formatter: (v: string) => `${v}`,
            },
        },
        height: 300,
    };

    // Occupancy by Tour Bar Config - IMPROVED VERSION
    const occupancyByTourConfig = {
        data: (schedulesData?.occupancyByTour || [])
            .filter(t => t.avgOccupancy > 0)
            .slice(0, 8)
            .sort((a, b) => a.avgOccupancy - b.avgOccupancy), // Sắp xếp tăng dần
        xField: 'avgOccupancy',
        yField: 'tourName',
        seriesField: 'tourName',

        // Màu sắc theo ngưỡng
        color: ({ avgOccupancy }: { avgOccupancy?: number }) => {
            const val = avgOccupancy ?? 0;
            if (val >= 80) return '#10B981'; // Green - Cao
            if (val >= 60) return '#3B82F6'; // Blue - Tốt
            if (val >= 40) return '#F59E0B'; // Orange - Trung bình
            return '#94A3B8'; // Gray - Thấp
        },

        barStyle: {
            radius: [0, 8, 8, 0],
        },

        // Label bên trong thanh
        label: {
            position: 'middle' as const,
            offset: 0,
            style: {
                fill: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                textAlign: 'center',
            },
            formatter: ({ avgOccupancy }: { avgOccupancy?: number }) =>
                `${(avgOccupancy ?? 0).toFixed(0)}%`,
        },

        tooltip: {
            domStyles: {
                'g2-tooltip': {
                    background: 'rgba(0, 0, 0, 0.85)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: 'none',
                    padding: '12px 16px',
                },
                'g2-tooltip-title': {
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginBottom: '8px',
                },
                'g2-tooltip-list-item': {
                    color: '#ffffff',
                    fontSize: '13px',
                }
            },
            formatter: (datum: any) => ({
                name: 'Tỷ lệ lấp đầy',
                value: `${datum.avgOccupancy.toFixed(1)}%`
            }),
        },

        legend: false as const,

        xAxis: {
            max: 100,
            grid: {
                line: {
                    style: {
                        stroke: '#F1F5F9',
                        lineWidth: 1,
                    }
                }
            },
            label: {
                formatter: (v: string) => `${v}%`,
                style: {
                    fill: '#64748B',
                    fontSize: 12,
                },
            },
        },

        yAxis: {
            line: null,
            tickLine: null,
            grid: {
                line: {
                    style: {
                        stroke: '#F1F5F9',
                    }
                }
            },
            label: {
                offset: 12,
                formatter: (v: string) => {
                    if (v.length > 25) return v.substring(0, 22) + '...';
                    return v;
                },
                style: {
                    fill: '#1E293B',
                    fontSize: 13,
                    fontWeight: 500,
                },
            },
        },

        interactions: [
            { type: 'element-active' },
            { type: 'element-highlight' }
        ],

        animation: {
            appear: {
                animation: 'scale-in-x',
                duration: 800,
                easing: 'easeOutQuart',
            },
        },

        height: 350,
        padding: [20, 40, 50, 180],
    };

    // Occupancy Trend Area Config
    const occupancyTrendConfig = {
        data: schedulesData?.occupancyTrend || [],
        xField: 'week',
        yField: 'avgOccupancy',
        smooth: true,
        areaStyle: {
            fill: 'l(270) 0:#ffffff 0.5:#95de64 1:#52c41a',
        },
        line: {
            color: '#52c41a',
        },
        xAxis: {
            label: {
                formatter: (v: string) => v.replace('2026-', 'Tuần ').replace('W', ''),
            },
        },
        yAxis: {
            max: 100,
            label: {
                formatter: (v: string) => `${v}%`,
            },
        },
        height: 280,
    };

    // Upcoming Schedules Table Columns
    const scheduleColumns = [
        {
            title: 'STT',
            key: 'stt',
            width: '6%',
            align: 'center' as const,
            render: (_: unknown, __: unknown, index: number) => (
                <span className="text-slate-600 font-medium">{index + 1}</span>
            ),
        },
        {
            title: 'Tour',
            dataIndex: 'tourName',
            key: 'tourName',
            ellipsis: true,
            width: '24%',
        },
        {
            title: 'Ngày khởi hành',
            key: 'dateRange',
            width: '18%',
            render: (_: unknown, record: { startDate: string; endDate: string }) => (
                <span className="text-slate-700">
                    {dayjs(record.startDate).format('DD/MM')} - {dayjs(record.endDate).format('DD/MM')}
                </span>
            ),
        },
        {
            title: 'Chỗ',
            key: 'slots',
            width: '12%',
            render: (_: unknown, record: { bookedSlots: number; totalSlots: number }) => (
                <span className="font-semibold text-slate-900">
                    {record.bookedSlots}/{record.totalSlots}
                </span>
            ),
        },
        {
            title: 'Tỷ lệ lấp đầy',
            key: 'occupancy',
            width: '25%',
            render: (_: unknown, record: { occupancyRate: number }) => {
                const color = record.occupancyRate >= 70 ? '#10B981' : record.occupancyRate >= 30 ? '#F59E0B' : '#EF4444';
                return (
                    <div className="flex items-center gap-2">
                        <Progress
                            percent={record.occupancyRate}
                            strokeColor={color}
                            trailColor="#F1F5F9"
                            size="small"
                            showInfo={false}
                        />
                        <span className="text-sm font-semibold text-slate-700 min-w-[45px]">
                            {record.occupancyRate.toFixed(0)}%
                        </span>
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: '18%',
            render: (status: string) => {
                const colorMap: Record<string, any> = {
                    OPEN: 'success',
                    FULL: 'error',
                    CANCELLED: 'default',
                };
                const labelMap: Record<string, string> = {
                    OPEN: 'Mở đặt',
                    FULL: 'Hết chỗ',
                    CANCELLED: 'Đã hủy',
                };
                return <Tag color={colorMap[status]}>{labelMap[status] || status}</Tag>;
            },
        },
    ];

    if (loading || isLoadingPermissions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6">
            {/* Personalized Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">
                        Chào mừng trở lại, {userProfile?.full_name || jwtUser?.email?.split('@')[0] || 'Admin'}!
                    </h1>
                    <p className="text-blue-100 text-lg">
                        {isAdmin ? 'Hệ thống đã sẵn sàng cho ngày làm việc mới của bạn.' : 'Đây là tổng quan công việc dựa trên quyền hạn của bạn.'}
                    </p>
                </div>
                {userProfile?.avatar_url && (
                    <Avatar
                        src={userProfile.avatar_url}
                        size={80}
                        className="absolute right-8 top-1/2 -translate-y-1/2 border-4 border-white/30"
                    />
                )}
                <Button type="primary" size="large" className="mt-4 mr-3 bg-white text-blue-600 border-0 hover:bg-blue-50">
                    Tạo tour mới
                </Button>
                <Button size="large" className="mt-4 bg-blue-500 text-white border-0 hover:bg-blue-400">
                    Xem đơn hàng
                </Button>
                {/* Decorative circles */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"></div>
                <div className="absolute -right-5 top-20 w-24 h-24 bg-white/10 rounded-full"></div>
            </div>

            {/* Header with Date Picker */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Phân tích & Thống kê</h2>
                <div className="flex gap-3">
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                            if (dates && dates[0] && dates[1]) {
                                setDateRange([dates[0], dates[1]]);
                            }
                        }}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        className="rounded-xl border-slate-200"
                    />
                    <Button
                        type="primary"
                        onClick={fetchData}
                        loading={loading}
                        className="rounded-xl"
                    >
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard
                    title="Tổng doanh thu"
                    value={formatCurrency(overviewData?.summary?.totalRevenue || 0)}
                    change={overviewData?.summary?.revenueChange}
                />
                <KPICard
                    title="Đơn hàng"
                    value={formatNumber(overviewData?.summary?.totalOrders || 0)}
                    change={overviewData?.summary?.ordersChange}
                />
                <KPICard
                    title="Khách hàng"
                    value={formatNumber(overviewData?.summary?.totalCustomers || 0)}
                    change={overviewData?.summary?.customersChange}
                />
                <KPICard
                    title="Giá trị TB/Đơn"
                    value={formatCurrency(overviewData?.summary?.avgOrderValue || 0)}
                    change={overviewData?.summary?.avgOrderValueChange}
                />
            </div>

            {/* Charts Row 1: Revenue & Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card title="Xu hướng doanh thu" className="rounded-2xl shadow-sm col-span-2">
                    {overviewData?.revenueByTime && overviewData.revenueByTime.length > 0 ? (
                        <Area {...revenueChartConfig} />
                    ) : (
                        <Empty description="Chưa có dữ liệu" />
                    )}
                </Card>
                <Card title="Đơn hàng theo trạng thái" className="rounded-2xl shadow-sm">
                    {overviewData?.ordersByStatus && overviewData.ordersByStatus.length > 0 ? (
                        <Pie {...orderStatusConfig} />
                    ) : (
                        <Empty description="Chưa có dữ liệu" />
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card title="Doanh thu theo danh mục" className="rounded-2xl shadow-sm">
                    {overviewData?.revenueByCategory && overviewData.revenueByCategory.length > 0 ? (
                        <Pie {...categoryConfig} />
                    ) : (
                        <Empty description="Chưa có dữ liệu" />
                    )}
                </Card>
                <Card
                    title="Top 5 Tour Bán Chạy"
                    className="rounded-2xl shadow-sm"
                    extra={<span className="text-sm text-slate-500">Theo số lượt đặt</span>}
                >
                    <Table
                        dataSource={overviewData?.topTours?.slice(0, 5) || []}
                        pagination={false}
                        size="small"
                        rowKey="tourId"
                        columns={[
                            {
                                title: 'Hạng',
                                key: 'rank',
                                width: '80px',
                                render: (_: any, __: any, index: number) => (
                                    <div className="flex items-center justify-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
                      ${index === 1 ? 'bg-slate-300 text-slate-700' : ''}
                      ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
                      ${index > 2 ? 'bg-slate-100 text-slate-600' : ''}
                    `}>
                                            {index + 1}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: 'Tên Tour',
                                dataIndex: 'tourName',
                                key: 'tourName',
                                render: (text: string) => {
                                    const tour = overviewData?.topTours?.find(t => t.tourName === text);
                                    const maxBooking = overviewData?.topTours && overviewData.topTours.length > 0 ? overviewData.topTours[0].bookingCount : 1;
                                    const percent = tour ? (tour.bookingCount / (maxBooking || 1)) * 100 : 0;

                                    return (
                                        <div className="py-1">
                                            <div className="font-medium text-slate-900 mb-1">{text}</div>
                                            <Progress
                                                percent={percent}
                                                size="small"
                                                showInfo={false}
                                                strokeColor="#3B82F6"
                                                trailColor="#F1F5F9"
                                            />
                                        </div>
                                    );
                                }
                            },
                            {
                                title: 'Lượt đặt',
                                dataIndex: 'bookingCount',
                                key: 'bookingCount',
                                align: 'right',
                                render: (val: number) => <span className="font-semibold text-blue-600">{val} lượt</span>
                            },
                            {
                                title: 'Doanh thu',
                                dataIndex: 'revenue',
                                key: 'revenue',
                                align: 'right',
                                render: (val: number) => <span className="font-bold text-green-600">{formatCurrency(val)}</span>
                            }
                        ]}
                    />
                </Card>
            </div>

            {/* Schedules Management Section */}
            <Card
                title={
                    <div className="flex items-center gap-3 mt-4 mb-4">
                        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                        <div>
                            <div className="text-lg font-bold text-slate-900">Quản lý lịch khởi hành</div>
                            <div className="text-sm font-normal text-slate-500">Theo dõi tình trạng và tỷ lệ lấp đầy</div>
                        </div>
                    </div>
                }
                className="rounded-2xl shadow-sm mb-16"
            >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <ScheduleKPI
                        title="Tổng lịch khởi hành"
                        value={schedulesData?.summary?.totalSchedules || 0}
                    />
                    <ScheduleKPI
                        title="Đang mở đặt"
                        value={schedulesData?.summary?.openSchedules || 0}
                    />
                    <ScheduleKPI
                        title="Tỷ lệ lấp đầy TB"
                        value={`${schedulesData?.summary?.avgOccupancy?.toFixed(1) || 0}%`}
                    />
                    <ScheduleKPI
                        title="Tour có lịch"
                        value={schedulesData?.summary?.toursWithSchedules || 0}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tỷ lệ lấp đầy theo Tour</h3>
                        {schedulesData?.occupancyByTour && schedulesData.occupancyByTour.filter(t => t.avgOccupancy > 0).length > 0 ? (
                            <Bar {...occupancyByTourConfig} />
                        ) : (
                            <Empty description="Chưa có dữ liệu" />
                        )}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Xu hướng lấp đầy theo tuần</h3>
                        {schedulesData?.occupancyTrend && schedulesData.occupancyTrend.length > 0 ? (
                            <Area {...occupancyTrendConfig} />
                        ) : (
                            <Empty description="Chưa có dữ liệu" />
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Lịch khởi hành sắp tới</h3>
                    <Table
                        dataSource={schedulesData?.upcomingSchedules || []}
                        columns={scheduleColumns}
                        pagination={{
                            pageSize: 5,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '20', '50'],
                            showTotal: (total) => `Tổng ${total} lịch khởi hành`,
                            className: "pb-4"
                        }}
                        rowKey="scheduleId"
                        className="rounded-xl overflow-hidden border border-slate-100"
                    />
                </div>
            </Card>

            {/* Customer Metrics */}
            {overviewData?.customerMetrics && (
                <div className="mt-4 mb-4">
                    <Card title="Thống kê khách hàng" className="rounded-2xl shadow-sm mt-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center p-6 bg-blue-50 rounded-xl">
                                <div className="text-4xl font-bold text-blue-600 mb-2">
                                    {overviewData.customerMetrics.totalParticipants?.adult || 0}
                                </div>
                                <div className="text-slate-600">Người lớn</div>
                            </div>
                            <div className="text-center p-6 bg-green-50 rounded-xl">
                                <div className="text-4xl font-bold text-green-600 mb-2">
                                    {overviewData.customerMetrics.totalParticipants?.child || 0}
                                </div>
                                <div className="text-slate-600">Trẻ em</div>
                            </div>
                            <div className="text-center p-6 bg-purple-50 rounded-xl">
                                <div className="text-4xl font-bold text-purple-600 mb-2">
                                    {overviewData.customerMetrics.totalParticipants?.infant || 0}
                                </div>
                                <div className="text-slate-600">Em bé</div>
                            </div>
                            <div className="text-center p-6 bg-orange-50 rounded-xl">
                                <div className="text-4xl font-bold text-orange-600 mb-2">
                                    {overviewData.customerMetrics.avgParticipantsPerOrder?.toFixed(1) || 0}
                                </div>
                                <div className="text-slate-600">TB người/đơn</div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}