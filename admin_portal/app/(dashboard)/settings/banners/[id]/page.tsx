"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { message, Card, Breadcrumb, Spin } from 'antd';
import BannerForm from '@/components/banners/BannerForm';
import bannerService, { Banner } from '@/services/banner.service';
import { LeftOutlined, LoadingOutlined } from '@ant-design/icons';
import Button from 'antd/es/button';

export default function EditBannerPage() {
    const router = useRouter();
    const { id } = useParams();
    const [banner, setBanner] = useState<Banner | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanner = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Assuming bannerService has a getById method
                const response = await bannerService.getAll(); // Temporarily fetch all and find
                if (response.success) {
                    const found = response.data.find((b: Banner) => b.id === Number(id));
                    if (found) {
                        setBanner(found);
                    } else {
                        message.error('Không tìm thấy banner');
                        router.push('/settings/banners');
                    }
                }
            } catch (error) {
                console.error('Error fetching banner:', error);
                message.error('Lỗi khi tải thông tin quảng cáo');
            } finally {
                setLoading(false);
            }
        };

        fetchBanner();
    }, [id, router]);

    const handleUpdate = async (data: Banner) => {
        if (!id) return;
        try {
            const response = await bannerService.update(Number(id), data);
            if (response.success) {
                message.success('Cập nhật quảng cáo thành công!');
                router.push('/settings/banners');
            }
        } catch (error) {
            console.error('Error updating banner:', error);
            message.error('Lỗi khi cập nhật quảng cáo');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
                <p className="text-slate-500 font-medium">Đang tải thông tin banner...</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Breadcrumb & Navigation */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Breadcrumb className="mb-3">
                            <Breadcrumb.Item href="/settings/banners">Quản lý Banner</Breadcrumb.Item>
                            <Breadcrumb.Item>Chỉnh sửa Banner</Breadcrumb.Item>
                        </Breadcrumb>
                        <h1 className="text-3xl font-bold text-slate-900">Chi tiết Banner #{id}</h1>
                    </div>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={() => router.push('/settings/banners')}
                        className="rounded-xl h-11 px-6 border-slate-200 hover:text-blue-600 hover:border-blue-400 group transition-all"
                    >
                        Quay lại danh sách
                    </Button>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                    <BannerForm
                        banner={banner}
                        isPage={true}
                        onClose={() => router.push('/settings/banners')}
                        onSubmit={handleUpdate}
                        title="Cập nhật thông tin Banner"
                        description="Thay đổi các thông tin hiển thị hoặc hình ảnh của quảng cáo này."
                    />
                </div>
            </div>
        </div>
    );
}
