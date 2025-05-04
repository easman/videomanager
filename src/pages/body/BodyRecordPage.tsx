import React, { useEffect, useState } from 'react';
import { Button, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, BodyRecord } from '../../db';
import BodyRecordForm from './BodyRecordForm';
import BodyRecordTable from './BodyRecordTable';
import dayjs from 'dayjs';

const BodyRecordPage: React.FC = () => {
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<BodyRecord | undefined>();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchData = async () => {
    const allRecords = await db.bodyRecords.toArray();
    setRecords(allRecords.filter((record): record is BodyRecord => record.id !== undefined));
    setPagination(prev => ({
      ...prev,
      total: allRecords.length
    }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (values: Omit<BodyRecord, 'id'>, id?: number) => {
    setSubmitting(true);
    try {
      if (id) {
        // 编辑模式
        await db.bodyRecords.update(id, values);
        message.success('更新成功');
      } else {
        // 新增模式
        await db.bodyRecords.add(values);
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

  const handleEdit = (record: BodyRecord) => {
    setCurrentRecord(record);
    setFormMode('edit');
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentRecord(undefined);
    setFormMode('create');
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await db.bodyRecords.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加记录
        </Button>
      </Space>

      <BodyRecordTable 
        dataSource={records}
        onDelete={handleDelete}
        onEdit={handleEdit}
        pagination={pagination}
        onTableChange={handleTableChange}
      />

      <BodyRecordForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        onSubmit={handleSubmit}
        submitting={submitting}
        initialData={currentRecord}
        mode={formMode}
      />
    </div>
  );
};

export default BodyRecordPage; 