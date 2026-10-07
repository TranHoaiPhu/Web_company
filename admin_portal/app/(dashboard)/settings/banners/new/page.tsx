"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { message, Card, Breadcrumb } from 'antd';
import BannerForm from '@/components/banners/BannerForm';
import bannerService, { Banner } from '@/services/banner.service';
import { LeftOutlined } from '@ant-design/icons';
import Button from 'antd/es/button';

export default function NewBannerPage() {
    const router = useRouter();

    const handleCreate = async (data: Banner) => {
        try {
            const response = await bannerService.create(data);
            if (response.success) {
                message.success('Tạo quảng cáo thành công!');
                router.push('/settings/banners');
            }
        } catch (error) {
            console.error('Error creating banner:', error);
            message.error('Lỗi khi tạo quảng cáo');
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb & Navigation */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Breadcrumb className="mb-3">
                            <Breadcrumb.Item href="/settings/banners">Quản lý Banner</Breadcrumb.Item>
                            <Breadcrumb.Item>Tạo Banner mới</Breadcrumb.Item>
                        </Breadcrumb>
                        <h1 className="text-3xl font-bold text-slate-900">Tạo Banner mới</h1>
                    </div>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={() => router.back()}
                        className="rounded-xl h-11 px-6 border-slate-200 hover:text-blue-600 hover:border-blue-400 group transition-all"
                    >
                        Quay lại <span className="hidden md:inline ml-1 text-slate-400 group-hover:text-blue-400">danh sách</span>
                    </Button>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <BannerForm
                        banner={null}
                        isPage={true}
                        onClose={() => router.push('/settings/banners')}
                        onSubmit={handleCreate}
                        title="Thông tin chi tiết Banner"
                        description="Vui lòng điền đầy đủ các thông tin hiển thị và tải lên hình ảnh quảng cáo tương ứng."
                    />
                </div>
            </div>
        </div>
    );
}
