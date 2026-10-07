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
    Card,
    Typography,
    Tooltip,
    Avatar,
    Statistic,
    Row,
    Col,
    Badge,
    Checkbox,
    Divider,
    Spin,
    Empty
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    LockOutlined,
    UnlockOutlined,
    KeyOutlined,
    TeamOutlined,
    UserAddOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    ArrowLeftOutlined
} from '@ant-design/icons';
import { ShieldCheck, Crown, RefreshCw, Phone, MapPin, Image as ImageIcon, Mail, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Can } from '@/components/common/AccessControl';
import type { ColumnsType } from 'antd/es/table';
import {
    userService,
    User,
    CreateUserPayload,
    UpdateUserPayload,
    UsersOverviewStats,
} from '@/services/user.service';
import { RoleService, UserRoleService, Role } from '@/services/role.service';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

// Extended user type with RBAC roles
interface UserWithRBAC extends User {
    rbacRoles?: Role[];
}

export default function ManagementUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserWithRBAC[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState<UsersOverviewStats | null>(null);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [roleFilter, setRoleFilter] = useState<string | undefined>('MANAGEMENT');

    // Role assignment states
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [roleUser, setRoleUser] = useState<User | null>(null);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [userCurrentRoles, setUserCurrentRoles] = useState<Role[]>([]);
    const [roleLoading, setRoleLoading] = useState(false);
    const [savingRoles, setSavingRoles] = useState(false);

    // Store user roles mapping
    const [userRolesMap, setUserRolesMap] = useState<Record<string, Role[]>>({});

    // Fetch RBAC roles for a single user
    const fetchUserRBACRoles = async (userId: string): Promise<Role[]> => {
        try {
            const data = await UserRoleService.getUserRoles(userId);
            return data.roles || [];
        } catch (error) {
            console.error(`Error fetching roles for user ${userId}:`, error);
            return [];
        }
    };

    // Fetch RBAC roles for all users
    const fetchAllUserRoles = async (usersList: User[]) => {
        const rolesMap: Record<string, Role[]> = {};

        // Fetch roles for each user in parallel (limit to avoid too many requests)
        const promises = usersList.map(async (user) => {
            const userId = String(user.user_id || user.id);
            const roles = await fetchUserRBACRoles(userId);
            rolesMap[userId] = roles;
        });

        await Promise.allSettled(promises);
        setUserRolesMap(rolesMap);
    };

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await userService.getAll({
                page: currentPage,
                limit: pageSize,
                search: searchText || undefined,
                role: (roleFilter as any),
            });
            const usersList = response.data.users;
            setUsers(usersList);
            setTotalItems(response.data.pagination.totalItems);

            // Fetch RBAC roles for all users
            await fetchAllUserRoles(usersList);
        } catch (error) {
            message.error('Không thể tải danh sách người dùng');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchText, roleFilter]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        try {
            const data = await userService.getOverviewStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Set default values when API fails
            setStats({
                totalUsers: 0,
                totalCustomers: 0,
                totalAdmins: 0,
                activeUsers: 0,
                blockedUsers: 0,
                newUsers30Days: 0,
                newUsers7Days: 0
            });
        }
    }, []);

    // Fetch all roles
    const fetchAllRoles = useCallback(async () => {
        try {
            const response = await RoleService.getRoles();
            setAllRoles(response.data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchStats();
        fetchAllRoles();
    }, [fetchStats, fetchAllRoles]);

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            form.setFieldsValue({
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                role: user.role,
                status: user.status,
                address: user.address,
                avatar_url: user.avatar_url,
            });
        } else {
            setEditingUser(null);
            form.resetFields();
            form.setFieldsValue({ role: 'CUSTOMER', status: 'ACTIVE' });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingUser(null);
        form.resetFields();
    };

    const openPasswordModal = (user: User) => {
        setChangingPasswordUser(user);
        passwordForm.resetFields();
        setPasswordModalVisible(true);
    };

    const closePasswordModal = () => {
        setPasswordModalVisible(false);
        setChangingPasswordUser(null);
        passwordForm.resetFields();
    };

    // Open role assignment modal
    const openRoleModal = async (user: User) => {
        setRoleUser(user);
        setRoleLoading(true);
        setRoleModalVisible(true);

        try {
            const userId = String(user.user_id || user.id);
            const userRolesData = await UserRoleService.getUserRoles(userId);
            setUserCurrentRoles(userRolesData.roles);
            setSelectedRoleIds(userRolesData.roles.map(r => r.id));
        } catch (error) {
            console.error('Error fetching user roles:', error);
            setUserCurrentRoles([]);
            setSelectedRoleIds([]);
        } finally {
            setRoleLoading(false);
        }
    };

    const handleSaveRoles = async () => {
        if (!roleUser) return;

        setSavingRoles(true);
        try {
            const userId = String(roleUser.user_id || roleUser.id);
            const result = await UserRoleService.assignRolesToUser(userId, selectedRoleIds);

            // Update the local userRolesMap immediately
            setUserRolesMap(prev => ({
                ...prev,
                [userId]: result.roles || allRoles.filter(r => selectedRoleIds.includes(r.id))
            }));

            message.success(`Đã cập nhật vai trò cho ${roleUser.full_name}`);
            setRoleModalVisible(false);
        } catch (error: any) {
            console.error('Error saving roles:', error);
            message.error(error.response?.data?.detail || 'Không thể cập nhật vai trò');
        } finally {
            setSavingRoles(false);
        }
    };

    const toggleRole = (roleId: number) => {
        setSelectedRoleIds(prev =>
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Clean up values
            const payload = {
                ...values,
                phone: values.phone?.replace(/\s/g, ''),
                avatar_url: values.avatar_url?.trim() || undefined
            };

            if (editingUser) {
                await userService.update(editingUser.id, payload);
                message.success('Cập nhật người dùng thành công');
            } else {
                await userService.create(payload);
                message.success('Thêm người dùng mới thành công');
            }
            closeModal();
            fetchUsers();
            fetchStats();
        } catch (error) {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            if (!changingPasswordUser) return;
            const values = await passwordForm.validateFields();
            setLoading(true);
            await userService.changePassword(changingPasswordUser.id, {
                newPassword: values.newPassword,
            });
            message.success('Đổi mật khẩu thành công');
            closePasswordModal();
        } catch (error) {
            message.error('Không thể đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        const actionText = newStatus === 'BLOCKED' ? 'khóa' : 'mở khóa';
        confirm({
            title: `Xác nhận ${actionText} người dùng`,
            onOk: async () => {
                try {
                    await userService.updateStatus(user.id, newStatus);
                    message.success('Thành công');
                    fetchUsers();
                } catch (error) {
                    message.error('Lỗi');
                }
            }
        });
    };

    const handleDelete = async (user: User) => {
        confirm({
            title: 'Xóa người dùng?',
            onOk: async () => {
                try {
                    await userService.delete(user.id);
                    message.success('Đã xóa');
                    fetchUsers();
                } catch (error) {
                    message.error('Không thể xóa');
                }
            }
        });
    };

    // Get RBAC roles for a user
    const getUserRBACRoles = (user: User): Role[] => {
        const userId = String(user.user_id || user.id);
        return userRolesMap[userId] || [];
    };

    const columns: ColumnsType<UserWithRBAC> = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: 'Người dùng',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar src={record.avatar_url} icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 600 }}>{record.full_name}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Loại tài khoản',
            dataIndex: 'role',
            key: 'role',
            width: 120,
            align: 'center',
            render: (role) => (
                <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>
                    {role === 'ADMIN' ? 'Quản trị viên' : 'Quản lý/Nhân viên'}
                </Tag>
            ),
        },
        {
            title: 'Vai trò RBAC',
            key: 'rbacRoles',
            width: 200,
            render: (_, record) => {
                const roles = getUserRBACRoles(record);
                if (roles.length === 0) {
                    return <Text type="secondary" className="text-xs">Chưa gán vai trò</Text>;
                }
                return (
                    <Space wrap size={[0, 4]}>
                        {roles.map(role => (
                            <Tag
                                key={role.id}
                                color={role.is_system ? 'gold' : 'green'}
                                className="text-xs"
                            >
                                {role.is_system && <Crown size={10} className="mr-1 inline" />}
                                {role.name}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            align: 'center',
            render: (date) => (
                <div className="text-slate-500 text-xs font-medium">
                    {new Date(date).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center',
            render: (status) => (
                <Badge
                    status={status === 'ACTIVE' ? 'success' : 'error'}
                    text={status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 280,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Can permission="users_edit">
                        <Tooltip title="Sửa">
                            <Button type="text" icon={<EditOutlined />} onClick={() => openModal(record)} />
                        </Tooltip>
                    </Can>

                    <Can permission="roles_manage">
                        <Tooltip title="Gán vai trò">
                            <Button
                                type="text"
                                icon={<SafetyCertificateOutlined />}
                                onClick={() => openRoleModal(record)}
                                style={{ color: '#52c41a' }}
                            />
                        </Tooltip>
                    </Can>

                    <Can permission="users_edit">
                        <Tooltip title="Đổi mật khẩu">
                            <Button type="text" icon={<KeyOutlined />} onClick={() => openPasswordModal(record)} style={{ color: '#1890ff' }} />
                        </Tooltip>

                        <Tooltip title={record.status === 'ACTIVE' ? 'Khóa' : 'Mở'}>
                            <Button type="text" icon={record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />} onClick={() => handleToggleStatus(record)} />
                        </Tooltip>
                    </Can>

                    <Can permission="users_delete">
                        <Tooltip title="Xóa">
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
                        </Tooltip>
                    </Can>
                </Space>
            ),
        },
    ];

    const hasRoleChanges = () => {
        const currentIds = userCurrentRoles.map(r => r.id).sort();
        const selectedIds = [...selectedRoleIds].sort();
        return JSON.stringify(currentIds) !== JSON.stringify(selectedIds);
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            {/* Header section with professional styling */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                    <Space size="middle" align="center">
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.push('/users')}
                            className="flex items-center justify-center hover:!border-indigo-400 hover:!text-indigo-600 transition-all"
                        >
                            Quay lại
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <ShieldCheck className="text-indigo-600" size={24} />
                                <span className="text-slate-400 uppercase tracking-wider text-xs font-bold">Hệ thống Quản trị</span>
                            </div>
                            <Title level={2} className="!mb-0 !font-bold text-slate-800">Danh sách Quản lý & Nhân viên</Title>
                        </div>
                    </Space>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={() => fetchUsers()}
                        className="bg-indigo-600 hover:bg-indigo-700 flex items-center h-10 px-6 rounded-lg shadow-sm shadow-indigo-200"
                    >
                        Làm mới dữ liệu
                    </Button>
                </div>
                <div className="h-1 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            </div>

            {/* Specialized Stats for Management */}
            <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="hover:shadow-md transition-shadow border-none rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-50 rounded-2xl">
                                <TeamOutlined className="text-2xl text-indigo-600" />
                            </div>
                            <div>
                                <Text className="text-slate-400 block text-xs font-medium uppercase mb-1">Tổng cấp quản lý</Text>
                                <div className="text-2xl font-bold text-slate-800">{stats?.totalAdmins || 0}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="hover:shadow-md transition-shadow border-none rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-green-50 rounded-2xl">
                                <CheckCircleOutlined className="text-2xl text-green-600" />
                            </div>
                            <div>
                                <Text className="text-slate-400 block text-xs font-medium uppercase mb-1">Đang trực tuyến</Text>
                                <div className="text-2xl font-bold text-slate-800">{users.filter(u => u.status === 'ACTIVE').length}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="hover:shadow-md transition-shadow border-none rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-amber-50 rounded-2xl">
                                <SafetyCertificateOutlined className="text-2xl text-amber-600" />
                            </div>
                            <div>
                                <Text className="text-slate-400 block text-xs font-medium uppercase mb-1">Vai trò hệ thống</Text>
                                <div className="text-2xl font-bold text-slate-800">{allRoles.filter(r => r.is_system).length}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="hover:shadow-md transition-shadow border-none rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-purple-50 rounded-2xl">
                                <UserAddOutlined className="text-2xl text-purple-600" />
                            </div>
                            <div>
                                <Text className="text-slate-400 block text-xs font-medium uppercase mb-1">Mới thêm (7 ngày)</Text>
                                <div className="text-2xl font-bold text-slate-800">{stats?.newUsers7Days || 0}</div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                <div className="flex justify-between mb-6 p-2">
                    <div className="flex gap-4 items-center">
                        <Input
                            prefix={<SearchOutlined className="text-slate-400" />}
                            placeholder="Tìm kiếm quản lý viên..."
                            className="h-11 rounded-xl bg-slate-50 border-none hover:bg-slate-100 focus:bg-white w-80 transition-all font-medium"
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                        />
                        <div className="flex items-center gap-2 bg-slate-50 p-1 px-3 rounded-xl border border-slate-100">
                            <span className="text-slate-400 text-xs font-bold uppercase">Nhóm:</span>
                            <Select
                                placeholder="Lọc vai trò"
                                variant="borderless"
                                className="w-44 font-semibold text-indigo-600"
                                allowClear
                                value={roleFilter}
                                onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
                            >
                                <Option value="CUSTOMER">Mặc định</Option>
                                <Option value="MANAGEMENT">Ban quản trị</Option>
                            </Select>
                        </div>
                    </div>
                    <Can permission="users_create">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openModal()}
                            className="bg-slate-900 hover:!bg-slate-800 h-11 px-8 rounded-xl font-bold shadow-lg shadow-slate-200 border-none"
                        >
                            Thêm nhân sự mới
                        </Button>
                    </Can>
                </div>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize,
                        total: totalItems,
                        onChange: (p) => setCurrentPage(p),
                        showSizeChanger: true,
                        itemRender: (page, type, originalElement) => {
                            if (type === 'prev') return <Button type="text" className="text-xs">Trước</Button>;
                            if (type === 'next') return <Button type="text" className="text-xs">Sau</Button>;
                            return originalElement;
                        }
                    }}
                    bordered={false}
                    className="management-table"
                    title={() => (
                        <div className="flex items-center gap-2 text-slate-500 font-medium pb-2 border-b border-slate-100">
                            <Text type="secondary" className="!text-xs">ĐANG HIỂN THỊ {users.length} NHÂN SỰ</Text>
                        </div>
                    )}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Role Assignment Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-green-600" size={22} />
                        <span>Gán vai trò cho: <strong style={{ color: '#1890ff' }}>{roleUser?.full_name}</strong></span>
                    </div>
                }
                open={roleModalVisible}
                onOk={handleSaveRoles}
                onCancel={() => setRoleModalVisible(false)}
                width={700}
                okText="Lưu vai trò"
                cancelText="Hủy"
                okButtonProps={{
                    loading: savingRoles,
                    disabled: !hasRoleChanges(),
                    className: hasRoleChanges() ? 'bg-green-600 hover:bg-green-700' : ''
                }}
            >
                {roleLoading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" tip="Đang tải vai trò..." />
                    </div>
                ) : allRoles.length === 0 ? (
                    <Empty description="Chưa có vai trò nào trong hệ thống" />
                ) : (
                    <div className="py-4">
                        <Text className="text-slate-500 block mb-4">
                            Chọn các vai trò bạn muốn gán cho người dùng này. Mỗi vai trò có một tập hợp quyền riêng.
                        </Text>
                        <div className="grid grid-cols-2 gap-4">
                            {allRoles.map(role => {
                                const isSelected = selectedRoleIds.includes(role.id);
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => toggleRole(role.id)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected
                                            ? 'bg-green-50 border-green-300 shadow-sm'
                                            : 'bg-white border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {role.is_system && (
                                                        <Crown size={14} className="text-yellow-500" />
                                                    )}
                                                    <span className={`font-semibold ${isSelected ? 'text-green-700' : 'text-slate-800'}`}>
                                                        {role.name}
                                                    </span>
                                                </div>
                                                <Text className="text-xs text-slate-500 block mb-2">
                                                    {role.description || 'Không có mô tả'}
                                                </Text>
                                                <Tag color={role.is_system ? 'gold' : 'blue'} className="text-xs">
                                                    {role.permissions?.length || 0} quyền
                                                </Tag>
                                            </div>
                                            <Checkbox checked={isSelected} className="mt-1" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {selectedRoleIds.length > 0 && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                                <Text className="text-blue-700 font-medium block mb-2">
                                    Vai trò đã chọn ({selectedRoleIds.length}):
                                </Text>
                                <Space wrap>
                                    {allRoles
                                        .filter(r => selectedRoleIds.includes(r.id))
                                        .map(r => (
                                            <Tag key={r.id} color="blue" closable onClose={() => toggleRole(r.id)}>
                                                {r.name}
                                            </Tag>
                                        ))
                                    }
                                </Space>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Form Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${editingUser ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {editingUser ? <EditOutlined /> : <UserAddOutlined />}
                        </div>
                        <span>{editingUser ? 'Cập nhật tài khoản quản trị' : 'Thêm tài khoản quản trị mới'}</span>
                    </div>
                }
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={closeModal}
                confirmLoading={loading}
                width={700}
                okText={editingUser ? 'Cập nhật' : 'Tạo tài khoản'}
                cancelText="Hủy"
                okButtonProps={{ className: editingUser ? 'bg-amber-600' : 'bg-indigo-600' }}
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label={<span className="font-medium text-slate-600">Email</span>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email' },
                                    { type: 'email', message: 'Email không hợp lệ' }
                                ]}
                            >
                                <Input
                                    prefix={<Mail size={16} className="text-slate-400 mr-1" />}
                                    placeholder="example@gmail.com"
                                    disabled={!!editingUser}
                                    className="rounded-lg py-2"
                                />
                            </Form.Item>
                        </Col>
                        {!editingUser && (
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label={<span className="font-medium text-slate-600">Mật khẩu</span>}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu' },
                                        { min: 6, message: 'Mật khẩu phải ít nhất 6 ký tự' }
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<Key size={16} className="text-slate-400 mr-1" />}
                                        placeholder="••••••••"
                                        className="rounded-lg py-2"
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={editingUser ? 24 : 12}>
                            <Form.Item
                                name="full_name"
                                label={<span className="font-medium text-slate-600">Họ tên</span>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập họ tên' },
                                    { min: 2, message: 'Họ tên ít nhất 2 ký tự' }
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined className="text-slate-400 mr-1" />}
                                    placeholder="Nguyễn Văn A"
                                    className="rounded-lg py-2"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label={<span className="font-medium text-slate-600">Số điện thoại</span>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                    { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại Việt Nam không hợp lệ' }
                                ]}
                            >
                                <Input
                                    prefix={<Phone size={16} className="text-slate-400 mr-1" />}
                                    placeholder="0987 654 321"
                                    className="rounded-lg py-2"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="avatar_url" label={<span className="font-medium text-slate-600">Ảnh đại diện (URL)</span>}>
                                <Input
                                    prefix={<ImageIcon size={16} className="text-slate-400 mr-1" />}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="rounded-lg py-2"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="address" label={<span className="font-medium text-slate-600">Địa chỉ</span>}>
                                <Input
                                    prefix={<MapPin size={16} className="text-slate-400 mr-1" />}
                                    placeholder="Quận 1, TP. Hồ Chí Minh"
                                    className="rounded-lg py-2"
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Divider orientation="left" className="!my-2 text-xs text-slate-400 uppercase font-bold tracking-wider">Hệ thống</Divider>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="role" label={<span className="font-medium text-slate-600">Loại tài khoản</span>} rules={[{ required: true }]}>
                                <Select className="w-full h-10">
                                    <Option value="CUSTOMER">Khách hàng</Option>
                                    <Option value="ADMIN">Quản trị viên</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label={<span className="font-medium text-slate-600">Trạng thái</span>} rules={[{ required: true }]}>
                                <Select className="w-full h-10">
                                    <Option value="ACTIVE">Hoạt động</Option>
                                    <Option value="BLOCKED">Khóa</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Password Modal */}
            <Modal
                title="Đổi mật khẩu"
                open={passwordModalVisible}
                onOk={handleChangePassword}
                onCancel={closePasswordModal}
                confirmLoading={loading}
            >
                <Form form={passwordForm} layout="vertical" className="mt-4">
                    <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true }, { min: 6 }]}><Input.Password /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
