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
    Switch,
    Card,
    Typography,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { amenityService, Amenity, CreateAmenityPayload, UpdateAmenityPayload } from '@/services/amenity.service';

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// Danh sách category phổ biến
const CATEGORIES = [
    { value: 'accommodation', label: 'Chỗ ở', color: 'blue' },
    { value: 'transport', label: 'Phương tiện', color: 'green' },
    { value: 'food', label: 'Ẩm thực', color: 'orange' },
    { value: 'activity', label: 'Hoạt động', color: 'purple' },
    { value: 'service', label: 'Dịch vụ', color: 'cyan' },
    { value: 'safety', label: 'An toàn', color: 'red' },
    { value: 'comfort', label: 'Tiện nghi', color: 'gold' },
    { value: 'other', label: 'Khác', color: 'default' },
];

// Danh sách icon phổ biến
const ICONS = [
    { value: 'wifi', label: '📶 Wifi' },
    { value: 'parking', label: '🅿️ Bãi đỗ xe' },
    { value: 'pool', label: '🏊 Hồ bơi' },
    { value: 'gym', label: '🏋️ Phòng gym' },
    { value: 'restaurant', label: '🍽️ Nhà hàng' },
    { value: 'spa', label: '💆 Spa' },
    { value: 'ac', label: '❄️ Điều hòa' },
    { value: 'tv', label: '📺 TV' },
    { value: 'breakfast', label: '🥐 Bữa sáng' },
    { value: 'shuttle', label: '🚐 Xe đưa đón' },
    { value: 'guide', label: '👨‍🏫 Hướng dẫn viên' },
    { value: 'insurance', label: '🛡️ Bảo hiểm' },
    { value: 'camera', label: '📷 Chụp ảnh' },
    { value: 'ticket', label: '🎫 Vé tham quan' },
    { value: 'boat', label: '🚤 Tàu thuyền' },
    { value: 'bike', label: '🚲 Xe đạp' },
    { value: 'car', label: '🚗 Xe ô tô' },
    { value: 'plane', label: '✈️ Máy bay' },
    { value: 'train', label: '🚆 Tàu hỏa' },
    { value: 'hotel', label: '🏨 Khách sạn' },
];

const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

