import React, { useEffect, useState } from 'react';
import { Button, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, Project, Sku, VideoMaterial } from '../../db';
import ProjectForm from './ProjectForm';
import ProjectTable from './ProjectTable';
import dayjs from 'dayjs';

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [materials, setMaterials] = useState<VideoMaterial[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | undefined>();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');


  const fetchData = async () => {
    const [allProjects, allSkus, allMaterials] = await Promise.all([
      db.projects.toArray(),
      db.skus.toArray(),
      db.videoMaterials.toArray()
    ]);
    setProjects(allProjects.filter((project): project is Project => project.id !== undefined));
    setSkus(allSkus);
    setMaterials(allMaterials);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values: Omit<Project, 'id' | 'modifiedTimes'>, id?: number) => {
    setSubmitting(true);
    try {
      // 处理封面图片保存
      const savedCoverImages = await Promise.all(
        (values?.coverImages || []).map(async (img) => {
          if (img.startsWith('data:')) {
            const result = await window.electronAPI.saveImage(img);
            if (!result.success) {
              throw new Error('保存封面图片失败：' + result.message);
            }
            return result.path;
          }
          return img;
        })
      );

      if (id) {
        // 编辑模式
        const currentProject = await db.projects.get(id);
        if (!currentProject) {
          throw new Error('项目不存在');
        }
        
        await db.projects.update(id, {
          ...values,
          coverImages: savedCoverImages,
          modifiedTimes: [...currentProject.modifiedTimes, dayjs().format('YYYY-MM-DD HH:mm:ss')]
        });
        message.success('更新成功');
      } else {
        // 新增模式
        await db.projects.add({
          ...values,
          coverImages: savedCoverImages,
          modifiedTimes: [dayjs().format('YYYY-MM-DD HH:mm:ss')]
        });
        message.success('添加成功');
      }
      
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error((id ? '更新' : '添加') + '失败：' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: Project) => {
    setCurrentProject(record);
    setFormMode('edit');
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentProject(undefined);
    setFormMode('create');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await db.projects.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加项目
        </Button>
      </Space>

      <ProjectTable 
        dataSource={projects}
        materials={materials}
        skus={skus}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <ProjectForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        onSubmit={handleSubmit}
        submitting={submitting}
        materials={materials}
        skus={skus}
        initialData={currentProject}
        mode={formMode}
      />
    </div>
  );
};

export default ProjectsPage; 