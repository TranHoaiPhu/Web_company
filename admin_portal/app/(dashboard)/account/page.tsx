'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Avatar,
    message,
    Tabs,
    Row,
    Col,
    Statistic,
    Typography,
    Space,
    Divider,
    Badge,
    Modal,
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    LockOutlined,
    EditOutlined,
    CameraOutlined,
    SafetyOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { userService, User } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';

const { Title, Text, Paragraph } = Typography;

export default function AccountPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // Load user data on mount
    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Lấy user hiện tại từ Token decode
            const currentUser = AuthService.getCurrentUser();

            // BE_BookingTour sử dụng 'id' (numeric) hoặc 'user_id' (UUID)
            if (currentUser?.id) {
                const userData = await userService.getById(currentUser.id);
                setUser(userData);
                form.setFieldsValue({
                    full_name: userData.full_name,
                    email: userData.email,
                    phone: userData.phone,
                    address: userData.address,
                    avatar_url: userData.avatar_url,
                });
            }
        } catch (error) {
            message.error('Không thể tải thông tin tài khoản');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const handleUpdateProfile = async (values: any) => {
        if (!user) return;

        setLoading(true);
        try {
            await userService.update(user.id, {
                full_name: values.full_name,
                phone: values.phone,
                address: values.address,
                avatar_url: values.avatar_url,
            });
            message.success('Cập nhật thông tin thành công');
            fetchUserData();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            if (!user) return;

            const values = await passwordForm.validateFields();
            setLoading(true);

            await userService.changePassword(user.id, {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });

            message.success('Đổi mật khẩu thành công');
            setPasswordModalVisible(false);
            passwordForm.resetFields();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <Card loading />
            </div>
        );
    }

    const tabItems = [
        {
            key: 'profile',
            label: (
                <span>
                    <UserOutlined />
                    Thông tin cá nhân
                </span>
            ),
            children: (
                <Card bordered={false}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        style={{ maxWidth: '800px' }}
                    >
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="full_name"
                                    label="Họ và tên"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                >
                                    <Input
                                        prefix={<UserOutlined />}
                                        placeholder="Họ tên của bạn"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="email" label="Email">
                                    <Input
                                        prefix={<MailOutlined />}
                                        disabled
                                        size="large"
                                        style={{ cursor: 'not-allowed', background: '#f5f5f5' }}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item name="phone" label="Số điện thoại">
                                    <Input
                                        prefix={<PhoneOutlined />}
                                        placeholder="Số điện thoại"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="avatar_url" label="URL ảnh đại diện">
                                    <Input placeholder="https://example.com/avatar.jpg" size="large" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="address" label="Địa chỉ">
                            <Input.TextArea
                                placeholder="Nhập địa chỉ của bạn"
                                rows={3}
                                size="large"
                            />
                        </Form.Item>

                        <Divider />

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<EditOutlined />}
                                    loading={loading}
                                    size="large"
                                >
                                    Cập nhật thông tin
                                </Button>
                                <Button size="large" onClick={() => form.resetFields()}>
                                    Khôi phục
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'security',
            label: (
                <span>
                    <LockOutlined />
                    Bảo mật
                </span>
            ),
            children: (
                <Card bordered={false}>
                    <Title level={4}>Đổi mật khẩu</Title>
                    <Paragraph type="secondary">
                        Bạn nên sử dụng mật khẩu mạnh để bảo vệ tài khoản quản trị của mình.
                    </Paragraph>

                    <Button
                        type="primary"
                        icon={<LockOutlined />}
                        size="large"
                        onClick={() => setPasswordModalVisible(true)}
                        style={{ marginTop: '16px' }}
                    >
                        Thay đổi mật khẩu ngay
                    </Button>

                    <Divider />

                    <Title level={4}>Thông tin an toàn</Title>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                            <Space align="start">
                                <SafetyOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                                <div>
                                    <Text strong>Tài khoản Quản trị viên</Text>
                                    <br />
                                    <Text type="secondary">Bạn đang đăng nhập dưới quyền Admin của hệ thống</Text>
                                </div>
                            </Space>
                        </Card>

                        <Card size="small">
                            <Space align="start">
                                <HistoryOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                <div>
                                    <Text strong>Cập nhật lần cuối</Text>
                                    <br />
                                    <Text type="secondary">
                                        {new Date(user.updated_at).toLocaleString('vi-VN')}
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Space>
                </Card>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <Card
                className="account-header-card"
                style={{
                    marginBottom: '24px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    border: 'none',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
                }}
            >
                <Row align="middle" gutter={24}>
                    <Col>
                        <Badge
                            offset={[-10, 85]}
                            count={
                                <div style={{
                                    background: '#fff',
                                    padding: '4px',
                                    borderRadius: '50%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}>
                                    <CameraOutlined style={{ color: '#3b82f6', fontSize: '16px' }} />
                                </div>
                            }
                        >
                            <Avatar
                                size={110}
                                src={user.avatar_url}
                                icon={<UserOutlined />}
                                style={{
                                    border: '4px solid rgba(255,255,255,0.3)',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                }}
                            />
                        </Badge>
                    </Col>
                    <Col flex="auto">
                        <Title level={2} style={{ color: 'white', marginBottom: '4px' }}>
                            {user.full_name}
                        </Title>
                        <Space direction="vertical" size={2}>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px' }}>
                                <MailOutlined /> {user.email}
                            </Text>
                            <Space size="middle">
                                <Tag color="success" icon={<CheckCircleOutlined />}>Đang hoạt động</Tag>
                                <Tag color="volcano" icon={<SafetyOutlined />}>ADMIN</Tag>
                            </Space>
                        </Space>
                    </Col>
                    <Col>
                        <div style={{ textAlign: 'right', display: 'none' }} className="hidden-mobile">
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>ID: {user.user_id}</Text>
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* Stats Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: '12px' }} bordered={false}>
                        <Statistic
                            title="Thành viên từ"
                            value={new Date(user.created_at).toLocaleDateString('vi-VN')}
                            prefix={<HistoryOutlined style={{ color: '#3b82f6' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: '12px' }} bordered={false}>
                        <Statistic
                            title="Xác thực"
                            value="Đã bảo vệ"
                            prefix={<SafetyOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: '12px' }} bordered={false}>
                        <Statistic
                            title="Cấp bậc"
                            value="Quản trị tối cao"
                            prefix={<UserOutlined style={{ color: '#f59e0b' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Tabs Content */}
            <Card style={{ borderRadius: '16px', overflow: 'hidden' }} bordered={false}>
                <Tabs
                    items={tabItems}
                    size="large"
                    tabBarStyle={{ marginBottom: '24px', padding: '0 24px' }}
                />
            </Card>

            {/* Change Password Modal */}
            <Modal
                title={
                    <Space>
                        <LockOutlined style={{ color: '#3b82f6' }} />
                        <span>Thay đổi mật khẩu bảo mật</span>
                    </Space>
                }
                open={passwordModalVisible}
                onOk={handleChangePassword}
                onCancel={() => {
                    setPasswordModalVisible(false);
                    passwordForm.resetFields();
                }}
                okText="Xác nhận đổi mật khẩu"
                cancelText="Hủy bỏ"
                confirmLoading={loading}
                width={500}
                centered
            >
                <Form form={passwordForm} layout="vertical" style={{ marginTop: '16px' }}>
                    <Form.Item
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu cũ của bạn"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                            { min: 6, message: 'Mật khẩu phải dài ít nhất 6 ký tự' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận lại mật khẩu mới"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu mới một lần nữa"
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// Thêm các Icon còn thiếu
import { CheckCircleOutlined } from '@ant-design/icons';
