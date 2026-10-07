/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Input, Select, DatePicker, Tag, Modal, message, Row, Col, Card, Statistic } from 'antd';
import { DeleteOutlined, EyeOutlined, DownloadOutlined, PhoneOutlined, MailOutlined, FileTextOutlined, SearchOutlined, ReloadOutlined, TeamOutlined, ClockCircleOutlined, RightOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleService } from '@/services/schedule.service';
import { useLayoutContext } from '@/context/LayoutContext';

interface Participant {
    id: number;
    order_id: number;
    full_name: string;
    participant_type: 'ADULT' | 'CHILD' | 'INFANT';
    gender: string;
    date_of_birth: string;
    id_number: string;
    nationality: string;
    phone: string;
    email: string;
    special_notes: string;
    order_code?: string;
    booking_contact?: string;
    payment_status?: string;
    order_status?: string;
    tour_id?: number;
    tour_name?: string;
    schedule_id?: number;
    start_date?: string;
    end_date?: string;
}

const TourCustomersPage = () => {
    const { sidebarCollapsed } = useLayoutContext();
    const [schedules, setSchedules] = useState<any[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0,
    });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        participant_type: '',
        gender: '',
        schedule_id: '', // Lịch trình được chọn
    });

    // Detail Drawer
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

    // Fetch all schedules for filter dropdown
    const fetchSchedules = async () => {
        setSchedulesLoading(true);
        try {
            const res = await scheduleService.getSchedules({ limit: 1000 });
            setSchedules(res.data.schedules);
        } catch (error) {
            message.error('Không thể tải danh sách lịch trình');
            console.error(error);
        }
        setSchedulesLoading(false);
    };

    // Fetch participants for selected schedule
    const fetchParticipants = async (scheduleId?: string) => {
        setLoading(true);
        try {
            if (!scheduleId) {
                setParticipants([]);
                setPagination({ page: 1, limit: 20, total: 0, total_pages: 0 });
                setLoading(false);
                return;
            }

            const participantsRes = await scheduleService.getScheduleParticipants(scheduleId);
            let allParticipants = (participantsRes.data.participants || []).map((p: any) => ({
                ...p,
                schedule_id: scheduleId,
                tour_id: selectedSchedule?.tour_id,
                tour_name: selectedSchedule?.tour_name,
                start_date: selectedSchedule?.start_date,
                end_date: selectedSchedule?.end_date,
            }));

            // Apply filters
            let filtered = allParticipants;
            if (filters.search) {
                filtered = filtered.filter((p: Participant) =>
                    p.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                    (p.phone && p.phone.includes(filters.search)) ||
                    (p.email && p.email.toLowerCase().includes(filters.search.toLowerCase())) ||
                    (p.id_number && p.id_number.includes(filters.search))
                );
            }
            if (filters.participant_type) {
                filtered = filtered.filter((p: Participant) => p.participant_type === filters.participant_type);
            }
            if (filters.gender) {
                filtered = filtered.filter((p: Participant) => p.gender === filters.gender);
            }

            // Pagination
            const total = filtered.length;
            const start = (pagination.page - 1) * pagination.limit;
            const paginatedParticipants = filtered.slice(start, start + pagination.limit);

            setParticipants(paginatedParticipants);
            setPagination({
                ...pagination,
                total,
                total_pages: Math.ceil(total / pagination.limit),
            });
        } catch (error) {
            message.error('Không thể tải danh sách hành khách');
            console.error(error);
        }
        setLoading(false);
    };

    // Handle view details
    const handleViewDetails = (record: Participant) => {
        setSelectedParticipant(record);
        setDetailDrawerOpen(true);
    };

    // Handle filter change
    const handleFilterChange = (field: string, value: any) => {
        setPagination({ ...pagination, page: 1 });
        setFilters({ ...filters, [field]: value });
    };
    // Handle schedule change
    const handleScheduleChange = (scheduleId: string) => {
        const selected = schedules.find(s => String(s.id) === scheduleId);
        setSelectedSchedule(selected || null);
        setFilters({ ...filters, schedule_id: scheduleId });
        setPagination({ ...pagination, page: 1 });
    };

    // Table columns
    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_: any, __: any, index: number) => (pagination.page - 1) * pagination.limit + index + 1,
        },
        {
            title: 'Mã đơn',
            dataIndex: 'order_code',
            key: 'order_code',
            width: 150,
            render: (code: string) => (
                <Tag className="m-0 border-none bg-blue-50 text-blue-600 font-mono font-medium">
                    {code || '-'}
                </Tag>
            ),
        },
        {
            title: 'Họ tên',
            dataIndex: 'full_name',
            key: 'full_name',
            width: 180,
            sorter: (a: Participant, b: Participant) => a.full_name.localeCompare(b.full_name),
        },
        {
            title: 'Loại',
            dataIndex: 'participant_type',
            key: 'participant_type',
            width: 100,
            render: (type: string) => {
                const typeConfig: Record<string, any> = {
                    ADULT: { color: 'blue', label: 'Người lớn' },
                    CHILD: { color: 'orange', label: 'Trẻ em' },
                    INFANT: { color: 'green', label: 'Em bé' },
                };
                const config = typeConfig[type] || { color: 'default', label: type };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 80,
            render: (gender: string) => gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : '-',
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'date_of_birth',
            key: 'date_of_birth',
            width: 120,
            render: (dob: string) => dob ? dayjs(dob).format('DD/MM/YYYY') : '-',
        },
        /*  {
             title: 'SĐT',
             dataIndex: 'phone',
             key: 'phone',
             width: 120,
             render: (phone: string) => phone ? (
                 <div className="flex items-center gap-2">
                     <PhoneOutlined className="text-blue-500" />
                     <span>{phone}</span>
                 </div>
             ) : '-',
         }, */
        /*   {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
              width: 150,
              ellipsis: true,
              render: (email: string) => email ? (
                  <div className="flex items-center gap-2">
                      <MailOutlined className="text-slate-400" />
                      <span className="truncate">{email}</span>
                  </div>
              ) : '-',
          }, */
        {
            title: 'Tour',
            dataIndex: 'tour_name',
            key: 'tour_name',
            width: 150,
            ellipsis: true,
        },
        {
            title: 'Ngày khởi hành',
            dataIndex: 'start_date',
            key: 'start_date',
            width: 120,
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 100,
            fixed: 'right' as const,
            render: (_: any, record: Participant) => (
                <Space size="small">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => handleViewDetails(record)}
                    >
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    // Initial fetch
    useEffect(() => {
        fetchSchedules();
    }, []);

    // Fetch participants when schedule changes
    useEffect(() => {
        if (filters.schedule_id) {
            fetchParticipants(filters.schedule_id);
        }
    }, [filters.schedule_id, filters.participant_type, filters.gender, filters.search, pagination.page]);

    // Statistics
    const adultsCount = participants.filter(p => p.participant_type === 'ADULT').length;
    const childrenCount = participants.filter(p => p.participant_type === 'CHILD').length;
    const infantsCount = participants.filter(p => p.participant_type === 'INFANT').length;

    // Calculate upcoming schedules (e.g., within next 7 days)
    const upcomingSchedules = schedules.filter(s => {
        const startDate = dayjs(s.start_date);
        return startDate.isAfter(dayjs().subtract(1, 'day')) && startDate.isBefore(dayjs().add(7, 'day'));
    }).sort((a, b) => dayjs(a.start_date).diff(dayjs(b.start_date)));

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                            Quản lý hành khách
                        </h1>
                        <p className="text-slate-500 mt-1 ml-5">Tra cứu và quản lý danh sách thành viên theo từng chuyến đi</p>
                    </div>
                    {filters.schedule_id && (
                        <Button
                            icon={<DownloadOutlined />}
                            className="flex items-center gap-2 h-10 px-6 rounded-lg border-slate-200 hover:text-blue-600 hover:border-blue-600"
                        >
                            Xuất danh sách (Excel)
                        </Button>
                    )}
                </div>

                {/* Upcoming Tours Alert Bar */}
                {upcomingSchedules.length > 0 && (
                    <div className="bg-white px-5 py-4 rounded-xl border-none shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2 text-amber-600 font-bold whitespace-nowrap">
                            <ClockCircleOutlined />
                            <span className="text-sm uppercase tracking-wider">Sắp khởi hành ({upcomingSchedules.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {upcomingSchedules.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleScheduleChange(String(s.id))}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2 whitespace-nowrap
                                        ${filters.schedule_id === String(s.id)
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'}`}
                                >
                                    <span className="font-bold">{dayjs(s.start_date).format('DD/MM')}</span>
                                    <span className="max-w-[150px] truncate">{s.tour_name}</span>
                                    {s.booked_slots >= s.total_slots && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                </button>
                            ))}
                        </div>
                        <div className="md:ml-auto text-[11px] text-slate-400 font-medium italic">
                            * Trong vòng 7 ngày tới
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                {filters.schedule_id && (
                    <Row gutter={[16, 16]}>
                        {[
                            { title: 'Tổng hành khách', value: pagination.total, bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
                            { title: 'Người lớn', value: adultsCount, bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
                            { title: 'Trẻ em', value: childrenCount, bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
                            { title: 'Em bé', value: infantsCount, bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500' }
                        ].map((stat, idx) => (
                            <Col xs={12} sm={6} lg={6} key={idx}>
                                <Card className="border-none shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
                                            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.text} flex items-center justify-center text-xl`}>
                                        </div>
                                    </div>
                                    <div className={`absolute bottom-0 left-0 w-full h-1 ${stat.bar} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}></div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* Filters - White Theme */}
                <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                    <div className="p-1">
                        <Row gutter={[16, 16]}>
                            {/* Schedule Selection - Clean & Integrated */}
                            <Col xs={24}>
                                <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 text-blue-600">
                                        Chọn lịch trình để hiển thị
                                    </h3>
                                    <Select
                                        placeholder="Tìm và chọn lịch khởi hành của tour..."
                                        allowClear
                                        showSearch
                                        loading={schedulesLoading}
                                        value={filters.schedule_id || undefined}
                                        onChange={handleScheduleChange}
                                        className="w-full custom-select"
                                        style={{ height: '48px' }}
                                        options={schedules.map(s => ({
                                            value: String(s.id),
                                            label: `${s.tour_name} | Khởi hành: ${dayjs(s.start_date).format('DD/MM/YYYY')} (${s.booked_slots}/${s.total_slots} khách)`
                                        }))}
                                        size="large"
                                    />

                                    {selectedSchedule && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">Tên Tour</p>
                                                <p className="text-sm font-semibold text-slate-700 line-clamp-1">{selectedSchedule.tour_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">Hành trình</p>
                                                <p className="text-sm font-semibold text-slate-700">{dayjs(selectedSchedule.start_date).format('DD/MM/YYYY')} - {dayjs(selectedSchedule.end_date).format('DD/MM/YYYY')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">Địa điểm</p>
                                                <p className="text-sm font-semibold text-slate-700">{selectedSchedule.location_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">Tình trạng chỗ</p>
                                                <p className="text-sm font-semibold text-slate-700">{selectedSchedule.booked_slots}/{selectedSchedule.total_slots} đã đặt</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Col>

                            {/* Secondary Filters */}
                            {filters.schedule_id && (
                                <>
                                    <Col xs={24} md={10}>
                                        <Input
                                            placeholder="Tiềm kiếm nhanh hành khách (Tên, SĐT, Email)..."
                                            prefix={<SearchOutlined className="text-slate-400" />}
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            allowClear
                                            className="h-11 rounded-lg border-slate-200"
                                        />
                                    </Col>
                                    <Col xs={24} md={5}>
                                        <Select
                                            placeholder="Tất cả loại khách"
                                            allowClear
                                            className="w-full h-11"
                                            value={filters.participant_type || undefined}
                                            onChange={(value) => handleFilterChange('participant_type', value)}
                                            options={[
                                                { value: 'ADULT', label: 'Người lớn' },
                                                { value: 'CHILD', label: 'Trẻ em' },
                                                { value: 'INFANT', label: 'Em bé' },
                                            ]}
                                        />
                                    </Col>
                                    <Col xs={24} md={5}>
                                        <Select
                                            placeholder="Giới tính"
                                            allowClear
                                            className="w-full h-11"
                                            value={filters.gender || undefined}
                                            onChange={(value) => handleFilterChange('gender', value)}
                                            options={[
                                                { value: 'MALE', label: 'Nam' },
                                                { value: 'FEMALE', label: 'Nữ' },
                                            ]}
                                        />
                                    </Col>
                                    <Col xs={24} md={4}>
                                        <Button
                                            icon={<ReloadOutlined size={14} />}
                                            className="w-full h-11 border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-600"
                                            onClick={() => {
                                                setFilters({ search: '', participant_type: '', gender: '', schedule_id: filters.schedule_id });
                                                setPagination({ ...pagination, page: 1 });
                                            }}
                                        >
                                            Làm mới bộ lọc
                                        </Button>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </div>
                </Card>

                {/* Results Section */}
                {!filters.schedule_id ? (
                    <Card className="border-none shadow-sm rounded-2xl py-20 text-center bg-white">
                        <div className="max-w-md mx-auto">
                            <h2 className="text-xl font-bold text-slate-800">Bắt đầu bằng cách chọn lịch trình</h2>
                            <p className="text-slate-500 mt-2">Dữ liệu hành khách sẽ hiện thị tại đây sau khi bạn chọn một lịch khởi hành cụ thể từ danh sách phía trên.</p>
                        </div>
                    </Card>
                ) : (
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Danh sách hành khách tham gia</h3>
                            <Tag color="blue" className="px-3 py-1 rounded-full font-medium border-blue-100">
                                {pagination.total} hành khách
                            </Tag>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={participants}
                            loading={loading}
                            rowKey={(record, index) => `${record.id}-${index}`}
                            scroll={{ x: 1300 }}
                            className="custom-table"
                            rowClassName={(record) => {
                                // Grouping logic: check if there are others in the same order
                                if (!record.order_code) return '';
                                const isGrouped = participants.filter(p => p.order_code === record.order_code).length > 1;
                                return isGrouped ? 'order-group-row' : '';
                            }}
                            pagination={{
                                current: pagination.page,
                                pageSize: pagination.limit,
                                total: pagination.total,
                                showTotal: (total) => `Tổng số ${total} hành khách`,
                                onChange: (page) => setPagination({ ...pagination, page }),
                                className: "px-6 py-4"
                            }}
                        />
                    </Card>
                )}
            </div>

            {/* Custom Styles for Table and Ant Components */}
            <style jsx global>{`
                .custom-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    color: #475569;
                    font-weight: 600;
                    font-size: 13px;
                    padding: 16px;
                }
                .custom-table .ant-table-tbody > tr > td {
                    padding: 16px;
                }
                .custom-table .ant-table-tbody > tr:hover > td {
                    background: #f1f5f9 !important;
                }
                .order-group-row {
                    position: relative;
                }
                .order-group-row td:first-child::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 4px;
                    bottom: 4px;
                    width: 4px;
                    background: #3b82f6;
                    border-radius: 0 4px 4px 0;
                }
                .order-group-row:hover td {
                    background: #eff6ff !important;
                }
                .custom-select .ant-select-selector {
                    border-radius: 8px !important;
                    border-color: #e2e8f0 !important;
                }
            `}</style>

            {/* Detail Drawer - Restyled to be Cleaner */}
            <Drawer
                title={
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                            <EyeOutlined />
                        </div>
                        <span>Chi tiết hành khách</span>
                    </div>
                }
                placement="right"
                onClose={() => setDetailDrawerOpen(false)}
                open={detailDrawerOpen}
                width={500}
                className="clean-drawer"
            >
                {selectedParticipant && (
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    Thông tin cá nhân
                                </h3>
                                <Tag color={selectedParticipant.participant_type === 'ADULT' ? 'blue' : selectedParticipant.participant_type === 'CHILD' ? 'warning' : 'success'} className="px-3 rounded-md">
                                    {selectedParticipant.participant_type === 'ADULT' ? 'Người lớn' : selectedParticipant.participant_type === 'CHILD' ? 'Trẻ em' : 'Em bé'}
                                </Tag>
                            </div>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Họ và tên</p>
                                    <p className="text-sm font-bold text-slate-700">{selectedParticipant.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Giới tính</p>
                                    <p className="text-sm font-semibold text-slate-700">{selectedParticipant.gender === 'MALE' ? 'Nam' : 'Nữ'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Ngày sinh</p>
                                    <p className="text-sm font-semibold text-slate-700">{dayjs(selectedParticipant.date_of_birth).format('DD/MM/YYYY')}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Số định danh</p>
                                    <p className="text-sm font-semibold text-slate-700">{selectedParticipant.id_number || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Liên hệ & Tour</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <PhoneOutlined />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] uppercase font-bold text-slate-400 mb-0.5">Số điện thoại</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-700">{selectedParticipant.phone || 'Chưa cập nhật'}</p>
                                            {selectedParticipant.phone && (
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    icon={<MessageOutlined />}
                                                    className="text-emerald-600 p-0 h-auto"
                                                    onClick={() => {
                                                        const cleanPhone = selectedParticipant.phone.replace(/\D/g, '');
                                                        window.open(`https://zalo.me/${cleanPhone}`, '_blank');
                                                    }}
                                                >
                                                    Chat Zalo
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                        <MailOutlined />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] uppercase font-bold text-slate-400 mb-0.5">Địa chỉ Email</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-700 truncate">{selectedParticipant.email || 'Chưa cập nhật'}</p>
                                            {selectedParticipant.email && (
                                                <Button
                                                    size="small"
                                                    type="link"
                                                    icon={<MailOutlined />}
                                                    className="text-rose-600 p-0 h-auto"
                                                    onClick={() => window.location.href = `mailto:${selectedParticipant.email}?subject=Liên hệ về tour ${selectedParticipant.tour_name}`}
                                                >
                                                    Gửi Email
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                                        <FileTextOutlined />
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase font-bold text-slate-400 mb-0.5">Lịch trình tham gia</p>
                                        <p className="text-sm font-bold text-slate-700">{selectedParticipant.tour_name}</p>
                                        <p className="text-xs text-slate-500 mt-1">Từ {dayjs(selectedParticipant.start_date).format('DD/MM/YYYY')} đến {dayjs(selectedParticipant.end_date).format('DD/MM/YYYY')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedParticipant.special_notes && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <p className="text-[11px] uppercase font-bold text-amber-600 mb-2 flex items-center gap-2">
                                    Ghi chú đặc biệt
                                </p>
                                <p className="text-sm text-amber-800 leading-relaxed italic">
                                    "{selectedParticipant.special_notes}"
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default TourCustomersPage;
