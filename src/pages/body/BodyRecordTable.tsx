import React, { useState } from 'react';
import { Table, Button, Space, Popconfirm, DatePicker } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { BodyRecord } from '../../db';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// 扩展 dayjs 功能
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;

interface BodyRecordTableProps {
  dataSource: BodyRecord[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (record: BodyRecord) => void;
}

const BodyRecordTable: React.FC<BodyRecordTableProps> = ({
  dataSource,
  onDelete,
  onEdit,
}) => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // 过滤后的数据
  const filteredData = React.useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return dataSource;
    
    return dataSource.filter(record => {
      const recordDate = dayjs(record.recordDate);
      return recordDate.isSameOrAfter(dateRange[0], 'day') && 
             recordDate.isSameOrBefore(dateRange[1], 'day');
    });
  }, [dataSource, dateRange]);

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 60,
      fixed: 'left' as const,
      defaultSortOrder: 'ascend' as const,
      sorter: (a, b) => (b.id as number) - (a.id as number)
    },
    { 
      title: '记录日期', 
      dataIndex: 'recordDate', 
      key: 'recordDate',
      width: 120,
      fixed: 'left' as const,
      sorter: (a, b) => a.recordDate.localeCompare(b.recordDate)
    },
    { 
      title: '身高(cm)', 
      dataIndex: 'height', 
      key: 'height',
      width: 100,
      sorter: (a, b) => a.height - b.height
    },
    { 
      title: '体重(斤)', 
      dataIndex: 'weight', 
      key: 'weight',
      width: 100,
      sorter: (a, b) => a.weight - b.weight
    },
    { 
      title: '肩宽(cm)', 
      dataIndex: 'shoulderWidth', 
      key: 'shoulderWidth',
      width: 100,
      sorter: (a, b) => a.shoulderWidth - b.shoulderWidth
    },
    { 
      title: '胸围(cm)', 
      dataIndex: 'chestCircumference', 
      key: 'chestCircumference',
      width: 100,
      sorter: (a, b) => a.chestCircumference - b.chestCircumference
    },
    { 
      title: '腰围(cm)', 
      dataIndex: 'waistCircumference', 
      key: 'waistCircumference',
      width: 100,
      sorter: (a, b) => a.waistCircumference - b.waistCircumference
    },
    { 
      title: '臀围(cm)', 
      dataIndex: 'hipCircumference', 
      key: 'hipCircumference',
      width: 100,
      sorter: (a, b) => a.hipCircumference - b.hipCircumference
    },
    { 
      title: '大腿围(cm)', 
      dataIndex: 'thighCircumference', 
      key: 'thighCircumference',
      width: 100,
      sorter: (a, b) => a.thighCircumference - b.thighCircumference
    },
    { 
      title: '大臂围(cm)', 
      dataIndex: 'armCircumference', 
      key: 'armCircumference',
      width: 100,
      sorter: (a, b) => a.armCircumference - b.armCircumference
    },
    { 
      title: '测量时间', 
      dataIndex: 'measurementTime', 
      key: 'measurementTime',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: BodyRecord) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除吗？"
            description="删除后无法恢复"
            onConfirm={() => onDelete(record.id as number)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <Table 
      sticky={true}
      scroll={{ x: 1400, y: 'calc(100vh - 300px)' }}
      rowKey="id" 
      columns={columns} 
      dataSource={filteredData}
      pagination={{
        showTotal: total => `共 ${total} 条`,
        showSizeChanger: true,
        showQuickJumper: true
      }}
      style={{ width: '100%', marginTop: 16 }}
      title={() => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flex: 1
          }}>
            <span style={{ fontSize: '16px', fontWeight: 500, whiteSpace: 'nowrap' }}>身材记录</span>
            <RangePicker
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              allowClear
              placeholder={['开始日期', '结束日期']}
            />
          </div>
        </div>
      )}
    />
  );
};

export default BodyRecordTable; 