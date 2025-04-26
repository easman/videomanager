import React, { useEffect, useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, FinalVideo, Sku, VideoMaterial } from '../../db';
import FinalVideosForm from './FinalVideosForm';
import FinalVideosTable from './FinalVideosTable';
import dayjs from 'dayjs';

const FinalVideosPage: React.FC = () => {
  const [finalVideos, setFinalVideos] = useState<FinalVideo[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const handleAdd = async (values: Omit<FinalVideo, 'id' | 'modifiedTimes'>) => {
    setSubmitting(true);
    try {
      await db.finalVideos.add({
        ...values,
        modifiedTimes: [dayjs().format('YYYY-MM-DD HH:mm:ss')]
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
      await db.finalVideos.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加成品视频
      </Button>

      <FinalVideosTable 
        dataSource={finalVideos}
        materials={materials}
        skus={skus}
        onDelete={handleDelete}
      />

      <FinalVideosForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        onSubmit={handleAdd}
        submitting={submitting}
        materials={materials}
        skus={skus}
      />
    </div>
  );
};

export default FinalVideosPage; 