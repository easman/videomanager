import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space } from 'antd';
import { PlusOutlined, FolderOutlined, SwapOutlined } from '@ant-design/icons';
import { db, VideoMaterial, Sku } from '../db';
import { getLastDirectory } from '../utils/path';

const { Option } = Select;

interface VideoMaterialFormValues {
  name: string;
  skuIds: number[];
}

const VideoMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm<VideoMaterialFormValues>();
  const [uploading, setUploading] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [customName, setCustomName] = useState('');
  const [usingFolderName, setUsingFolderName] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [allMaterials, allSkus] = await Promise.all([
      db.videoMaterials.toArray(),
      db.skus.toArray()
    ]);
    setMaterials(allMaterials);
    setSkus(allSkus);
  };

  const resetModal = () => {
    setModalVisible(false);
    setFilePath('');
    setCustomName('');
    setUsingFolderName(true);
    form.resetFields();
  };

  const handleAdd = async (values: VideoMaterialFormValues) => {
    if (!filePath) {
      message.error('请选择文件夹路径');
      return;
    }

    setUploading(true);
    try {
      const id = await db.videoMaterials.add({
        ...values,
        name: values.name.trim(),
        filePath,
        thumbnails: [],
        skuIds: values.skuIds || [],
        modifiedTimes: [new Date().toISOString()]
      });
      
      message.success('添加成功');
      resetModal();
      fetchData();
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
        const folderName = getLastDirectory(path);
        setFilePath(path);
        
        // 如果名称未填写，自动使用文件夹名
        if (!form.getFieldValue('name')) {
          form.setFieldsValue({ name: folderName });
          setUsingFolderName(true);
        }
      }
    } catch (error) {
      message.error('选择文件夹失败：' + (error as Error).message);
    }
  };

  const toggleName = () => {
    const currentName = form.getFieldValue('name');
    const folderName = getLastDirectory(filePath);
    
    if (usingFolderName) {
      // 切换到自定义名称
      form.setFieldsValue({ name: customName});
      setUsingFolderName(false);
    } else {
      // 切换到文件夹名称
      setCustomName(currentName); // 保存当前的自定义名称
      form.setFieldsValue({ name: folderName });
      setUsingFolderName(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const folderName = getLastDirectory(filePath);
    setUsingFolderName(newName === folderName);
    if (!usingFolderName) {
      setCustomName(newName);
    }
  };

  const columns = [
    { title: '名字', dataIndex: 'name', key: 'name' },
    { 
      title: '文件夹路径', 
      dataIndex: 'filePath', 
      key: 'filePath',
      render: (filePath: string) => (
        <Tag>{getLastDirectory(filePath)}</Tag>
      )
    },
    { 
      title: '关联服饰', 
      dataIndex: 'skuIds', 
      key: 'skuIds',
      render: (skuIds: number[]) => (
        <Space wrap>
          {skuIds?.map(id => {
            const sku = skus.find(s => s.id === id);
            return sku ? (
              <Tag key={id}>
                【{sku.brand}】{sku.name}（{sku.type}）
              </Tag>
            ) : null;
          })}
        </Space>
      )
    },
    { 
      title: '缩略图', 
      dataIndex: 'thumbnails', 
      key: 'thumbnails',
      render: (thumbnails: string[]) => thumbnails?.length ? '已生成' : '未生成'
    }
  ];

  const renderNameLabel = () => {
    if (!filePath) return '名字';

    const showSwitch = filePath;

    return (
      <Space>
        名字
        {showSwitch && (
          <Button 
            type="link" 
            icon={<SwapOutlined />} 
            onClick={toggleName}
            size="small"
          >
            {usingFolderName ? '使用自定义名' : '使用文件夹名'}
          </Button>
        )}
      </Space>
    );
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加素材
      </Button>

      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={materials} 
        style={{ marginTop: 16 }} 
      />

      <Modal
        title="添加视频素材"
        open={modalVisible}
        onCancel={resetModal}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={600}
      >
        <Form<VideoMaterialFormValues>
          form={form}
          layout="vertical"
          onFinish={handleAdd}
          preserve={false}
        >
          <Form.Item label="文件夹路径" required>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={filePath}
                placeholder="请选择文件夹路径"
                readOnly
              />
              <Button icon={<FolderOutlined />} onClick={handleFolderSelect} />
            </Space.Compact>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => (
              <Form.Item
                name="name"
                label={renderNameLabel()}
                rules={[{ required: true, message: '请输入素材名字' }]}
                getValueFromEvent={e => e.target.value.trim()}
              >
                <Input 
                  placeholder="请输入素材名字" 
                  onChange={handleNameChange}
                />
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item name="skuIds" label="关联服饰" initialValue={[]}>
            <Select
              mode="multiple"
              placeholder="请选择关联服饰"
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {skus.map(sku => (
                <Option key={sku.id} value={sku.id}>
                  【{sku.brand}】{sku.name}（{sku.type}）
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VideoMaterialsPage; 