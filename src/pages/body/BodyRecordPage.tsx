import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, BodyRecord } from '../../db';
import BodyRecordTable from './BodyRecordTable';
import BodyRecordForm from './BodyRecordForm';

const BodyRecordPage: React.FC = () => {
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BodyRecord>();

  // 加载数据
  const loadData = async () => {
    const data = await db.bodyRecords.toArray();
    setRecords(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理添加/编辑提交
  const handleSubmit = async (values: Omit<BodyRecord, 'id' | 'modifiedTimes'>) => {
    try {
      setSubmitting(true);
      const now = new Date().toISOString();

      if (editingRecord) {
        // 编辑模式
        await db.bodyRecords.update(editingRecord.id as number, {
          ...values,
          modifiedTimes: [...editingRecord.modifiedTimes, now]
        });
        message.success('编辑成功');
      } else {
        // 新增模式
        await db.bodyRecords.add({
          ...values,
          modifiedTimes: [now]
        });
        message.success('添加成功');
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      await db.bodyRecords.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  // 处理编辑
  const handleEdit = (record: BodyRecord) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // 处理添加按钮点击
  const handleAdd = () => {
    setEditingRecord(undefined);
    setModalVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加记录
        </Button>
      </div>

      <BodyRecordTable
        dataSource={records}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <BodyRecordForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        onSubmit={handleSubmit}
        submitting={submitting}
        initialData={editingRecord}
        mode={editingRecord ? 'edit' : 'create'}
      />
    </div>
  );
};

export default BodyRecordPage; 