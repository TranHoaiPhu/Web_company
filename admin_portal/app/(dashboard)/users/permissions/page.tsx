"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Typography,
    Button,
    Tag,
    Space,
    Modal,
    Form,
    Input,
    Row,
    Col,
    message,
    Spin,
    Select,
    Empty,
    Popconfirm
} from 'antd';
import {
    ShieldCheck,
    Key,
    Plus,
    Edit,
    Trash2,
    Save,
    CheckSquare,
    Square,
    Users,
    RefreshCw,
    Crown
} from 'lucide-react';
import { RoleService, PermissionService, Role, Permission, PermissionGrouped } from '@/services/role.service';
import { Can } from '@/components/common/AccessControl';

const { Title, Text } = Typography;

// Module name mapping for Vietnamese display
const MODULE_LABELS: Record<string, string> = {
    'users': 'Người dùng',
    'permissions': 'Phân quyền',
    'tours': 'Tours',
    'orders': 'Đơn hàng',
    'chat': 'Hỗ trợ Chat',
    'content': 'Nội dung',
    'banners': 'Quảng cáo & Banner',
    'system': 'Hệ thống'
};

export default function PermissionsPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGrouped[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [tempPermissions, setTempPermissions] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form] = Form.useForm();

    // Fetch roles and permissions from API
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                RoleService.getRoles(),
                PermissionService.getPermissions(true)
            ]);

            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
            setPermissionGroups(permsRes.grouped || []);

            // Select first role by default
            if (rolesRes.data.length > 0 && !selectedRole) {
                const firstRole = rolesRes.data[0];
                setSelectedRole(firstRole);
                setTempPermissions(firstRole.permissions || []);
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
            message.error('Không thể tải dữ liệu phân quyền');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
        setTempPermissions(role.permissions || []);
    };

    const handleOpenModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            form.setFieldsValue({
                name: role.name,
                slug: role.slug,
                description: role.description
            });
        } else {
            setEditingRole(null);
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleSaveRole = async () => {
        try {
            const values = await form.validateFields();

            if (editingRole) {
                // Update existing role
                const updated = await RoleService.updateRole(editingRole.id, values);
                setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...updated } : r));
                if (selectedRole?.id === editingRole.id) {
                    setSelectedRole({ ...selectedRole, ...updated });
                }
                message.success('Cập nhật vai trò thành công');
            } else {
                // Create new role
                const newRole = await RoleService.createRole(values);
                setRoles([...roles, newRole]);
                message.success('Thêm vai trò mới thành công');
            }

            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Error saving role:', error);
            message.error(error.response?.data?.detail || 'Có lỗi xảy ra');
        }
    };

    const handleDeleteRole = async (id: number) => {
        try {
            await RoleService.deleteRole(id);
            const newRoles = roles.filter(r => r.id !== id);
            setRoles(newRoles);

            if (selectedRole?.id === id && newRoles.length > 0) {
                setSelectedRole(newRoles[0]);
                setTempPermissions(newRoles[0].permissions || []);
            }

            message.success('Đã xóa vai trò');
        } catch (error: any) {
            console.error('Error deleting role:', error);
            message.error(error.response?.data?.detail || 'Không thể xóa vai trò này');
        }
    };

    const togglePermission = (slug: string) => {
        setTempPermissions(prev =>
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const selectAllInModule = (module: string) => {
        const modulePerms = permissions.filter(p => p.module === module).map(p => p.slug);
        const allSelected = modulePerms.every(slug => tempPermissions.includes(slug));

        if (allSelected) {
            // Deselect all in module
            setTempPermissions(prev => prev.filter(slug => !modulePerms.includes(slug)));
        } else {
            // Select all in module
            setTempPermissions(prev => [...new Set([...prev, ...modulePerms])]);
        }
    };

    const savePermissions = async () => {
        if (!selectedRole) return;

        setSaving(true);
        try {
            await RoleService.assignPermissionsToRole(selectedRole.id, tempPermissions);

            // Update local state
            const updatedRole = { ...selectedRole, permissions: tempPermissions };
            setRoles(roles.map(r => r.id === selectedRole.id ? updatedRole : r));
            setSelectedRole(updatedRole);

            message.success(`Đã lưu phân quyền cho vai trò "${selectedRole.name}"`);
        } catch (error: any) {
            console.error('Error saving permissions:', error);
            message.error('Không thể lưu phân quyền');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = selectedRole && (
        JSON.stringify([...tempPermissions].sort()) !== JSON.stringify([...(selectedRole.permissions || [])].sort())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spin size="large" tip="Đang tải dữ liệu phân quyền..." />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} className="!mb-1 flex items-center gap-3">
                        <ShieldCheck className="text-blue-600" size={32} />
                        Phân quyền & Vai trò
                    </Title>
                    <Text className="text-slate-500 text-base">
                        Quản lý các vai trò và gán quyền cho từng nhóm người dùng trong hệ thống
                    </Text>
                </div>
                <Space>
                    <Button
                        icon={<RefreshCw size={16} className="mr-1" />}
                        onClick={fetchData}
                    >
                        Làm mới
                    </Button>
                    <Can permission="roles_manage">
                        <Button
                            type="primary"
                            icon={<Plus size={18} className="mr-2" />}
                            className="h-11 bg-blue-600 hover:bg-blue-700 flex items-center"
                            onClick={() => handleOpenModal()}
                        >
                            Thêm vai trò mới
                        </Button>
                    </Can>
                </Space>
            </div>

            <Row gutter={24}>
                {/* Left: Role List */}
                <Col span={8}>
                    <Card className="shadow-sm border-slate-200 h-full rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="text-blue-600" size={20} />
                            <Title level={4} className="!mb-0">Danh sách vai trò ({roles.length})</Title>
                        </div>

                        {roles.length === 0 ? (
                            <Empty description="Chưa có vai trò nào" />
                        ) : (
                            <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                                {roles.map(role => (
                                    <div
                                        key={role.id}
                                        onClick={() => handleRoleSelect(role)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedRole?.id === role.id
                                            ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                                            : 'bg-white border-slate-100 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {role.is_system && (
                                                        <Crown size={14} className="text-yellow-500" />
                                                    )}
                                                    <Title level={5} className={`!mb-0 truncate ${selectedRole?.id === role.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                                        {role.name}
                                                    </Title>
                                                </div>
                                                <Text className="text-xs text-slate-500 block mb-2 line-clamp-2">
                                                    {role.description || 'Không có mô tả'}
                                                </Text>
                                                <Tag color={role.permissions?.length === permissions.length ? 'gold' : 'blue'}>
                                                    {role.permissions?.length || 0} quyền
                                                </Tag>
                                                {role.is_system && (
                                                    <Tag color="red" className="ml-1">Hệ thống</Tag>
                                                )}
                                            </div>
                                            <Can permission="roles_manage">
                                                <Space>
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<Edit size={14} />}
                                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(role); }}
                                                        disabled={role.is_system}
                                                    />
                                                    {!role.is_system && (
                                                        <Popconfirm
                                                            title="Xóa vai trò"
                                                            description="Bạn có chắc muốn xóa vai trò này?"
                                                            onConfirm={() => handleDeleteRole(role.id)}
                                                            okText="Xóa"
                                                            cancelText="Hủy"
                                                            okButtonProps={{ danger: true }}
                                                        >
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                icon={<Trash2 size={14} />}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </Popconfirm>
                                                    )}
                                                </Space>
                                            </Can>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Right: Permission Matrix */}
                <Col span={16}>
                    <Card
                        className="shadow-sm border-slate-200 h-full rounded-2xl"
                        title={
                            <div className="flex justify-between items-center py-1">
                                <div className="flex items-center gap-2">
                                    <Key className="text-blue-600" size={20} />
                                    <span>
                                        Chi tiết quyền cho: <strong className="text-blue-600">{selectedRole?.name || 'Chưa chọn'}</strong>
                                    </span>
                                </div>
                                <Can permission="roles_manage">
                                    <Button
                                        type="primary"
                                        icon={<Save size={18} className="mr-2" />}
                                        onClick={savePermissions}
                                        loading={saving}
                                        disabled={!hasChanges}
                                        className={`flex items-center ${hasChanges ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    >
                                        {hasChanges ? 'Lưu thay đổi' : 'Không có thay đổi'}
                                    </Button>
                                </Can>
                            </div>
                        }
                    >
                        {!selectedRole ? (
                            <Empty description="Chọn một vai trò để xem và chỉnh sửa quyền" />
                        ) : (
                            <div className="space-y-8 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
                                {permissionGroups.map(group => {
                                    const modulePerms = group.permissions.map(p => p.slug);
                                    const selectedCount = modulePerms.filter(slug => tempPermissions.includes(slug)).length;
                                    const allSelected = selectedCount === modulePerms.length;

                                    return (
                                        <div key={group.module}>
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                                <Title level={5} className="!mb-0 flex items-center gap-2">
                                                    <div className="w-2 h-6 bg-blue-500 rounded-sm"></div>
                                                    {MODULE_LABELS[group.module] || group.module}
                                                    <Tag color="default" className="ml-2">
                                                        {selectedCount}/{modulePerms.length}
                                                    </Tag>
                                                </Title>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    onClick={() => selectAllInModule(group.module)}
                                                >
                                                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                                </Button>
                                            </div>
                                            <Row gutter={[16, 16]}>
                                                {group.permissions.map(permission => {
                                                    const isActive = tempPermissions.includes(permission.slug);
                                                    return (
                                                        <Col span={8} key={permission.slug}>
                                                            <div
                                                                onClick={() => togglePermission(permission.slug)}
                                                                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${isActive
                                                                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                                                    }`}
                                                            >
                                                                <div>
                                                                    <span className={`text-sm block ${isActive ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                                                                        {permission.name}
                                                                    </span>
                                                                    {permission.description && (
                                                                        <span className="text-xs text-slate-400 block mt-0.5">
                                                                            {permission.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isActive ? (
                                                                    <CheckSquare size={18} className="text-blue-600 flex-shrink-0" />
                                                                ) : (
                                                                    <Square size={18} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                        </Col>
                                                    );
                                                })}
                                            </Row>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Role Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        {editingRole ? <Edit size={20} /> : <Plus size={20} />}
                        {editingRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
                    </div>
                }
                open={isModalOpen}
                onOk={handleSaveRole}
                onCancel={() => setIsModalOpen(false)}
                okText={editingRole ? 'Cập nhật' : 'Thêm mới'}
                cancelText="Hủy"
                className="rounded-2xl"
                width={500}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Tên vai trò"
                        rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
                    >
                        <Input placeholder="ví dụ: Quản lý tour" />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug (định danh)"
                        rules={[
                            { required: true, message: 'Vui lòng nhập slug' },
                            { pattern: /^[a-z0-9_]+$/, message: 'Chỉ được dùng chữ thường, số và dấu gạch dưới' }
                        ]}
                        extra="Ví dụ: tour_manager, content_editor"
                    >
                        <Input placeholder="tour_manager" disabled={!!editingRole} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả chức năng của vai trò này" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
