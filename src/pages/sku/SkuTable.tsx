import React from 'react';
import { Table, Button, Popconfirm, message, Modal } from 'antd';
import { PictureOutlined, DeleteOutlined } from '@ant-design/icons';
import { Sku } from '../../db';
import { db } from '../../db';

interface SkuTableProps {
  dataSource: Sku[];
  onDataChange: () => void;
}

const SkuTable: React.FC<SkuTableProps> = ({ dataSource, onDataChange }) => {
  const handleDelete = async (id: number) => {
    try {
      // 检查是否有视频素材引用这个服饰
      const referencingMaterials = await db.videoMaterials
        .filter(material => material.skuIds?.includes(id))
        .toArray();

      if (referencingMaterials.length > 0) {
        Modal.error({
          title: '无法删除',
          content: (
            <div>
              <p>该服饰被以下视频素材引用，请先删除相关视频素材：</p>
              <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                {referencingMaterials.map(material => (
                  <li key={material.id}>{material.name}</li>
                ))}
              </ul>
            </div>
          ),
          width: 500
        });
        return;
      }

      // 执行删除
      await db.skus.delete(id);
      message.success('删除成功');
      onDataChange();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败: ' + (error as Error).message);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { 
      title: '图片', 
      dataIndex: 'image', 
      key: 'image',
      width: 90, 
      render: (imagePath: string) => {
        if (!imagePath) {
          return (
            <div style={{ 
              width: 60, 
              height: 60, 
              background: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '4px',
              color: '#ccc'
            }}>
              <PictureOutlined style={{ fontSize: 24 }} />
            </div>
          );
        }

        return (
          <div 
            style={{ 
              width: 60,
              height: 60,
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <img 
              src={`file://${encodeURI(imagePath)}`}
              alt="服饰图片" 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                console.log('图片加载失败', e);
              }}
            />
          </div>
        );
      }
    },
    { title: '名字', dataIndex: 'name', key: 'name', width: 150 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '颜色', dataIndex: 'color', key: 'color', width: 100 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100 },
    { title: '购入时间', dataIndex: 'buyDate', key: 'buyDate', width: 120 },
    { title: '购入平台', dataIndex: 'buyPlatform', key: 'buyPlatform', width: 120 },
    { title: '购入价格', dataIndex: 'buyPrice', key: 'buyPrice', width: 100 },
    { title: '尺码信息', dataIndex: 'sizeInfo', key: 'sizeInfo', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: Sku) => (
        <Popconfirm
          title="确定删除吗？"
          description="删除后无法恢复"
          onConfirm={() => handleDelete(record.id as number)}
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
      ),
    }
  ];

  return (
    <Table 
      sticky={true}
      scroll={{ x: 1300 }}
      rowKey="id" 
      columns={columns} 
      dataSource={dataSource} 
      style={{ marginTop: 16 }} 
    />
  );
};

export default SkuTable; 