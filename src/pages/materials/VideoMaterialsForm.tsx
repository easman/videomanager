import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { FolderOutlined, SwapOutlined } from '@ant-design/icons';
import { VideoMaterial, Sku } from '../../db';
import { getLastDirectory } from '../../utils/path';

const { Option } = Select;

interface VideoMaterialFormProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onSubmit: (values: Omit<VideoMaterial, 'id' | 'modifiedTimes'>) => Promise<void>;
  submitting: boolean;
  skus: Sku[];
}

interface VideoMaterialFormValues {
  name: string;
  skuIds: number[];
}

const VideoMaterialsForm: React.FC<VideoMaterialFormProps> = ({
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting,
  skus
}) => {
  const [form] = Form.useForm<VideoMaterialFormValues>();
  const [filePath, setFilePath] = useState('');
  const [customName, setCustomName] = useState('');
  const [usingFolderName, setUsingFolderName] = useState(true);

  const resetForm = () => {
    setFilePath('');
    setCustomName('');
    setUsingFolderName(true);
    form.resetFields();
    setModalVisible(false);
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
      console.error('选择文件夹失败：', error);
    }
  };

  const toggleName = () => {
    const currentName = form.getFieldValue('name');
    const folderName = getLastDirectory(filePath);
    
    if (usingFolderName) {
      // 切换到自定义名称
      form.setFieldsValue({ name: customName });
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

  const handleSubmit = async (values: VideoMaterialFormValues) => {
    if (!filePath) {
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      filePath,
      skuIds: values.skuIds || []
    });
  };

  const renderNameLabel = () => {
    if (!filePath) return '名字';

    return (
      <Space>
        名字
        {filePath && (
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
    <Modal
      maskClosable={false}
      title="添加视频素材"
      open={modalVisible}
      onCancel={resetForm}
      onOk={() => form.submit()}
      cancelText="取消"
      okText="提交"
      confirmLoading={submitting}
      width={600}
    >
      <Form<VideoMaterialFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
            showSearch
            filterOption={(input, option) => {
              const text = String(option?.children);
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            maxTagCount="responsive"  
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
  );
};

export default VideoMaterialsForm; 