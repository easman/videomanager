import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, Tag, message } from 'antd';
import { FolderOutlined, SwapOutlined, CloseOutlined } from '@ant-design/icons';
import { VideoMaterial, Sku } from '../../db';
import { getLastDirectory } from '../../utils/path';
import SkuTags from '../../components/SkuTags';

const { Option } = Select;
const { TextArea } = Input;

interface VideoMaterialFormProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onSubmit: (values: Omit<VideoMaterial, 'id' | 'modifiedTimes'>) => Promise<void>;
  submitting: boolean;
  skus: Sku[];
  initialData?: VideoMaterial;
  mode?: 'create' | 'edit';
}

interface VideoMaterialFormValues {
  name: string;
  skuIds: number[];
  extraInfo: string;
}

const VideoMaterialsForm: React.FC<VideoMaterialFormProps> = ({
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting,
  skus,
  initialData,
  mode = 'create'
}) => {
  const [form] = Form.useForm<VideoMaterialFormValues>();
  const [filePath, setFilePath] = useState('');
  const [customName, setCustomName] = useState('');
  const [usingFolderName, setUsingFolderName] = useState(true);
  const [selectedSkus, setSelectedSkus] = useState<number[]>([]);

  // 初始化表单数据
  useEffect(() => {
    if (modalVisible) {
      if (mode === 'edit' && initialData) {
        // 编辑模式：设置初始值
        setFilePath(initialData.filePath);
        setCustomName(initialData.name);
        setUsingFolderName(initialData.name === getLastDirectory(initialData.filePath));
        setSelectedSkus(initialData.skuIds || []);
        
        // 使用 setTimeout 确保在下一个事件循环中设置表单值
        setTimeout(() => {
          form.setFieldsValue({
            name: initialData.name,
            skuIds: initialData.skuIds || [],
            extraInfo: initialData.extraInfo || ''
          });
        }, 0);
      } else {
        // 新建模式：重置表单
        form.resetFields();
        setFilePath('');
        setCustomName('');
        setUsingFolderName(true);
        setSelectedSkus([]);
      }
    }
  }, [modalVisible, initialData, mode, form]);

  const handleCancel = () => {
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
      skuIds: values.skuIds || [],
      extraInfo: values.extraInfo || ''
    });
  };

  const handleSkuChange = (value: number[]) => {
    setSelectedSkus(value);
    form.setFieldsValue({ skuIds: value });
  };

  const handleRemoveSku = (skuId: number) => {
    const newSkuIds = selectedSkus.filter(id => id !== skuId);
    setSelectedSkus(newSkuIds);
    form.setFieldsValue({ skuIds: newSkuIds });
  };

  const handleOpenFolder = async () => {
    if (!filePath) return;
    try {
      const result = await window.electronAPI.openFolder(filePath);
      if (!result.success) {
        message.error('打开文件夹失败：' + result.message);
      }
    } catch (error) {
      console.error('打开文件夹失败：', error);
    }
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

  const renderSelectedSkus = () => {
    if (!selectedSkus.length) return null;

    return (
      <div style={{ marginTop: 8 }}>
        <SkuTags 
          skuIds={selectedSkus} 
          skus={skus} 
          onClose={handleRemoveSku} 
        />
      </div>
    );
  };

  return (
    <Modal
      maskClosable={false}
      title={mode === 'create' ? "添加视频素材" : "编辑视频素材"}
      open={modalVisible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      cancelText="取消"
      okText="提交"
      confirmLoading={submitting}
      width={600}
      forceRender
    >
      <Form<VideoMaterialFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        preserve={false}
        initialValues={{
          name: initialData?.name || '',
          skuIds: initialData?.skuIds || [],
          extraInfo: initialData?.extraInfo || ''
        }}
      >
        <Form.Item label="文件夹路径" required>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={filePath}
              placeholder="请选择文件夹路径"
              readOnly
              style={{ cursor: filePath ? 'pointer' : 'default' }}
              onClick={handleOpenFolder}
            />
            <Button 
              icon={<FolderOutlined />} 
              onClick={handleFolderSelect}
              />
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

        <Form.Item
          label={
            <div style={{ marginBottom: selectedSkus.length ? 0 : 8 }}>
              关联服饰
              {renderSelectedSkus()}
            </div>
          }
          name="skuIds"
        >
          <Select
            mode="multiple"
            placeholder="请选择关联服饰"
            style={{ width: '100%' }}
            optionFilterProp="children"
            showSearch
            value={selectedSkus}
            onChange={handleSkuChange}
            filterOption={(input, option) => {
              const text = String(option?.children);
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            maxTagCount={0}
          >
            {skus.map(sku => (
              <Option key={sku.id} value={sku.id}>
                [{sku.id}]【{sku.brand}】{sku.name}（{sku.type}）
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="extraInfo"
          label="额外信息"
        >
          <TextArea
            placeholder="请输入额外信息"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default VideoMaterialsForm; 