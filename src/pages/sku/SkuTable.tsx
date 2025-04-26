import React from 'react';
import { Table } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import { Sku } from '../../db';

interface SkuTableProps {
  dataSource: Sku[];
}

const SkuTable: React.FC<SkuTableProps> = ({ dataSource }) => {
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
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
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '购入时间', dataIndex: 'buyDate', key: 'buyDate' },
    { title: '购入平台', dataIndex: 'buyPlatform', key: 'buyPlatform' },
    { title: '购入价格', dataIndex: 'buyPrice', key: 'buyPrice' },
    { title: '尺码信息', dataIndex: 'sizeInfo', key: 'sizeInfo' },
  ];

  return (
    <Table 
      sticky={true}
      rowKey="id" 
      columns={columns} 
      dataSource={dataSource} 
      style={{ marginTop: 16 }} 
    />
  );
};

export default SkuTable; 