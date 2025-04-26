import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, VideoMaterial, Sku } from '../../db';
import VideoMaterialsForm from './VideoMaterialsForm';
import VideoMaterialsTable from './VideoMaterialsTable';

const VideoMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleAdd = async (values: Omit<VideoMaterial, 'id' | 'modifiedTimes'>) => {
    setSubmitting(true);
    try {
      await db.videoMaterials.add({
        ...values,
        modifiedTimes: [new Date().toISOString()]
      });
      
      message.success('添加成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('添加失败：' + (error as Error).message);
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

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加素材
      </Button>

      <VideoMaterialsTable 
        dataSource={materials}
        skus={skus}
        onDelete={handleDelete}
      />

      <VideoMaterialsForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        onSubmit={handleAdd}
        submitting={submitting}
        skus={skus}
      />
    </div>
  );
};

export default VideoMaterialsPage; 