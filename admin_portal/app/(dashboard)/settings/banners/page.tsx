"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Input, Space, message, Card, Breadcrumb } from 'antd';
import BannerTable from '@/components/banners/BannerTable';
import BannerForm from '@/components/banners/BannerForm';
import bannerService, { Banner } from '@/services/banner.service';
import { Can } from '@/components/common/AccessControl';

import Link from 'next/link';

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await bannerService.getAll({ search: searchText });
            if (response.success) {
                setBanners(response.data);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            message.error('Không thể tải danh sách quảng cáo');
        } finally {
            setLoading(false);
        }
    }, [searchText]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const handleDelete = async (id: number) => {
        try {
            const response = await bannerService.delete(id);
            if (response.success) {
                message.success('Xóa quảng cáo thành công!');
                fetchBanners();
            }
        } catch (error) {
            message.error('Lỗi khi xóa quảng cáo');
        }
    };

    return (
        <Can
            permission="banners_view"
            fallback={
                <div className="p-6">
                    <Card className="rounded-2xl text-center py-12">
                        <h2 className="text-xl font-bold text-slate-800">Cần quyền truy cập</h2>
                        <p className="text-slate-500 mt-2">Bạn không có quyền xem trang quản lý Banner này.</p>
                    </Card>
                </div>
            }
        >
            <div className="p-6 bg-slate-50 min-h-screen">
                {/* Breadcrumb & Header */}
                <div className="mb-6">
                    <Breadcrumb className="mb-4">
                        <Breadcrumb.Item>Cấu hình</Breadcrumb.Item>
                        <Breadcrumb.Item>Quản lý Banner</Breadcrumb.Item>
                    </Breadcrumb>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Banner & Quảng cáo</h1>
                            <p className="text-slate-500 text-sm">Quản lý các slide hình ảnh và nội dung khuyến mãi trên website</p>
                        </div>

                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchBanners}
                                loading={loading}
                            >
                                Làm mới
                            </Button>
                            <Can permission="banners_manage">
                                <Link href="/settings/banners/new">
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        className="bg-blue-600 border-none hover:bg-blue-700 h-10 px-6 rounded-lg font-medium"
                                    >
                                        Tạo Banner mới
                                    </Button>
                                </Link>
                            </Can>
                        </Space>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                    <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="w-full md:w-96">
                            <Input
                                placeholder="Tìm kiếm theo tiêu đề, địa điểm..."
                                prefix={<SearchOutlined className="text-slate-400" />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onPressEnter={fetchBanners}
                                className="rounded-xl h-10 border-slate-200"
                            />
                        </div>
                        <div className="text-slate-500 text-sm italic">
                            Hiển thị <span className="font-bold text-slate-900">{banners.length}</span> quảng cáo
                        </div>
                    </div>

                    <BannerTable
                        banners={banners}
                        loading={loading}
                        onDelete={handleDelete}
                    />
                </Card>
            </div>
        </Can>
    );
}

