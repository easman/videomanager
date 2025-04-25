import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Upload, Select, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { db, Sku } from '../db';

const ClothesPage: React.FC = () => {
  const [clothes, setClothes] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const fetchClothes = async () => {
    const all = await db.clothes.toArray();
    setClothes(all);
  };

  useEffect(() => {
    fetchClothes();
  }, []);

  const handleAdd = async (values: any) => {
    setUploading(true);
    await db.clothes.add({
      ...values,
      image: imageUrl,
      buyDate: values.buyDate.format('YYYY-MM-DD'),
    });
    setUploading(false);
    setModalVisible(false);
    form.resetFields();
    setImageUrl('');
    fetchClothes();
    message.success('添加成功');
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const reader = new FileReader();
      reader.onload = e => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const columns = [
    { title: '图片', dataIndex: 'image', key: 'image', render: (img: string) => img ? <img src={img} alt="服饰" style={{ width: 60 }} /> : '-' },
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '购入时间', dataIndex: 'buyDate', key: 'buyDate' },
    { title: '购入信息', dataIndex: 'buyInfo', key: 'buyInfo' },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加服饰
      </Button>
      <Table rowKey="id" columns={columns} dataSource={clothes} style={{ marginTop: 16 }} />
      <Modal
        title="添加服饰"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="名字" rules={[{ required: true, message: '请输入服饰名字' }]}> <Input /> </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请输入类型' }]}> <Input /> </Form.Item>
          <Form.Item name="brand" label="品牌"> <Input /> </Form.Item>
          <Form.Item name="buyDate" label="购入时间" rules={[{ required: true, message: '请选择购入时间' }]}> <DatePicker style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="buyInfo" label="购入信息"> <Input.TextArea /> </Form.Item>
          <Form.Item label="图片">
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleImageUpload}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Upload>
            {imageUrl && <img src={imageUrl} alt="预览" style={{ width: 80, marginTop: 8 }} />}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClothesPage; 