export default function AmenitiesPage() {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [form] = Form.useForm();

    // Fetch amenities
    const fetchAmenities = useCallback(async () => {
        setLoading(true);
        try {
            const data = await amenityService.getAll({ category: filterCategory });
            setAmenities(data);
        } catch (error) {
            message.error('Không thể tải danh sách tiện ích');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filterCategory]);

    useEffect(() => {
        fetchAmenities();
    }, [fetchAmenities]);

    // Filter data by search text
    const filteredAmenities = amenities.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.slug.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
    );

    // Open modal for create/edit
    const openModal = (amenity?: Amenity) => {
        if (amenity) {
            setEditingAmenity(amenity);
            form.setFieldsValue({
                name: amenity.name,
                slug: amenity.slug,
                description: amenity.description,
                icon: amenity.icon,
                category: amenity.category,
                isActive: amenity.isActive,
            });
        } else {
            setEditingAmenity(null);
            form.resetFields();
            form.setFieldsValue({ isActive: true });
        }
        setModalVisible(true);
    };

    // Close modal
    const closeModal = () => {
        setModalVisible(false);
        setEditingAmenity(null);
        form.resetFields();
    };

    // Handle form submit
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingAmenity) {
                // Update
                const payload: UpdateAmenityPayload = {
                    name: values.name,
                    slug: values.slug,
                    description: values.description,
                    icon: values.icon,
                    category: values.category,
                    isActive: values.isActive,
                };
                await amenityService.update(editingAmenity.id, payload);
                message.success('Cập nhật tiện ích thành công');
            } else {
                // Create
                const payload: CreateAmenityPayload = {
                    name: values.name,
                    slug: values.slug,
                    description: values.description,
                    icon: values.icon,
                    category: values.category,
                };
                await amenityService.create(payload);
                message.success('Thêm tiện ích mới thành công');
            }

            closeModal();
            fetchAmenities();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                message.error(axiosError.response?.data?.message || 'Có lỗi xảy ra');
            } else {
                message.error('Vui lòng kiểm tra lại thông tin');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle delete with usage check
    const handleDelete = async (amenity: Amenity) => {
        // Hàm hiển thị confirm xóa
        const showDeleteConfirm = () => {
            confirm({
                title: 'Xác nhận xóa tiện ích',
                icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                content: (
                    <p>
                        Bạn có chắc chắn muốn xóa tiện ích <strong>&quot;{amenity.name}&quot;</strong>?
                        <br />
                        <span style={{ color: '#666' }}>Hành động này không thể hoàn tác.</span>
                    </p>
                ),
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: async () => {
                    try {
                        setLoading(true);
                        await amenityService.delete(amenity.id);
                        message.success('Xóa tiện ích thành công');
                        fetchAmenities();
                    } catch (error: unknown) {
                        if (error && typeof error === 'object' && 'response' in error) {
                            const axiosError = error as { response?: { data?: { message?: string } } };
                            message.error(axiosError.response?.data?.message || 'Không thể xóa tiện ích này');
                        } else {
                            message.error('Không thể xóa tiện ích này');
                        }
                    } finally {
                        setLoading(false);
                    }
                },
            });
        };

        try {
            // Kiểm tra số tour đang sử dụng amenity này
            const usage = await amenityService.checkUsage(amenity.id);
            
            if (usage && usage.count > 0) {
                // Hiển thị modal cảnh báo nếu có tour đang sử dụng
                confirm({
                    title: 'Không thể xóa tiện ích này!',
                    icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                    content: (
                        <div>
                            <p style={{ marginBottom: 8 }}>
                                Tiện ích <strong>&quot;{amenity.name}&quot;</strong> đang được sử dụng bởi <strong>{usage.count} tour</strong>.
                            </p>
                            {usage.tours && usage.tours.length > 0 && (
                                <div>
                                    <p style={{ marginBottom: 4 }}>Danh sách tour:</p>
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        {usage.tours.map((tour) => (
                                            <li key={tour.id}>{tour.name}</li>
                                        ))}
                                        {usage.count > usage.tours.length && (
                                            <li>...và {usage.count - usage.tours.length} tour khác</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                            <p style={{ marginTop: 12, color: '#666' }}>
                                Vui lòng gỡ tiện ích này khỏi tất cả tour trước khi xóa.
                            </p>
                        </div>
                    ),
                    okText: 'Đã hiểu',
                    okButtonProps: { danger: false },
                    cancelButtonProps: { style: { display: 'none' } },
                });
                return;
            }
            
            // Nếu không có tour nào sử dụng, hiển thị confirm xóa
            showDeleteConfirm();
        } catch (error) {
            // Nếu API checkUsage fail, vẫn hiện confirm xóa bình thường
            console.error('Error checking usage, fallback to direct delete:', error);
            showDeleteConfirm();
        }
    };

    // Auto generate slug when name changes
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        if (!editingAmenity) {
            form.setFieldsValue({ slug: generateSlug(name) });
        }
    };

    // Get category info
    const getCategoryInfo = (category?: string) => {
        return CATEGORIES.find((c) => c.value === category) || { label: category || 'Không xác định', color: 'default' };
    };

    // Get icon display
    const getIconDisplay = (icon?: string) => {
        const iconInfo = ICONS.find((i) => i.value === icon);
        return iconInfo ? iconInfo.label : icon || '-';
    };

    // Table columns
    const columns: ColumnsType<Amenity> = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: 'Icon',
            dataIndex: 'icon',
            key: 'icon',
            width: 100,
            align: 'center',
            render: (icon) => (
                <span style={{ fontSize: '12px' }}>{getIconDisplay(icon)}</span>
            ),
        },
        {
            title: 'Tên tiện ích',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug) => <code style={{ fontSize: '12px' }}>{slug}</code>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (desc) => desc || <span style={{ color: '#999' }}>-</span>,
        },
        {
            title: 'Danh mục',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            filters: CATEGORIES.map((c) => ({ text: c.label, value: c.value })),
            onFilter: (value, record) => record.category === value,
            render: (category) => {
                const info = getCategoryInfo(category);
                return <Tag color={info.color}>{info.label}</Tag>;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 100,
            align: 'center',
            filters: [
                { text: 'Hoạt động', value: true },
                { text: 'Ẩn', value: false },
            ],
            onFilter: (value, record) => record.isActive === value,
            render: (isActive) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'Hoạt động' : 'Ẩn'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => openModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <Title level={4} style={{ margin: 0 }}>Quản lý tiện ích</Title>
                    <Space wrap>
                        <Input
                            placeholder="Tìm kiếm tiện ích..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <Select
                            placeholder="Lọc theo danh mục"
                            value={filterCategory}
                            onChange={setFilterCategory}
                            allowClear
                            style={{ width: 180 }}
                        >
                            {CATEGORIES.map((c) => (
                                <Option key={c.value} value={c.value}>
                                    {c.label}
                                </Option>
                            ))}
                        </Select>
                        <Tooltip title="Làm mới">
                            <Button icon={<ReloadOutlined />} onClick={fetchAmenities} />
                        </Tooltip>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                            Thêm tiện ích
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredAmenities}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} tiện ích`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                    }}
                    bordered
                    size="middle"
                />
            </Card>

            {/* Modal Create/Edit */}
            <Modal
                title={editingAmenity ? 'Chỉnh sửa tiện ích' : 'Thêm tiện ích mới'}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={closeModal}
                okText={editingAmenity ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                confirmLoading={loading}
                width={600}
            >
                <Form form={form} layout="vertical" style={{ marginTop: '16px' }}>
                    <Form.Item
                        name="name"
                        label="Tên tiện ích"
                        rules={[{ required: true, message: 'Vui lòng nhập tên tiện ích' }]}
                    >
                        <Input placeholder="Ví dụ: Wifi miễn phí" onChange={handleNameChange} />
                    </Form.Item>

                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[{ required: true, message: 'Vui lòng nhập slug' }]}
                    >
                        <Input placeholder="Ví dụ: wifi-mien-phi" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả chi tiết về tiện ích..." />
                    </Form.Item>

                    <Form.Item name="icon" label="Icon">
                        <Select placeholder="Chọn icon" allowClear showSearch>
                            {ICONS.map((icon) => (
                                <Option key={icon.value} value={icon.value}>
                                    {icon.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="category" label="Danh mục">
                        <Select placeholder="Chọn danh mục" allowClear>
                            {CATEGORIES.map((c) => (
                                <Option key={c.value} value={c.value}>
                                    {c.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {editingAmenity && (
                        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                            <Switch checkedChildren="Hoạt động" unCheckedChildren="Ẩn" />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
}
