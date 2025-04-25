import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, DatePicker, message, Card, Space } from 'antd';
import { PlusOutlined, FolderOutlined } from '@ant-design/icons';
import { db, FinalVideo, Sku, VideoMaterial } from '../db';
import dayjs from 'dayjs';

const { Option } = Select;

const FinalVideosPage: React.FC = () => {
  const [finalVideos, setFinalVideos] = useState<FinalVideo[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [selectedMaterialSkus, setSelectedMaterialSkus] = useState<Sku[]>([]);
  const [videoPath, setVideoPath] = useState('');

  const fetchData = async () => {
    const [allFinalVideos, allSkus, allMaterials] = await Promise.all([
      db.finalVideos.toArray(),
      db.skus.toArray(),
      db.videoMaterials.toArray()
    ]);
    setFinalVideos(allFinalVideos);
    setSkus(allSkus);
    setMaterials(allMaterials);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 当选择素材时，自动获取关联的服饰
  const handleMaterialsChange = (selectedMaterialIds: number[]) => {
    const selectedMaterials = materials.filter(m => selectedMaterialIds.includes(m.id));
    const relatedSkuIds = new Set<number>();
    selectedMaterials.forEach(material => {
      material.skuIds?.forEach(skuId => relatedSkuIds.add(skuId));
    });
    
    const relatedSkus = skus.filter(sku => relatedSkuIds.has(sku.id));
    setSelectedMaterialSkus(relatedSkus);
  };

  const handleVideoPathSelect = async () => {
    try {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        setVideoPath(path);
      }
    } catch (error) {
      message.error('选择视频路径失败：' + (error as Error).message);
    }
  };

  const handleAdd = async (values: any) => {
    // 校验发布状态和发布时间
    if (values.publishStatus === '定时发布' && !values.publishTime) {
      message.error('定时发布必须设置发布时间');
      return;
    }

    if (values.publishStatus === '已发布' && !values.publishLink) {
      message.error('已发布状态必须填写发布链接');
      return;
    }

    if (values.publishTime && dayjs(values.publishTime).isBefore(dayjs())) {
      message.error('发布时间不能早于当前时间');
      return;
    }

    if (!values.materialIds?.length) {
      message.error('请至少选择一个视频素材');
      return;
    }

    if (!videoPath) {
      message.error('请选择视频路径');
      return;
    }

    setUploading(true);
    try {
      await db.finalVideos.add({
        ...values,
        materialIds: values.materialIds,
        videoPath,
        publishStatus: values.publishStatus,
        publishTime: values.publishTime ? values.publishTime.format('YYYY-MM-DD HH:mm') : '',
        createdAt: new Date().toISOString(),
      });
      setModalVisible(false);
      form.resetFields();
      setVideoPath('');
      setSelectedMaterialSkus([]);
      fetchData();
      message.success('添加成功');
    } catch (error) {
      message.error('添加失败：' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { 
      title: '关联服饰', 
      key: 'skus',
      render: (_: any, record: FinalVideo) => {
        const materialSkuIds = new Set<number>();
        materials
          .filter(m => record.materialIds.includes(m.id))
          .forEach(material => {
            material.skuIds?.forEach(skuId => materialSkuIds.add(skuId));
          });
        
        return Array.from(materialSkuIds)
          .map(id => skus.find(sku => sku.id === id)?.name)
          .filter(Boolean)
          .join(', ') || '-';
      }
    },
    { 
      title: '关联素材', 
      dataIndex: 'materialIds', 
      key: 'materialIds',
      render: (ids: number[]) => ids?.map(id => 
        materials.find(m => m.id === id)?.name
      ).filter(Boolean).join(', ') || '-'
    },
    { title: '视频路径', dataIndex: 'videoPath', key: 'videoPath' },
    { title: '发布状态', dataIndex: 'publishStatus', key: 'publishStatus' },
    { 
      title: '发布时间', 
      dataIndex: 'publishTime', 
      key: 'publishTime',
      render: (time: string) => time || '-'
    },
    { 
      title: '发布链接', 
      dataIndex: 'publishLink', 
      key: 'publishLink',
      render: (link: string) => link ? 
        <a href={link} target="_blank" rel="noopener noreferrer">{link}</a> : '-'
    },
  ];

  const renderMaterialCard = (material: VideoMaterial) => {
    const relatedSkus = skus.filter(sku => material.skuIds?.includes(sku.id));
    return (
      <Card 
        key={material.id} 
        size="small" 
        title={material.name}
        style={{ marginBottom: 8 }}
      >
        <div>路径: {material.filePath}</div>
        {relatedSkus.length > 0 && (
          <div>
            关联服饰: {relatedSkus.map(sku => `${sku.name} (${sku.type})`).join(', ')}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加成品视频
      </Button>
      <Table rowKey="id" columns={columns} dataSource={finalVideos} style={{ marginTop: 16 }} />
      <Modal
        title="添加成品视频"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setVideoPath('');
          setSelectedMaterialSkus([]);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item 
            name="name" 
            label="名字" 
            rules={[{ required: true, message: '请输入视频名字' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item 
            name="description" 
            label="描述"
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
            >
              {materials.map(material => (
                <Option key={material.id} value={material.id}>
                  {material.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="已选素材详情">
            <Space direction="vertical" style={{ width: '100%' }}>
              {form.getFieldValue('materialIds')?.map((id: number) => {
                const material = materials.find(m => m.id === id);
                return material ? renderMaterialCard(material) : null;
              })}
            </Space>
          </Form.Item>

          {selectedMaterialSkus.length > 0 && (
            <Form.Item label="关联服饰">
              <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                <Space wrap>
                  {selectedMaterialSkus.map(sku => (
                    <span key={sku.id} style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      background: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4
                    }}>
                      {sku.name} ({sku.type} - {sku.brand})
                    </span>
                  ))}
                </Space>
              </div>
            </Form.Item>
          )}

          <Form.Item label="视频路径" required>
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 32px)' }}
                value={videoPath}
                placeholder="请选择视频路径"
                readOnly
              />
              <Button icon={<FolderOutlined />} onClick={handleVideoPathSelect} />
            </Input.Group>
          </Form.Item>

          <Form.Item 
            name="publishStatus" 
            label="发布状态" 
            rules={[{ required: true, message: '请选择发布状态' }]}
          >
            <Select>
              <Option value="未发布">未发布</Option>
              <Option value="已发布">已发布</Option>
              <Option value="定时发布">定时发布</Option>
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
              return (
                <>
                  {publishStatus === '定时发布' && (
                    <Form.Item 
                      name="publishTime" 
                      label="发布时间"
                      rules={[{ required: true, message: '请选择发布时间' }]}
                    >
                      <DatePicker 
                        showTime 
                        style={{ width: '100%' }}
                        disabledDate={current => current && current < dayjs().startOf('day')}
                      />
                    </Form.Item>
                  )}

                  {publishStatus === '已发布' && (
                    <Form.Item 
                      name="publishLink" 
                      label="发布链接"
                      rules={[
                        { required: true, message: '请输入发布链接' },
                        { type: 'url', message: '请输入有效的URL' }
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinalVideosPage; 