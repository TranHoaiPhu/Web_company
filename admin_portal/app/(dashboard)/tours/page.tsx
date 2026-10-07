"use client"

import { useState, useEffect } from 'react';
import { Button, Space, Card, Row, Col, Input, Select, Modal, message, Pagination } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { tourService, Tour, TourFilters } from '@/services/tour.service';
import TourTable from '@/components/tours/TourTable';
import Link from 'next/link';
import { Can } from '@/components/common/AccessControl';

export default function ToursPage() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<TourFilters>({
        page: 1,
        limit: 10,
        search: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const fetchTours = async () => {
        setLoading(true);
        try {
            const response = await tourService.getTours(filters);
            console.log('Fetched tours:', response);
            setTours(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to fetch tours:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, [filters.page, filters.search, filters.status]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this tour?')) {
            try {
                await tourService.deleteTour(id);
                fetchTours(); // Refresh list
            } catch (error) {
                console.error('Failed to delete tour:', error);
                alert('Failed to delete tour');
            }
        }
    };

    return (
        <div className="p-4">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý Tour</h1>
                        <p className="text-gray-600 mt-1">Quản lý tour, giá, lịch trình và trạng thái</p>
                    </div>
                    <Can permission="tours_create">
                        <Link href="/tours/create">
                            <Button type="primary" icon={<PlusOutlined />} size="large">
                                Thêm tour mới
                            </Button>
                        </Link>
                    </Can>
                </div>

                {/* Filters */}

                <div className='mb-4'>
                    <Card>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={16} md={18}>
                                <Input
                                    placeholder="Tìm kiếm tour theo tên..."
                                    value={filters.search}
                                    onChange={handleSearch}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} sm={8} md={6}>
                                <Select
                                    placeholder="Chọn trạng thái"
                                    allowClear
                                    value={filters.status || undefined}
                                    onChange={(value) => setFilters(prev => ({ ...prev, status: value || '', page: 1 }))}
                                    style={{ width: '100%' }}
                                    options={[
                                        { value: 'ACTIVE', label: 'Đang hiển thị' },
                                        { value: 'INACTIVE', label: 'Đã tắt' },
                                        { value: 'DRAFT', label: 'Bản nháp' },
                                    ]}
                                />
                            </Col>
                        </Row>
                    </Card>
                </div>




                {/* Table */}
                <TourTable
                    tours={tours}
                    loading={loading}
                    onDelete={handleDelete}
                    currentPage={pagination.page}
                    pageSize={pagination.limit}
                />

                {/* Pagination */}
                <div className="flex justify-center pb-8">
                    <Card className="shadow-sm border-slate-100">
                        <div className="px-2">
                            <Pagination
                                current={pagination.page}
                                total={pagination.total}
                                pageSize={pagination.limit}
                                showSizeChanger
                                showQuickJumper
                                showTotal={(total: number) => `Tổng cộng ${total} tour`}
                                onChange={(page: number, pageSize: number) => {
                                    setFilters(prev => ({
                                        ...prev,
                                        page,
                                        limit: pageSize || prev.limit
                                    }));
                                }}
                                className="custom-pagination"
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
