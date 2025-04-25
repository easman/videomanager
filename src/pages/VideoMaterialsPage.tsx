import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { db, VideoMaterial } from '../db';

const VideoMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  const fetchMaterials = async () => {
    const all = await db.videoMaterials.toArray();
    setMaterials(all);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAdd = async (values: any) => {
    setUploading(true);
    await db.videoMaterials.add({
      ...values,
      filePath,
      thumbnail,
      createdAt: new Date().toISOString(),
    });
    setUploading(false);
    setModalVisible(false);
    form.resetFields();
    setFilePath('');
    setThumbnail('');
    fetchMaterials();
    message.success('添加成功');
  };

  const handleFileUpload = (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      setFilePath(info.file.name);
      // 生成缩略图（这里只做图片，视频可扩展）
      if (info.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => setThumbnail(e.target?.result as string);
        reader.readAsDataURL(info.file.originFileObj);
      }
    }
  };

  const columns = [
    { title: '缩略图', dataIndex: 'thumbnail', key: 'thumbnail', render: (img: string) => img ? <img src={img} alt="缩略图" style={{ width: 60 }} /> : '-' },
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '文件路径', dataIndex: 'filePath', key: 'filePath' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加素材
      </Button>
      <Table rowKey="id" columns={columns} dataSource={materials} style={{ marginTop: 16 }} />
      <Modal
        title="添加视频素材"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="名字" rules={[{ required: true, message: '请输入素材名字' }]}> <Input /> </Form.Item>
          <Form.Item label="文件">
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileUpload}
              accept="image/*,video/*"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            {filePath && <div style={{ marginTop: 8 }}>文件名: {filePath}</div>}
            {thumbnail && <img src={thumbnail} alt="缩略图" style={{ width: 80, marginTop: 8 }} />}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VideoMaterialsPage; 