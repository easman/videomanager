import React, { useEffect, useState } from 'react';
import { Button, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, VideoMaterial, Sku } from '../../db';
import VideoMaterialsForm from './VideoMaterialsForm';
import VideoMaterialsTable from './VideoMaterialsTable';

const VideoMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<VideoMaterial | undefined>();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

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

  const handleSubmit = async (values: Omit<VideoMaterial, 'id' | 'modifiedTimes'>) => {
    setSubmitting(true);
    try {
      if (formMode === 'edit' && currentMaterial?.id) {
        // 编辑模式
        await db.videoMaterials.update(currentMaterial.id, {
          ...values,
          modifiedTimes: [...(currentMaterial.modifiedTimes || []), new Date().toISOString()]
        });
        message.success('更新成功');
      } else {
        // 新增模式
        await db.videoMaterials.add({
          ...values,
          modifiedTimes: [new Date().toISOString()]
        });
        message.success('添加成功');
      }
      
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error((formMode === 'edit' ? '更新' : '添加') + '失败：' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.videoMaterials.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  const handleEdit = (record: VideoMaterial) => {
    setCurrentMaterial(record);
    setFormMode('edit');
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentMaterial(undefined);
    setFormMode('create');
    setModalVisible(true);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加素材
        </Button>
      </Space>

      <VideoMaterialsTable 
        dataSource={materials}
        skus={skus}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <VideoMaterialsForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        onSubmit={handleSubmit}
        submitting={submitting}
        skus={skus}
        initialData={currentMaterial}
        mode={formMode}
      />
    </div>
  );
};

export default VideoMaterialsPage; 