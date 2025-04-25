import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, FolderOutlined } from '@ant-design/icons';
import { db, VideoMaterial, Sku } from '../db';

const { Option } = Select;

const VideoMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [filePath, setFilePath] = useState('');

  const fetchData = async () => {
    const [allMaterials, allSkus] = await Promise.all([
      db.videoMaterials.toArray(),
      db.skus.toArray()
    ]);
    setMaterials(allMaterials);
    setSkus(allSkus);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (values: any) => {
    if (!filePath) {
      message.error('请选择文件夹路径');
      return;
    }

    setUploading(true);
    try {
      await db.videoMaterials.add({
        ...values,
        filePath,
        thumbnails: [],
        skuIds: values.skuIds || [],
        createdAt: new Date().toISOString(),
      });
      setModalVisible(false);
      form.resetFields();
      setFilePath('');
      fetchData();
      message.success('添加成功');
    } catch (error) {
      message.error('添加失败：' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFolderSelect = async () => {
    try {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        setFilePath(path);
      }
    } catch (error) {
      message.error('选择文件夹失败：' + (error as Error).message);
    }
  };

  const columns = [
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '文件路径', dataIndex: 'filePath', key: 'filePath' },
    { 
      title: '关联服饰', 
      dataIndex: 'skuIds', 
      key: 'skuIds',
      render: (skuIds: number[]) => skuIds?.map(id => 
        skus.find(sku => sku.id === id)?.name
      ).filter(Boolean).join(', ') || '-'
    },
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
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="名字" rules={[{ required: true, message: '请输入素材名字' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="skuIds" label="关联服饰">
            <Select
              mode="multiple"
              placeholder="请选择关联服饰"
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {skus.map(sku => (
                <Option key={sku.id} value={sku.id}>
                  {sku.name} ({sku.type} - {sku.brand})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="文件夹路径" required>
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 32px)' }}
                value={filePath}
                placeholder="请选择文件夹路径"
                readOnly
              />
              <Button icon={<FolderOutlined />} onClick={handleFolderSelect} />
            </Input.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VideoMaterialsPage; 