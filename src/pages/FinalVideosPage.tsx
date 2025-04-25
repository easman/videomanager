import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, FinalVideo, Sku, VideoMaterial } from '../db';

const { Option } = Select;

const FinalVideosPage: React.FC = () => {
  const [finalVideos, setFinalVideos] = useState<FinalVideo[]>([]);
  const [clothes, setClothes] = useState<Sku[]>([]);
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setFinalVideos(await db.finalVideos.toArray());
    setClothes(await db.clothes.toArray());
    setMaterials(await db.videoMaterials.toArray());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (values: any) => {
    setUploading(true);
    await db.finalVideos.add({
      ...values,
      clothesIds: values.clothesIds || [],
      materialIds: values.materialIds || [],
      publishStatus: values.publishStatus,
      publishTime: values.publishTime ? values.publishTime.format('YYYY-MM-DD HH:mm') : '',
      createdAt: new Date().toISOString(),
    });
    setUploading(false);
    setModalVisible(false);
    form.resetFields();
    fetchData();
    message.success('添加成功');
  };

  const columns = [
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '服饰', dataIndex: 'clothesIds', key: 'clothesIds', render: (ids: number[]) => ids.map(id => clothes.find(c => c.id === id)?.name).join(', ') },
    { title: '素材', dataIndex: 'materialIds', key: 'materialIds', render: (ids: number[]) => ids.map(id => materials.find(m => m.id === id)?.name).join(', ') },
    { title: '发布状态', dataIndex: 'publishStatus', key: 'publishStatus' },
    { title: '发布时间', dataIndex: 'publishTime', key: 'publishTime' },
    { title: '发布链接', dataIndex: 'publishLink', key: 'publishLink', render: (link: string) => link ? <a href={link} target="_blank" rel="noopener noreferrer">{link}</a> : '-' },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加成品视频
      </Button>
      <Table rowKey="id" columns={columns} dataSource={finalVideos} style={{ marginTop: 16 }} />
      <Modal
        title="添加成品视频"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="名字" rules={[{ required: true, message: '请输入视频名字' }]}> <Input /> </Form.Item>
          <Form.Item name="description" label="描述"> <Input.TextArea /> </Form.Item>
          <Form.Item name="clothesIds" label="关联服饰"> <Select mode="multiple" allowClear placeholder="请选择服饰"> {clothes.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)} </Select> </Form.Item>
          <Form.Item name="materialIds" label="关联素材"> <Select mode="multiple" allowClear placeholder="请选择素材"> {materials.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)} </Select> </Form.Item>
          <Form.Item name="publishStatus" label="发布状态" rules={[{ required: true, message: '请选择发布状态' }]}> <Select> <Option value="未发布">未发布</Option> <Option value="已发布">已发布</Option> <Option value="定时发布">定时发布</Option> </Select> </Form.Item>
          <Form.Item name="publishInfo" label="发布信息"> <Input.TextArea /> </Form.Item>
          <Form.Item name="publishTime" label="发布时间"> <DatePicker showTime style={{ width: '100%' }} /> </Form.Item>
          <Form.Item name="publishLink" label="发布链接"> <Input /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinalVideosPage; 