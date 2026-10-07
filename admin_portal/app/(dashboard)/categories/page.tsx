/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { categoryService, Category } from "@/services/category.service";
import { Table, Button, Form, Input, Modal, Space, message, Popconfirm, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Can } from "@/components/common/AccessControl";
import type { TableColumnsType } from "antd";

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editCategory, setEditCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await categoryService.getCategories();
            setCategories(res.data);
        } catch (error) {
            message.error("Không thể tải danh mục");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAddNew = () => {
        setEditCategory(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (cat: Category) => {
        setEditCategory(cat);
        form.setFieldsValue(cat);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await categoryService.deleteCategory(id);
            message.success("Xóa danh mục thành công");
            fetchCategories();
        } catch (error) {
            message.error("Lỗi khi xóa danh mục");
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editCategory) {
                await categoryService.updateCategory(editCategory.id, values);
                message.success("Cập nhật danh mục thành công");
            } else {
                await categoryService.createCategory(values);
                message.success("Thêm danh mục thành công");
            }
            setIsModalVisible(false);
            form.resetFields();
            fetchCategories();
        } catch (error) {
            message.error("Lỗi khi lưu danh mục");
        }
    };

    const columns: TableColumnsType<Category> = [
        {
            title: "STT",
            key: "stt",
            width: 60,
            render: (_, __, index) => index + 1,
            align: "center",
        },
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 100,
            render: (text) => <span className="font-mono">#{text}</span>,
        },
        {
            title: "Tên danh mục",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Slug",
            dataIndex: "slug",
            key: "slug",
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "Icon",
            dataIndex: "icon",
            key: "icon",
        },
        {
            title: "Hành động",
            key: "action",
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Can permission="categories_manage">
                        <Tooltip title="Sửa danh mục">
                            <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            />
                        </Tooltip>
                        <Tooltip title="Xóa danh mục" className="ml-2">
                            <Popconfirm
                                title="Xóa danh mục"
                                description="Bạn có chắc muốn xóa danh mục này?"
                                okText="Xóa"
                                cancelText="Hủy"
                                onConfirm={() => handleDelete(record.id)}
                            >
                                <Button danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Tooltip>
                    </Can>
                </Space>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className=" bg-white rounded-2xl shadow-sm border border-gray-100 px-4 hover:shadow-md transition-shadow">
                <div className="flex px-6 py-6 justify-between">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý danh mục tour</h1>
                            <p className="text-gray-500">Quản lý và cập nhật các danh mục tour du lịch của bạn</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Can permission="categories_manage">
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={handleAddNew}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Thêm mới
                            </Button>
                        </Can>
                    </div>

                    {/* Stats Cards */}
                    {/*    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-md">
                            <p className="text-sm opacity-90 mb-1">Tổng danh mục</p>
                            <p className="text-3xl font-bold">{categories.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-md">
                            <p className="text-sm opacity-90 mb-1">Danh mục hoạt động</p>
                            <p className="text-3xl font-bold">{categories.filter(c => c.is_active).length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-md">
                            <p className="text-sm opacity-90 mb-1">Danh mục inactive</p>
                            <p className="text-3xl font-bold">{categories.filter(c => !c.is_active).length}</p>
                        </div>
                    </div> */}
                </div>
            </div>

            {/* Table Section */}
            <div className="py-8">
                <div className="bg-white rounded-lg shadow-sm ">
                    <Table
                        columns={columns}
                        dataSource={categories}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        bordered={false}
                        className="custom-table"
                    />
                </div>
            </div>

            <Modal
                title={editCategory ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        label="Tên danh mục"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
                    >
                        <Input placeholder="Nhập tên danh mục" />
                    </Form.Item>

                    <Form.Item
                        label="Slug"
                        name="slug"
                        rules={[{ required: true, message: "Vui lòng nhập slug" }]}
                    >
                        <Input placeholder="ví dụ: bien-dao" />
                    </Form.Item>

                    <Form.Item
                        label="Mô tả"
                        name="description"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="Mô tả danh mục"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Biểu tượng (icon)"
                        name="icon"
                    >
                        <Input placeholder="ví dụ: beach, culture, mountain..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}