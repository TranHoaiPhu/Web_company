"use client";

import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Image, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, SelectOutlined } from '@ant-design/icons';
import { Banner } from '@/services/banner.service';
import dayjs from 'dayjs';
import { Can } from '@/components/common/AccessControl';

import Link from 'next/link';

interface BannerTableProps {
    banners: Banner[];
    loading: boolean;
    onDelete: (id: number) => void;
}

const BannerTable: React.FC<BannerTableProps> = ({ banners, loading, onDelete }) => {
    const columns = [
        {
            title: 'Thứ tự',
            dataIndex: 'display_order',
            key: 'display_order',
            width: 100,
            align: 'center' as const,
            sorter: (a: Banner, b: Banner) => a.display_order - b.display_order,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 150,
            render: (url: string, record: Banner) => (
                <Image
                    src={url}
                    alt={record.alt_text || record.title}
                    width={120}
                    className="rounded-lg object-cover shadow-sm"
                    fallback="https://via.placeholder.com/120x60?text=No+Image"
                />
            ),
        },
        {
            title: 'Thông tin Banner',
            key: 'info',
            render: (_: any, record: Banner) => (
                <div>
                    <div className="font-bold text-slate-800">{record.title}</div>
                    {record.subtitle && <div className="text-xs text-slate-500">{record.subtitle}</div>}
                    <div className="flex gap-2 mt-1 flex-wrap">
                        {record.tag && <Tag color="blue">{record.tag}</Tag>}
                        {record.location && <Tag color="orange">{record.location}</Tag>}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 120,
            render: (isActive: boolean, record: Banner) => (
                <Space direction="vertical" size={0}>
                    <Tag color={isActive ? 'green' : 'red'}>
                        {isActive ? 'Đang bật' : 'Đang tắt'}
                    </Tag>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase">
                        {record.status}
                    </div>
                </Space>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            fixed: 'right' as const,
            render: (_: any, record: Banner) => (
                <Space size="middle">
                    <Can permission="banners_manage">
                        <Tooltip title="Chỉnh sửa">
                            <Link href={`/settings/banners/${record.id}`}>
                                <Button
                                    type="text"
                                    icon={<EditOutlined className="text-blue-600" />}
                                />
                            </Link>
                        </Tooltip>
                    </Can>
                    <Can permission="banners_manage">
                        <Popconfirm
                            title="Xóa Banner"
                            description="Bạn có chắc chắn muốn xóa quảng cáo này không?"
                            onConfirm={() => record.id && onDelete(record.id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                        >
                            <Tooltip title="Xóa">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Can>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={banners}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            className="border border-slate-100 rounded-xl overflow-hidden shadow-sm bg-white"
        />
    );
};

export default BannerTable;
