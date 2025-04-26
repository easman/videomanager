import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Space, Tooltip } from 'antd';
import { PlusOutlined, FolderOutlined, SwapOutlined } from '@ant-design/icons';
import { db, FinalVideo, Sku, VideoMaterial } from '../db';
import dayjs from 'dayjs';
import { getLastDirectory, getFileNameWithoutExtension } from '../utils/path';
import { useForm } from 'antd/es/form/Form';

const { Option } = Select;

const FinalVideosPage: React.FC = () => {
  const [finalVideos, setFinalVideos] = useState<FinalVideo[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = useForm();
  const [uploading] = useState(false);
  const [selectedMaterialSkus, setSelectedMaterialSkus] = useState<Sku[]>([]);
  const [videoPath, setVideoPath] = useState('');
  const [customName, setCustomName] = useState('');
  const [usingVideoName, setUsingVideoName] = useState(true);

  const fetchData = async () => {
    const [allFinalVideos, allSkus, allMaterials] = await Promise.all([
      db.finalVideos.toArray(),
      db.skus.toArray(),
      db.videoMaterials.toArray()
    ]);
    setFinalVideos(allFinalVideos.filter((video): video is FinalVideo => video.id !== undefined));
    setSkus(allSkus);
    setMaterials(allMaterials);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 当选择素材时，自动获取关联的服饰
  const handleMaterialsChange = (selectedMaterialIds: number[]) => {
    const selectedMaterials = materials.filter(m => selectedMaterialIds.includes(m.id as number));
    const relatedSkuIds = new Set<number>();
    selectedMaterials.forEach(material => {
      material.skuIds?.forEach(skuId => relatedSkuIds.add(skuId));
    });
    
    const relatedSkus = skus.filter(sku => relatedSkuIds.has(sku.id as number));
    setSelectedMaterialSkus(relatedSkus);
  };

  const handleVideoPathSelect = async () => {
    try {
      const path = await window.electronAPI.selectFile();
      if (path) {
        // 使用不带扩展名的文件名
        const videoNameWithoutExt = getFileNameWithoutExtension(path);
        setVideoPath(path);
        // 将视频路径设置到表单
        form.setFieldsValue({ videoPath: path });
        
        // 如果名称未填写，自动使用不带扩展名的视频文件名
        if (!form.getFieldValue('name')) {
          form.setFieldsValue({ name: videoNameWithoutExt });
          setUsingVideoName(true);
        }
      }
    } catch (error) {
      message.error('选择视频文件失败：' + (error as Error).message);
    }
  };

  const toggleName = () => {
    const currentName = form.getFieldValue('name');
    // 使用不带扩展名的文件名
    const videoNameWithoutExt = getFileNameWithoutExtension(videoPath);
    
    if (usingVideoName) {
      // 切换到自定义名称
      form.setFieldsValue({ name: customName });
      setUsingVideoName(false);
    } else {
      // 切换到视频文件名（不带扩展名）
      setCustomName(currentName); // 保存当前的自定义名称
      form.setFieldsValue({ name: videoNameWithoutExt });
      setUsingVideoName(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    // 使用不带扩展名的文件名进行比较
    const videoNameWithoutExt = getFileNameWithoutExtension(videoPath);
    setUsingVideoName(newName === videoNameWithoutExt);
    if (!usingVideoName) {
      setCustomName(newName);
    }
  };

  const resetModal = () => {
    setIsModalVisible(false);
    setVideoPath('');
    setSelectedMaterialSkus([]);
    setCustomName('');
    setUsingVideoName(true);
    form.resetFields();
  };

  interface AddVideoFormValues {
    name: string; 
    description?: string;
    materialIds: number[];
    videoPath: string;
    publishStatus:  '待编辑' | '编辑中' | '已发布';
    publishTime?: string;
    extraInfo?: string;
  }

  const handleAdd = async (values: AddVideoFormValues) => {
    try {
      if (!values.materialIds || values.materialIds.length === 0) {
        message.error('请选择关联素材');
        return;
      }

      if (!values.videoPath) {
        message.error('请选择视频文件');
        return;
      }

      const newVideo: Omit<FinalVideo, 'id'> = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        materialIds: values.materialIds,
        videoPath: values.videoPath,
        publishStatus: values.publishStatus,
        publishTime: values.publishTime ? dayjs(values.publishTime).format('YYYY-MM-DD HH:mm:ss') : undefined,
        extraInfo: values.extraInfo?.trim() || '',
        modifiedTimes: [dayjs().format('YYYY-MM-DD HH:mm:ss')]
      };

      await db.finalVideos.add(newVideo);
      message.success('添加成功');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('添加失败');
      console.error(error);
    }
  };

  const columns = [
    { 
      title: '名字', 
      dataIndex: 'name', 
      key: 'name',
      width: 200,
      ellipsis: true
    },
    { 
      title: '关联服饰', 
      key: 'skus',
      width: 300,
      render: (_: any, record: FinalVideo) => {
        const materialSkuIds = new Set<number>();
        materials
          .filter(m => record.materialIds.includes(m.id as number))
          .forEach(material => {
            material.skuIds?.forEach(skuId => materialSkuIds.add(skuId));
          });
        
        return (
          <div style={{ 
            maxWidth: '100%', 
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            <Space wrap size={[0, 8]}>
              {Array.from(materialSkuIds)
                .map(id => skus.find(sku => sku.id === id))
                .filter(Boolean)
                .map(sku => (
                  <Tag 
                    key={sku!.id}
                    style={{ 
                      maxWidth: '100%',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}
                  >
                    【{sku!.brand}】{sku!.name}（{sku!.type}）
                  </Tag>
                ))}
            </Space>
          </div>
        );
      }
    },
    { 
      title: '关联素材', 
      dataIndex: 'materialIds', 
      key: 'materialIds',
      width: 250,
      render: (ids: number[]) => (
        <div style={{ 
          maxWidth: '100%', 
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}>
          <Space wrap size={[0, 8]}>
            {ids?.map(id => {
              const material = materials.find(m => m.id === id);
              return material ? (
                <Tag 
                  key={id}
                  style={{ 
                    maxWidth: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}
                >
                  {getLastDirectory(material.filePath)}
                </Tag>
              ) : null;
            })}
          </Space>
        </div>
      )
    },
    { 
      title: '发布状态', 
      dataIndex: 'publishStatus', 
      key: 'publishStatus',
      width: 120
    },
    { 
      title: '发布时间', 
      dataIndex: 'publishTime', 
      key: 'publishTime',
      width: 180,
      render: (time: string | undefined) => time || '-'
    }
  ];

  const renderNameLabel = () => {
    if (!videoPath) return '名字';

    const showSwitch = videoPath;

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
            {usingVideoName ? '使用自定义名' : '使用视频文件名'}
          </Button>
        )}
      </Space>
    );
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
        添加成品视频
      </Button>
      <Table sticky={true} rowKey="id" columns={columns} dataSource={finalVideos} style={{ marginTop: 16 }} />
      <Modal
        maskClosable={false}
        title="添加成品视频"
        open={isModalVisible}
        onCancel={resetModal}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
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
                getValueFromEvent={e => e.target.value.trim()}
              >
                <Input 
                  placeholder="请输入视频名字" 
                  onChange={handleNameChange}
                />
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item 
            name="description" 
            label="描述"
            getValueFromEvent={e => e.target.value.trim()}
          >
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

          <Form.Item 
            name="extraInfo" 
            label="额外信息"
            getValueFromEvent={e => e.target.value.trim()}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item 
            name="publishStatus" 
            label="发布状态" 
            rules={[{ required: true, message: '请选择发布状态' }]}
            initialValue="待编辑"
          >
            <Select
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                if (!option?.children) return false;
                return String(option.children)
                  .toLowerCase()
                  .includes(input.toLowerCase());
              }}
            >
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
    </div>
  );
};

export default FinalVideosPage; 