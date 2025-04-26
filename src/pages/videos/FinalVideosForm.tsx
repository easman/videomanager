import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, DatePicker, Tag } from 'antd';
import { FolderOutlined, SwapOutlined } from '@ant-design/icons';
import { FinalVideo, Sku, VideoMaterial } from '../../db';
import { getFileNameWithoutExtension } from '../../utils/path';
import dayjs from 'dayjs';

const { Option } = Select;

interface FinalVideosFormProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onSubmit: (values: Omit<FinalVideo, 'id' | 'modifiedTimes'>) => Promise<void>;
  submitting: boolean;
  materials: VideoMaterial[];
  skus: Sku[];
}

interface FinalVideoFormValues {
  name: string;
  description?: string;
  materialIds: number[];
  videoPath: string;
  publishStatus: '待编辑' | '编辑中' | '已发布';
  publishTime?: string;
  extraInfo?: string;
}

const FinalVideosForm: React.FC<FinalVideosFormProps> = ({
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting,
  materials,
  skus
}) => {
  const [form] = Form.useForm();
  const [videoPath, setVideoPath] = useState('');
  const [customName, setCustomName] = useState('');
  const [usingVideoName, setUsingVideoName] = useState(true);
  const [selectedMaterialSkus, setSelectedMaterialSkus] = useState<Sku[]>([]);

  const resetForm = () => {
    setVideoPath('');
    setCustomName('');
    setUsingVideoName(true);
    setSelectedMaterialSkus([]);
    form.resetFields();
    setModalVisible(false);
  };

  const handleVideoPathSelect = async () => {
    try {
      const path = await window.electronAPI.selectFile();
      if (path) {
        const videoNameWithoutExt = getFileNameWithoutExtension(path);
        setVideoPath(path);
        form.setFieldsValue({ videoPath: path });
        
        if (!form.getFieldValue('name')) {
          form.setFieldsValue({ name: videoNameWithoutExt });
          setUsingVideoName(true);
        }
      }
    } catch (error) {
      console.error('选择视频文件失败：', error);
    }
  };

  const toggleName = () => {
    const currentName = form.getFieldValue('name');
    const videoNameWithoutExt = getFileNameWithoutExtension(videoPath);
    
    if (usingVideoName) {
      form.setFieldsValue({ name: customName });
      setUsingVideoName(false);
    } else {
      setCustomName(currentName);
      form.setFieldsValue({ name: videoNameWithoutExt });
      setUsingVideoName(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const videoNameWithoutExt = getFileNameWithoutExtension(videoPath);
    setUsingVideoName(newName === videoNameWithoutExt);
    if (!usingVideoName) {
      setCustomName(newName);
    }
  };

  const handleMaterialsChange = (selectedMaterialIds: number[]) => {
    const selectedMaterials = materials.filter(m => selectedMaterialIds.includes(m.id as number));
    const relatedSkuIds = new Set<number>();
    selectedMaterials.forEach(material => {
      material.skuIds?.forEach(skuId => relatedSkuIds.add(skuId));
    });
    
    const relatedSkus = skus.filter(sku => relatedSkuIds.has(sku.id as number));
    setSelectedMaterialSkus(relatedSkus);
  };

  const handleSubmit = async (values: FinalVideoFormValues) => {
    if (!values.materialIds?.length) {
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() || '',
      materialIds: values.materialIds,
      videoPath: values.videoPath,
      publishStatus: values.publishStatus,
      publishTime: values.publishTime ? dayjs(values.publishTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
      extraInfo: values.extraInfo?.trim() || ''
    });
  };

  const renderNameLabel = () => {
    if (!videoPath) return '名字';

    return (
      <Space>
        名字
        {videoPath && (
          <Button 
            type="link" 
            icon={<SwapOutlined />} 
            onClick={toggleName}
            size="small"
          >
            {usingVideoName ? '使用自定义名' : '使用视频文件名'}
          </Button>
        )}
      </Space>
    );
  };

  return (
    <Modal
      maskClosable={false}
      title="添加成品视频"
      open={modalVisible}
      onCancel={resetForm}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="videoPath" label="视频路径" required>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={videoPath}
              placeholder="请选择视频路径"
              readOnly
            />
            <Button icon={<FolderOutlined />} onClick={handleVideoPathSelect} />
          </Space.Compact>
        </Form.Item>

        <Form.Item noStyle shouldUpdate>
          {() => (
            <Form.Item 
              name="name" 
              label={renderNameLabel()} 
              rules={[{ required: true, message: '请输入视频名字' }]}
            >
              <Input 
                placeholder="请输入视频名字" 
                onChange={handleNameChange}
              />
            </Form.Item>
          )}
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea />
        </Form.Item>

        <Form.Item 
          name="materialIds" 
          label="关联素材" 
          rules={[{ required: true, message: '请选择关联素材' }]}
        >
          <Select
            mode="multiple"
            placeholder="请选择素材"
            onChange={handleMaterialsChange}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) => {
              if (!option?.children) return false;
              return String(option.children)
                .toLowerCase()
                .includes(input.toLowerCase());
            }}
            maxTagCount="responsive"
          >
            {materials.map(material => (
              <Option key={material.id} value={material.id}>
                {material.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedMaterialSkus.length > 0 && (
          <Form.Item label="关联服饰">
            <Space wrap style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
              {selectedMaterialSkus.map(sku => (
                <Tag key={sku.id}>
                  【{sku.brand}】{sku.name}（{sku.type}）
                </Tag>
              ))}
            </Space>
          </Form.Item>
        )}

        <Form.Item name="extraInfo" label="额外信息">
          <Input.TextArea />
        </Form.Item>

        <Form.Item 
          name="publishStatus" 
          label="发布状态" 
          rules={[{ required: true, message: '请选择发布状态' }]}
        >
          <Select>
            <Option value="待编辑">待编辑</Option>
            <Option value="编辑中">编辑中</Option>
            <Option value="已发布">已发布</Option>
          </Select>
        </Form.Item>

        <Form.Item 
          noStyle 
          shouldUpdate={(prevValues, currentValues) => 
            prevValues?.publishStatus !== currentValues?.publishStatus
          }
        >
          {({ getFieldValue }) => {
            const publishStatus = getFieldValue('publishStatus');
            return publishStatus === '已发布' && (
              <Form.Item 
                name="publishTime" 
                label="发布时间"
                rules={[{ required: true, message: '请选择发布时间' }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FinalVideosForm; 