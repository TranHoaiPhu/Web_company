/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, Input, Select, DatePicker, Tag, Modal, message, Row, Col, Card, Statistic, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, DownloadOutlined, ClockCircleOutlined, SearchOutlined, TagOutlined, MessageOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { Can } from '@/components/common/AccessControl';
import dayjs from 'dayjs';
import { scheduleService, Schedule } from '@/services/schedule.service';
import { useLayoutContext } from '@/context/LayoutContext';

const SchedulesPage = () => {
    const { sidebarCollapsed } = useLayoutContext();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
    });
    const [allSchedulesForUpcoming, setAllSchedulesForUpcoming] = useState<Schedule[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        from_date: '',
        to_date: '',
    });

    // Detail Drawer
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [scheduleDetails, setScheduleDetails] = useState<any>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [statistics, setStatistics] = useState<any>(null);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customersLoading, setCustomersLoading] = useState(false);

    // Form for create/edit
    const [form] = Form.useForm();
    const [formDrawerOpen, setFormDrawerOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Fetch schedules
    const fetchSchedules = async (page = 1) => {
        setLoading(true);
        try {
            const response = await scheduleService.getSchedules({
                page,
                limit: pagination.limit,
                ...filters,
                from_date: filters.from_date ? dayjs(filters.from_date).format('YYYY-MM-DD') : '',
                to_date: filters.to_date ? dayjs(filters.to_date).format('YYYY-MM-DD') : '',
            });

            setSchedules(response.data.schedules);
            setPagination(response.data.pagination);
        } catch (error) {
            message.error('Không thể tải danh sách lịch khởi hành');
            console.error(error);
        }
        setLoading(false);
    };

    // Fetch all for upcoming alert
    const fetchAllSchedules = async () => {
        try {
            const response = await scheduleService.getSchedules({
                limit: 100, // Get a good amount to check upcoming
                status: 'OPEN'
            });
            setAllSchedulesForUpcoming(response.data.schedules);
        } catch (error) {
            console.error('Error fetching all schedules:', error);
        }
    };

    // Fetch schedule details
    const fetchScheduleDetails = async (id: string | number) => {
        setDetailsLoading(true);
        try {
            const [detailRes, statsRes, customersRes] = await Promise.all([
                scheduleService.getSchedule(id),
                scheduleService.getScheduleStatistics(id),
                scheduleService.getScheduleCustomers(id),
            ]);

            setScheduleDetails(detailRes.data);
            setStatistics(statsRes.data);
            setCustomers(customersRes.data.customers || []);
        } catch (error) {
            message.error('Không thể tải chi tiết lịch khởi hành');
            console.error(error);
        }
        setDetailsLoading(false);
    };

    // Handle view details
    const handleViewDetails = async (record: Schedule) => {
        setSelectedSchedule(record);
        setDetailDrawerOpen(true);
        await fetchScheduleDetails(record.id);
    };

    // Handle delete
    const handleDelete = (record: Schedule) => {
        // Check if there are any bookings
        if (record.booked_slots > 0) {
            Modal.warning({
                title: 'Không thể xóa lịch khởi hành',
                content: (
                    <div className="mt-4">
                        <p>Lịch khởi hành này đã có <span className="text-red-600 font-bold">{record.booked_slots} khách hàng</span> đặt chỗ.</p>
                        <p className="text-gray-500 text-sm">Để đảm bảo dữ liệu hệ thống, bạn chỉ có thể xóa các lịch khởi hành chưa có người đặt.</p>
                    </div>
                ),
                okText: 'Đã hiểu',
                centered: true,
            });
            return;
        }

        Modal.confirm({
            title: 'Xác nhận xóa lịch khởi hành',
            icon: <DeleteOutlined className="text-red-500 text-2xl" />,
            content: (
                <div className="mt-4">
                    <p className="text-gray-600 text-lg">Bạn chắc chắn muốn xóa lịch này?</p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2">
                        <p className="mb-1"><strong>Tour:</strong> {record.tour_name}</p>
                        <p className="mb-0"><strong>Ngày:</strong> {dayjs(record.start_date).format('DD/MM/YYYY')}</p>
                    </div>
                    <p className="text-red-500 text-xs mt-3 uppercase tracking-wider font-bold">Hành động này không thể hoàn tác</p>
                </div>
            ),
            okText: 'Xác nhận xóa',
            okType: 'primary',
            okButtonProps: { danger: true, size: 'large', className: 'rounded-lg' },
            cancelText: 'Quay lại',
            cancelButtonProps: { size: 'large', className: 'rounded-lg' },
            centered: true,
            width: 480,
            async onOk() {
                try {
                    await scheduleService.deleteSchedule(record.id);
                    message.success('Đã xóa lịch khởi hành thành công');
                    fetchSchedules(pagination.page);
                    fetchAllSchedules();
                } catch (error) {
                    message.error('Có lỗi xảy ra khi xóa lịch khởi hành');
                }
            },
        });
    };

    // Handle filter change
    const handleFilterChange = (field: string, value: any) => {
        setFilters({ ...filters, [field]: value });
    };

    // Table columns
    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_: any, __: any, index: number) => (pagination.page - 1) * pagination.limit + index + 1,
        },
        {
            title: 'Mã lịch',
            dataIndex: 'id',
            key: 'id',
            width: 100,
            render: (text: any) => <span className="font-semibold">#{text}</span>,
            sorter: (a: Schedule, b: Schedule) => a.id - b.id,
        },
        {
            title: 'Tên tour',
            dataIndex: 'tour_name',
            key: 'tour_name',
            width: 200,
            ellipsis: true,
            sorter: (a: Schedule, b: Schedule) => (a.tour_name || '').localeCompare(b.tour_name || ''),
            render: (text: string, record: Schedule) => (
                <Link
                    href={`/tours/${record.tour_id}/edit`}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all"
                >
                    {text}
                </Link>
            )
        },
        {
            title: 'Địa điểm',
            dataIndex: 'location_name',
            key: 'location_name',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Ngày khởi hành',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (date: any) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: Schedule, b: Schedule) => dayjs(a.start_date).diff(dayjs(b.start_date)),
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'end_date',
            key: 'end_date',
            width: 120,
            render: (date: any) => dayjs(date).format('DD/MM/YYYY'),
            sorter: (a: Schedule, b: Schedule) => dayjs(a.end_date).diff(dayjs(b.end_date)),
        },
        {
            title: 'Chỗ trống',
            key: 'slots',
            width: 100,
            render: (_: any, record: Schedule) => (
                <span>
                    {record.available_slots}/{record.total_slots}
                </span>
            ),
            sorter: (a: Schedule, b: Schedule) => a.available_slots - b.available_slots,
        },
        {
            title: 'Tỷ lệ (%) ',
            key: 'occupancy',
            width: 100,
            render: (_: any, record: Schedule) => {
                const total = record.total_slots || 1;
                const booked = record.booking_count || 0;
                const rate = (booked / total * 100);
                return (
                    <div>
                        <div className="text-sm font-semibold">{rate.toFixed(1)}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                    </div>
                );
            },
            sorter: (a: Schedule, b: Schedule) => {
                const rateA = (a.booking_count || 0) / (a.total_slots || 1);
                const rateB = (b.booking_count || 0) / (b.total_slots || 1);
                return rateA - rateB;
            },
        },
        {
            title: 'Số khách',
            dataIndex: 'customer_count',
            key: 'customer_count',
            width: 80,
            render: (count: any) => count || 0,
            sorter: (a: Schedule, b: Schedule) => a.customer_count - b.customer_count,
        },
        {
            title: 'Doanh thu',
            dataIndex: 'revenue',
            key: 'revenue',
            width: 120,
            render: (revenue: any) => `${Number(revenue || 0).toLocaleString()}đ`,
            sorter: (a: Schedule, b: Schedule) => a.revenue - b.revenue,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const statusConfig: Record<string, any> = {
                    OPEN: { color: 'blue', label: 'Mở' },
                    CLOSED: { color: 'red', label: 'Đóng' },
                    FULL: { color: 'orange', label: 'Đầy' },
                };
                const config = statusConfig[status] || { color: 'default', label: status };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: Schedule) => (
                <Space size="small">
                    <Tooltip title="Xem thông tin tour">
                        <Link href={`/tours/${record.tour_id}`}>
                            <Button
                                icon={<TagOutlined />}
                                size="small"
                                className="text-amber-500 border-amber-500 hover:text-amber-600 hover:border-amber-600"
                            />
                        </Link>
                    </Tooltip>
                    <Tooltip title="Chi tiết lịch trình (Orders & Customers)">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleViewDetails(record)}
                        >
                        </Button>
                    </Tooltip>
                    <Can permission="schedules_manage">
                        <Tooltip title="Xóa lịch trình">
                            <Button
                                icon={<DeleteOutlined />}
                                size="small"
                                danger
                                onClick={() => handleDelete(record)}
                            />
                        </Tooltip>
                    </Can>
                </Space>
            ),
        },
    ];

    // Initial fetch
    useEffect(() => {
        fetchSchedules(1);
        fetchAllSchedules();
    }, [filters]);

    // Calculate upcoming
    const upcomingSchedules = allSchedulesForUpcoming.filter(s => {
        const startDate = dayjs(s.start_date);
        return startDate.isAfter(dayjs().subtract(1, 'day')) && startDate.isBefore(dayjs().add(7, 'day'));
    }).sort((a, b) => dayjs(a.start_date).diff(dayjs(b.start_date)));

    return (
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-0'} p-4`}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý lịch khởi hành</h1>
                        <p className="text-gray-600 mt-1">Quản lý các lịch khởi hành của tours</p>
                    </div>
                    {/*  <Can permission="schedules_manage">
                        <Button type="primary" icon={<PlusOutlined />} size="large">
                            Tạo lịch khởi hành
                        </Button>
                    </Can> */}
                </div>

                {/* Upcoming Tours Alert Bar */}
                {upcomingSchedules.length > 0 && (
                    <div className="bg-white px-5 py-4 rounded-xl border-none shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2 text-amber-600 font-bold whitespace-nowrap">
                            <ClockCircleOutlined />
                            <span className="text-sm uppercase tracking-wider text-xs">Sắp khởi hành ({upcomingSchedules.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {upcomingSchedules.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleViewDetails(s)}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium border bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center gap-2 whitespace-nowrap"
                                >
                                    <span className="font-bold text-blue-600">{dayjs(s.start_date).format('DD/MM')}</span>
                                    <span className="max-w-[150px] truncate">{s.tour_name}</span>
                                    {s.available_slots <= 2 && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="md:ml-auto text-[11px] text-slate-400 font-medium italic">
                            * Trong vòng 7 ngày tới
                        </div>
                    </div>
                )}

                {/* Filters */}

                <div className='mb-4'>
                    <Card>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6}>
                                <Input
                                    placeholder="Tìm kiếm tour..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Select
                                    placeholder="Chọn trạng thái"
                                    allowClear
                                    value={filters.status || undefined}
                                    onChange={(value) => handleFilterChange('status', value)}
                                    options={[
                                        { value: 'OPEN', label: 'Mở' },
                                        { value: 'CLOSED', label: 'Đóng' },
                                        { value: 'FULL', label: 'Đầy' },
                                    ]}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <DatePicker
                                    placeholder="Từ ngày"
                                    value={filters.from_date ? dayjs(filters.from_date) : null}
                                    onChange={(date) => handleFilterChange('from_date', date)}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <DatePicker
                                    placeholder="Đến ngày"
                                    value={filters.to_date ? dayjs(filters.to_date) : null}
                                    onChange={(date) => handleFilterChange('to_date', date)}
                                    style={{ width: '100%' }}
                                />
                            </Col>
                        </Row>
                    </Card>
                </div>


                {/* Table */}
                <Card>
                    <Table
                        columns={columns}
                        dataSource={schedules}
                        loading={loading}
                        rowKey="id"
                        rowClassName={(record) => {
                            const isPast = dayjs(record.start_date).isBefore(dayjs(), 'day');
                            return isPast ? 'opacity-50 grayscale-[0.4] bg-slate-50/50' : '';
                        }}
                        pagination={{
                            current: pagination.page,
                            pageSize: pagination.limit,
                            total: pagination.total,
                            //totalBoundaryShowSizeChanger: true,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} lịch khởi hành`,
                            onChange: (page) => {
                                setPagination({ ...pagination, page });
                                fetchSchedules(page);
                            },
                        }}
                        scroll={{ x: 1500 }}
                    />
                </Card>
            </div>

            {/* Detail Drawer */}
            <Drawer
                title={
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                        <span className="text-lg font-bold text-slate-900">Chi tiết lịch khởi hành</span>
                    </div>
                }
                placement="right"
                onClose={() => setDetailDrawerOpen(false)}
                open={detailDrawerOpen}
                width={680}
                loading={detailsLoading}
                styles={{
                    header: {
                        borderBottom: '1px solid #f1f5f9',
                        padding: '20px 24px',
                    },
                    body: {
                        padding: '24px',
                        background: '#fafbfc',
                    }
                }}
            >
                {selectedSchedule && (
                    <div className="space-y-6">
                        {/* Schedule Info */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Thông tin lịch khởi hành</h3>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-1">Mã lịch</p>
                                        <p className="font-semibold text-base text-slate-900">#{selectedSchedule.id}</p>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                                        <Tag
                                            color={
                                                selectedSchedule.status === 'OPEN' ? 'success' :
                                                    selectedSchedule.status === 'CLOSED' ? 'error' :
                                                        'warning'
                                            }
                                            className="font-medium"
                                        >
                                            {selectedSchedule.status === 'OPEN' ? 'Mở đặt' :
                                                selectedSchedule.status === 'CLOSED' ? 'Đã đóng' :
                                                    'Đầy chỗ'}
                                        </Tag>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-1">Ngày khởi hành</p>
                                        <p className="font-semibold text-base text-slate-900">{dayjs(selectedSchedule.start_date).format('DD/MM/YYYY')}</p>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-1">Ngày kết thúc</p>
                                        <p className="font-semibold text-base text-slate-900">{dayjs(selectedSchedule.end_date).format('DD/MM/YYYY')}</p>
                                    </div>
                                </Col>
                                <Col span={24}>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs text-slate-500">Tên tour</p>
                                            <Link
                                                href={`/tours/${selectedSchedule.tour_id}/edit`}
                                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold hover:bg-blue-600 hover:text-white transition-colors"
                                            >
                                                XEM CHI TIẾT TOUR
                                            </Link>
                                        </div>
                                        <p className="font-semibold text-base text-slate-900 leading-relaxed">
                                            {selectedSchedule.tour_name}
                                        </p>
                                    </div>
                                </Col>
                                <Col span={24}>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-500 mb-2">Địa điểm</p>
                                        <p className="font-semibold text-base text-slate-900">{selectedSchedule.location_name}</p>
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Occupancy Stats */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-base font-semibold text-slate-900 mb-4">Thông tin chỗ trống</h3>
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <Statistic
                                            title={<span className="text-xs text-slate-600">Tổng chỗ</span>}
                                            value={selectedSchedule.total_slots}
                                            valueStyle={{
                                                color: '#1e293b',
                                                fontSize: '24px',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <Statistic
                                            title={<span className="text-xs text-slate-600">Đã đặt</span>}
                                            value={selectedSchedule.booking_count}
                                            valueStyle={{
                                                color: '#1e293b',
                                                fontSize: '24px',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <Statistic
                                            title={<span className="text-xs text-slate-600">Còn trống</span>}
                                            value={selectedSchedule.available_slots}
                                            valueStyle={{
                                                color: '#1e293b',
                                                fontSize: '24px',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </div>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <Statistic
                                            title={<span className="text-xs text-slate-600">Tỷ lệ lấp đầy</span>}
                                            value={((selectedSchedule.total_slots - selectedSchedule.available_slots) / selectedSchedule.total_slots * 100)}
                                            precision={1}
                                            suffix="%"
                                            valueStyle={{
                                                color: '#1e293b',
                                                fontSize: '24px',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Statistics */}
                        {statistics && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <h3 className="text-base font-semibold text-slate-900 mb-4">Thống kê chi tiết</h3>
                                <Row gutter={[16, 16]}>
                                    <Col xs={12} sm={8}>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            <Statistic
                                                title={<span className="text-xs text-slate-600">Tổng đơn hàng</span>}
                                                value={statistics.total_orders || 0}
                                                valueStyle={{ color: '#1e293b', fontSize: '20px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} sm={8}>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            <Statistic
                                                title={<span className="text-xs text-slate-600">Đơn đã thanh toán</span>}
                                                value={statistics.paid_orders || 0}
                                                valueStyle={{ color: '#1e293b', fontSize: '20px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={12} sm={8}>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            <Statistic
                                                title={<span className="text-xs text-slate-600">Đơn chưa thanh toán</span>}
                                                value={statistics.unpaid_orders || 0}
                                                valueStyle={{ color: '#1e293b', fontSize: '20px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24}>
                                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                                            <Statistic
                                                title={<span className="text-sm text-slate-600 font-medium">Tổng doanh thu</span>}
                                                value={statistics.total_revenue_confirmed || 0}
                                                formatter={(value) => `${Number(value).toLocaleString()} ₫`}
                                                valueStyle={{ color: '#1e293b', fontSize: '28px', fontWeight: '700' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={8}>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                                            <Statistic
                                                title={<span className="text-xs text-slate-600">Người lớn</span>}
                                                value={statistics.total_adults || 0}
                                                valueStyle={{ color: '#1e293b', fontSize: '20px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={8}>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                                            <Statistic
                                                title={<span className="text-xs text-slate-600">Trẻ em</span>}
                                                value={statistics.total_children || 0}
                                                valueStyle={{ color: '#1e293b', fontSize: '20px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={8}>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
                                            <Statistic
                                                title={<span className="text-xs text-slate-600">Em bé</span>}
                                                value={statistics.total_infants || 0}
                                                valueStyle={{ color: '#1e293b', fontSize: '20px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        {/* Customers List */}
                        {customers.length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-slate-900">Danh sách khách hàng</h3>
                                    <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                        {customers.length} khách
                                    </span>
                                </div>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {customers.map((customer, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="font-semibold text-base text-slate-900">{customer.contact_name}</span>
                                                <Tag
                                                    color={customer.payment_status === 'PAID' ? 'success' : 'error'}
                                                    className="font-medium"
                                                >
                                                    {customer.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                </Tag>
                                            </div>
                                            <div className="space-y-2 text-sm text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 w-16">SĐT:</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{customer.contact_phone}</span>
                                                        <Tooltip title="Chat Zalo">
                                                            <Button
                                                                size="small"
                                                                type="text"
                                                                icon={<MessageOutlined className="text-emerald-500" />}
                                                                className="h-5 w-5 flex items-center justify-center p-0"
                                                                onClick={() => {
                                                                    const cleanPhone = customer.contact_phone.replace(/\D/g, '');
                                                                    window.open(`https://zalo.me/${cleanPhone}`, '_blank');
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 w-16">Email:</span>
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <span className="font-medium truncate">{customer.contact_email}</span>
                                                        <Tooltip title="Gửi Email">
                                                            <Button
                                                                size="small"
                                                                type="text"
                                                                icon={<MailOutlined className="text-rose-500" />}
                                                                className="h-5 w-5 flex items-center justify-center p-0"
                                                                onClick={() => window.location.href = `mailto:${customer.contact_email}?subject=Liên hệ về tour ${selectedSchedule.tour_name}`}
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-500 w-16">Số người:</span>
                                                    <span className="font-medium">
                                                        {customer.total_participants} người ({customer.adult_quantity} ĐT, {customer.child_quantity} TrE, {customer.infant_quantity} EB)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                                                    <span className="text-slate-500 w-16">Tổng tiền:</span>
                                                    <span className="font-bold text-base text-slate-900">
                                                        {Number(customer.total_price || 0).toLocaleString()} ₫
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Note */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                <span className="font-semibold text-slate-900">Ghi chú:</span> Để xem chi tiết danh sách hành khách đầy đủ, vui lòng vào mục
                                <span className="font-semibold text-slate-900"> "Quản lý hành khách" </span>
                                trên thanh menu bên trái.
                            </p>
                        </div>
                    </div>
                )}

                <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `}</style>
            </Drawer>

        </div >
    );
};

export default SchedulesPage;
