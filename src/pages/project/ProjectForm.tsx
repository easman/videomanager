import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Space, DatePicker } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { Project, Sku, VideoMaterial } from '../../db';
import dayjs from 'dayjs';
import SkuTags from '../../components/SkuTags';
import MaterialFolderTag from '../../components/MaterialFolderTag';
import { message } from 'antd';

const { Option } = Select;

interface ProjectFormProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onSubmit: (values: Omit<Project, 'id' | 'modifiedTimes'>, id?: number) => Promise<void>;
  submitting: boolean;
  materials: VideoMaterial[];
  skus: Sku[];
  initialData?: Project;
  mode?: 'create' | 'edit';
}

interface ProjectFormValues {
  name: string;
  description?: string;
  materialIds: number[];
  videoPath: string;
  publishStatus: '未编辑' | '编辑中' | '待发布' | '已发布';
  publishTime?: string;
  extraInfo?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting,
  materials,
  skus,
  initialData,
  mode = 'create'
}) => {
  const [form] = Form.useForm();
  const [videoPath, setVideoPath] = useState('');
  const [selectedMaterialSkus, setSelectedMaterialSkus] = useState<Sku[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<VideoMaterial[]>([]);

  useEffect(() => {
    if (modalVisible) {
      form.resetFields();
      
      if (mode === 'edit' && initialData) {
        const formValues = {
          name: initialData.name || '',
          description: initialData.description || '',
          materialIds: initialData.materialIds || [],
          videoPath: initialData.videoPath || '',
          publishStatus: initialData.publishStatus,
          publishTime: initialData.publishTime ? dayjs(initialData.publishTime) : undefined,
          extraInfo: initialData.extraInfo || ''
        };
        form.setFieldsValue(formValues);
        setVideoPath(initialData.videoPath);
        handleMaterialsChange(initialData.materialIds);
      } else {
        setVideoPath('');
        setSelectedMaterialSkus([]);
        setSelectedMaterials([]);
      }
    }
  }, [modalVisible, initialData, mode, form]);

  const resetForm = () => {
    setVideoPath('');
    setSelectedMaterialSkus([]);
    setSelectedMaterials([]);
    form.resetFields();
    setModalVisible(false);
  };

  const handleVideoPathSelect = async () => {
    try {
      const path = await window.electronAPI.selectFile();
      if (path) {
        setVideoPath(path);
        form.setFieldsValue({ videoPath: path });
      }
    } catch (error) {
      console.error('选择视频文件失败：', error);
    }
  };

  const handleVideoPathClick = async () => {
    if (!videoPath) return;
    try {
      const result = await window.electronAPI.showFileInFolder(videoPath);
      if (!result.success) {
        message.error('打开视频所在文件夹失败：' + result.message);
      }
    } catch (error) {
      console.error('打开视频所在文件夹失败：', error);
    }
  };

  const handleMaterialsChange = (selectedMaterialIds: number[]) => {
    const selected = materials.filter(m => selectedMaterialIds.includes(m.id as number));
    setSelectedMaterials(selected);
    
    const relatedSkuIds = new Set<number>();
    selected.forEach(material => {
      material.skuIds?.forEach(skuId => relatedSkuIds.add(skuId));
    });
    
    const relatedSkus = skus.filter(sku => relatedSkuIds.has(sku.id as number));
    setSelectedMaterialSkus(relatedSkus);
  };

  const handleRemoveMaterial = (materialId: number) => {
    const currentMaterialIds = form.getFieldValue('materialIds') || [];
    const newMaterialIds = currentMaterialIds.filter(id => id !== materialId);
    form.setFieldsValue({ materialIds: newMaterialIds });
    handleMaterialsChange(newMaterialIds);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
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
    }, mode === 'edit' ? initialData?.id : undefined);
  };

  const renderSelectedMaterials = () => {
    if (!selectedMaterials.length) return null;

    return (
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <Space wrap size={[0, 8]}>
          {selectedMaterials.map(material => (
            <Space key={material.id} size={4}>
              <MaterialFolderTag 
                filePath={material.filePath} 
                onClose={() => handleRemoveMaterial(material.id as number)}
              />
            </Space>
          ))}
        </Space>
      </div>
    );
  };

  return (
    <Modal
      maskClosable={false}
      title={mode === 'create' ? "添加项目" : "编辑项目"}
      open={modalVisible}
      onCancel={resetForm}
      onOk={() => form.submit()}
      cancelText="取消"
      okText="提交"
      confirmLoading={submitting}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item 
          name="name" 
          label="名字"
          rules={[{ required: true, message: '请输入视频名字' }]}
        >
          <Input placeholder="请输入视频名字" />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea />
        </Form.Item>

        <Form.Item 
          name="materialIds" 
          label={
            <div style={{ marginBottom: selectedMaterials.length ? 0 : 8 }}>
              关联素材
              {renderSelectedMaterials()}
            </div>
          }
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
            <SkuTags 
              skuIds={selectedMaterialSkus.map(sku => sku.id as number)} 
              skus={skus} 
            />
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
            <Option value="未编辑">未编辑</Option>
            <Option value="编辑中">编辑中</Option>
            <Option value="待发布">待发布</Option>
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
            const needsVideo = publishStatus === '待发布' || publishStatus === '已发布';
            const needsPublishTime = publishStatus === '已发布';

            return (
              <>
                {needsVideo && (
                  <Form.Item 
                    name="videoPath" 
                    label="视频路径" 
                    required
                    rules={[{ required: true, message: '请选择视频文件' }]}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        value={videoPath}
                        placeholder="请选择视频路径"
                        readOnly
                        style={{ cursor: videoPath ? 'pointer' : 'default' }}
                        onClick={handleVideoPathClick}
                      />
                      <Button icon={<FolderOutlined />} onClick={handleVideoPathSelect} />
                    </Space.Compact>
                  </Form.Item>
                )}
                {needsPublishTime && (
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
                )}
              </>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectForm; 