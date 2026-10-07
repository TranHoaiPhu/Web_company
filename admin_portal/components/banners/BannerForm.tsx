"use client";

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, Select, DatePicker, Upload, message, Divider, Row, Col, Button, ColorPicker } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Banner } from '@/services/banner.service';
import { uploadService } from '@/services/upload.service';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface BannerFormProps {
    banner: Banner | null;
    onClose: () => void;
    onSubmit: (data: Banner) => void;
    isPage?: boolean;
    title?: string;
    description?: string;
}

const BannerForm: React.FC<BannerFormProps> = ({ banner, onClose, onSubmit, isPage = false, title, description }) => {
    const [form] = Form.useForm();
    const [uploadingDesktop, setUploadingDesktop] = useState(false);
    const [uploadingMobile, setUploadingMobile] = useState(false);
    const [imageUrl, setImageUrl] = useState(banner?.image_url || '');
    const [mobileImageUrl, setMobileImageUrl] = useState(banner?.mobile_image_url || '');
    const [submitting, setSubmitting] = useState(false);

    const handleUpload = async (file: File, type: 'desktop' | 'mobile') => {
        try {
            if (type === 'desktop') setUploadingDesktop(true);
            else setUploadingMobile(true);

            const url = await uploadService.uploadImage(file);

            if (type === 'desktop') {
                setImageUrl(url);
                form.setFieldsValue({ image_url: url });
            } else {
                setMobileImageUrl(url);
                form.setFieldsValue({ mobile_image_url: url });
            }

            message.success(`Tải ảnh ${type} thành công!`);
        } catch (error) {
            message.error(`Tải ảnh ${type} thất bại!`);
        } finally {
            if (type === 'desktop') setUploadingDesktop(false);
            else setUploadingMobile(false);
        }
    };

    const onFinish = async (values: any) => {
        try {
            setSubmitting(true);
            const { dateRange, background_color, text_color, ...rest } = values;

            const formattedData: Banner = {
                ...rest,
                background_color: typeof background_color === 'string' ? background_color : background_color?.toHexString?.() || background_color,
                text_color: typeof text_color === 'string' ? text_color : text_color?.toHexString?.() || text_color,
                image_url: imageUrl,
                mobile_image_url: mobileImageUrl,
                start_date: dateRange ? dateRange[0].format('YYYY-MM-DD') : null,
                end_date: dateRange ? dateRange[1].format('YYYY-MM-DD') : null,
            };

            await onSubmit(formattedData);
        } finally {
            setSubmitting(false);
        }
    };

    const formContent = (
        <Form
            form={form}
            layout="vertical"
            initialValues={banner ? {
                ...banner,
                dateRange: banner.start_date && banner.end_date
                    ? [dayjs(banner.start_date), dayjs(banner.end_date)]
                    : null
            } : {
                display_order: 0,
                status: 'ACTIVE',
                is_active: true,
                background_color: '#ffffff',
                text_color: '#000000'
            }}
            onFinish={onFinish}
            className={isPage ? "" : "mt-4"}
        >
            <Row gutter={24}>
                <Col span={isPage ? 16 : 15}>
                    <Form.Item
                        name="title"
                        label="Tiêu đề chính"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Ví dụ: Khám phá Vịnh Hạ Long" size="large" />
                    </Form.Item>

                    <Form.Item name="subtitle" label="Tiêu đề phụ">
                        <Input placeholder="Ví dụ: Tour du thuyền 5 sao đẳng cấp" size="large" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả ngắn">
                        <TextArea rows={4} placeholder="Mô tả chi tiết về chương trình khuyến mãi..." />
                    </Form.Item>

                    <Form.Item name="alt_text" label="Mô tả ảnh (Alt text - SEO)">
                        <Input placeholder="Ví dụ: Quảng cáo tour hạ long mùa hè" />
                    </Form.Item>
                </Col>

                <Col span={isPage ? 8 : 9}>
                    <Form.Item label="Hình ảnh Desktop" required>
                        <div className="flex flex-col gap-3">
                            {imageUrl && (
                                <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] shadow-sm bg-slate-50">
                                    <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <Upload
                                beforeUpload={(file: any) => {
                                    handleUpload(file, 'desktop');
                                    return false;
                                }}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />} loading={uploadingDesktop} block size="large">
                                    {imageUrl ? 'Thay đổi ảnh Desktop' : 'Tải lên Desktop'}
                                </Button>
                            </Upload>
                            <Form.Item name="image_url" hidden rules={[{ required: true, message: 'Vui lòng tải ảnh lên' }]}>
                                <Input />
                            </Form.Item>
                        </div>
                    </Form.Item>

                    <Form.Item label="Hình ảnh Mobile (Tùy chọn)">
                        <div className="flex flex-col gap-3">
                            {mobileImageUrl && (
                                <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[1/1] w-32 mx-auto shadow-sm bg-slate-50">
                                    <img src={mobileImageUrl} alt="Mobile Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <Upload
                                beforeUpload={(file: any) => {
                                    handleUpload(file, 'mobile');
                                    return false;
                                }}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />} loading={uploadingMobile} block>
                                    {mobileImageUrl ? 'Thay đổi ảnh Mobile' : 'Tải lên Mobile'}
                                </Button>
                            </Upload>
                            <Form.Item name="mobile_image_url" hidden>
                                <Input />
                            </Form.Item>
                        </div>
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left">Cấu trúc & Điều hướng</Divider>

            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="tag" label="Nhãn (Tag)">
                        <Input placeholder="Ví dụ: HOT, NEW, 20% OFF" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="location" label="Địa điểm">
                        <Input placeholder="Ví dụ: Quảng Ninh, Việt Nam" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="tour_id" label="Liên kết Tour (ID)">
                        <InputNumber placeholder="ID tour" className="w-full" />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item name="link_url" label="Link điều hướng (URL)">
                        <Input placeholder="https://..." />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="link_text" label="Nội dung nút (Button text)">
                        <Input placeholder="Ví dụ: Xem ngay, Đặt chỗ..." />
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left">Cài đặt hiển thị</Divider>

            <Row gutter={24} align="top">
                <Col span={8}>
                    <Form.Item name="dateRange" label="Thời gian hiển thị">
                        <RangePicker className="w-full" size="large" />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item name="display_order" label="Thứ tự ưu tiên">
                        <InputNumber min={0} className="w-full" size="large" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="status" label="Trạng thái">
                        <Select size="large">
                            <Option value="ACTIVE">Hoạt động</Option>
                            <Option value="INACTIVE">Ngừng hoạt động</Option>
                            <Option value="SCHEDULED">Đã lên lịch</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item name="background_color" label="Màu nền">
                        <ColorPicker showText trigger="hover" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="text_color" label="Màu chữ">
                        <ColorPicker showText trigger="hover" />
                    </Form.Item>
                </Col>
            </Row>

            {isPage && (
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                    <Button size="large" onClick={onClose}>Hủy bỏ</Button>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => form.submit()}
                        loading={submitting}
                        className="bg-blue-600 px-8"
                    >
                        {banner ? 'Cập nhật Banner' : 'Tạo Banner mới'}
                    </Button>
                </div>
            )}
        </Form>
    );

    if (isPage) {
        return (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-1">
                        {title || (banner ? 'Chỉnh sửa Banner' : 'Tạo Banner mới')}
                    </h2>
                    {description && <p className="text-slate-500 text-sm">{description}</p>}
                </div>
                <div className="p-8">
                    {formContent}
                </div>
            </div>
        );
    }

    return (
        <Modal
            title={banner ? 'Chỉnh sửa Banner' : 'Tạo Banner mới'}
            open={true}
            onCancel={onClose}
            onOk={() => form.submit()}
            width={850}
            okText={banner ? 'Cập nhật' : 'Tạo mới'}
            cancelText="Hủy"
            centered
            confirmLoading={submitting}
        >
            {formContent}
        </Modal>
    );
};

export default BannerForm;
