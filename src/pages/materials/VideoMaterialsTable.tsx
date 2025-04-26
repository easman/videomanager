import React from 'react';
import { Table, Button, Tag, Space, Popconfirm, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { VideoMaterial, Sku, db } from '../../db';
import { getLastDirectory } from '../../utils/path';

interface VideoMaterialsTableProps {
  dataSource: VideoMaterial[];
  skus: Sku[];
  onDelete: (id: number) => Promise<void>;
}

const VideoMaterialsTable: React.FC<VideoMaterialsTableProps> = ({
  dataSource,
  skus,
  onDelete
}) => {
  const handleDelete = async (id: number) => {
    try {
      // 检查是否有成品视频引用这个素材
      const referencingVideos = await db.finalVideos
        .filter(video => video.materialIds.includes(id))
        .toArray();

      if (referencingVideos.length > 0) {
        Modal.error({
          title: '无法删除',
          content: (
            <div>
              <p>该素材被以下成品视频引用，请先删除相关成品视频：</p>
              <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                {referencingVideos.map(video => (
                  <li key={video.id}>{video.name}</li>
                ))}
              </ul>
            </div>
          ),
          width: 500
        });
        return;
      }

      await onDelete(id);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const columns = [
    { 
      title: '名字', 
      dataIndex: 'name', 
      key: 'name',
      width: 200,
      ellipsis: true
    },
    { 
      title: '文件夹路径', 
      dataIndex: 'filePath', 
      key: 'filePath',
      width: 200,
      render: (filePath: string) => (
        <Tag>{getLastDirectory(filePath)}</Tag>
      )
    },
    { 
      title: '关联服饰', 
      dataIndex: 'skuIds', 
      key: 'skuIds',
      render: (skuIds: number[]) => (
        <div style={{ 
          maxWidth: '100%', 
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}>
          <Space wrap size={[0, 8]}>
            {skuIds?.map(id => {
              const sku = skus.find(s => s.id === id);
              return sku ? (
                <Tag 
                  key={id}
                  style={{ 
                    maxWidth: '100%',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}
                >
                  【{sku.brand}】{sku.name}（{sku.type}）
                </Tag>
              ) : null;
            })}
          </Space>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: VideoMaterial) => (
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
      scroll={{ x: 1000 }}
      rowKey="id" 
      columns={columns} 
      dataSource={dataSource} 
      style={{ marginTop: 16 }} 
    />
  );
};

export default VideoMaterialsTable; 