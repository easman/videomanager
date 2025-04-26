import React from 'react';
import { Table, Button, Tag, Space, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { FinalVideo, Sku, VideoMaterial } from '../../db';
import { getLastDirectory } from '../../utils/path';

interface FinalVideosTableProps {
  dataSource: FinalVideo[];
  materials: VideoMaterial[];
  skus: Sku[];
  onDelete: (id: number) => Promise<void>;
}

const FinalVideosTable: React.FC<FinalVideosTableProps> = ({
  dataSource,
  materials,
  skus,
  onDelete
}) => {
  const columns = [
    { 
      title: '名字', 
      dataIndex: 'name', 
      key: 'name',
      width: 200,
      ellipsis: true
    },
    { 
      title: '关联服饰', 
      key: 'skus',
      width: 300,
      render: (_: any, record: FinalVideo) => {
        const materialSkuIds = new Set<number>();
        materials
          .filter(m => record.materialIds.includes(m.id as number))
          .forEach(material => {
            material.skuIds?.forEach(skuId => materialSkuIds.add(skuId));
          });
        
        return (
          <div style={{ 
            maxWidth: '100%', 
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            <Space wrap size={[0, 8]}>
              {Array.from(materialSkuIds)
                .map(id => skus.find(sku => sku.id === id))
                .filter(Boolean)
                .map(sku => (
                  <Tag 
                    key={sku!.id}
                    style={{ 
                      maxWidth: '100%',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word'
                    }}
                  >
                    【{sku!.brand}】{sku!.name}（{sku!.type}）
                  </Tag>
                ))}
            </Space>
          </div>
        );
      }
    },
    { 
      title: '关联素材', 
      dataIndex: 'materialIds', 
      key: 'materialIds',
      width: 250,
      render: (ids: number[]) => (
        <div style={{ 
          maxWidth: '100%', 
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}>
          <Space wrap size={[0, 8]}>
            {ids?.map(id => {
              const material = materials.find(m => m.id === id);
              return material ? (
                <Tag 
                  key={id}
                  style={{ 
                    maxWidth: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}
                >
                  {getLastDirectory(material.filePath)}
                </Tag>
              ) : null;
            })}
          </Space>
        </div>
      )
    },
    { 
      title: '发布状态', 
      dataIndex: 'publishStatus', 
      key: 'publishStatus',
      width: 120
    },
    { 
      title: '发布时间', 
      dataIndex: 'publishTime', 
      key: 'publishTime',
      width: 180,
      render: (time: string | undefined) => time || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: FinalVideo) => (
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
      ),
    }
  ];

  return (
    <Table 
      sticky={true} 
      scroll={{ x: 1200 }}
      rowKey="id" 
      columns={columns} 
      dataSource={dataSource} 
      style={{ marginTop: 16 }} 
    />
  );
};

export default FinalVideosTable;