import React, { useState, useMemo } from 'react';
import { Table, Button, Tag, Space, Popconfirm, Modal, Input, message, Tooltip } from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined, LinkOutlined } from '@ant-design/icons';
import { VideoMaterial, Sku, db } from '../../db';
import SkuTags from '../../components/SkuTags';
import MaterialFolderTag from '../../components/MaterialFolderTag';

interface VideoMaterialsTableProps {
  dataSource: VideoMaterial[];
  skus: Sku[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (record: VideoMaterial) => void;
}

const VideoMaterialsTable: React.FC<VideoMaterialsTableProps> = ({
  dataSource,
  skus,
  onDelete,
  onEdit
}) => {
  const [searchText, setSearchText] = useState('');
  const [referenceCountMap, setReferenceCountMap] = useState<Record<number, number>>({});

  // 获取引用次数
  const updateReferenceCounts = async () => {
    const counts: Record<number, number> = {};
    const projects = await db.projects.toArray();
    
    // 统计每个素材被引用的次数
    projects.forEach(project => {
      console.log('updateReferenceCounts project', project.materialIds)
      project.materialIds?.forEach(materialId => {
        counts[materialId] = (counts[materialId] || 0) + 1;
      });
    });
    console.log('updateReferenceCounts counts', counts)
    setReferenceCountMap(counts);
  };

  // 在组件挂载和数据源更新时获取引用次数
  React.useEffect(() => {
    updateReferenceCounts();
  }, [dataSource]);

  const handleOpenFolder = async (folderPath: string) => {
    try {
      const result = await window.electronAPI.openFolder(folderPath);
      if (!result.success) {
        message.error('打开文件夹失败：' + result.message);
      }
    } catch (error) {
      console.error('打开文件夹失败：', error);
    }
  };

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!searchText) return dataSource;
    
    const searchLower = searchText.toLowerCase();
    return dataSource.filter(material => {

      // 搜索ID
      if (String(material.id).includes(searchLower)) {
        return true;
      }

      // 搜索名字
      if (material.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // 搜索文件夹路径
      if (material.filePath.toLowerCase().includes(searchLower)) {
        return true;
      }

      // 搜索关联服饰的信息
      if (material.skuIds?.some(skuId => {
        const sku = skus.find(s => s.id === skuId);
        if (!sku) return false;

        // 搜索服饰 ID
        if (String(skuId).includes(searchLower)) {
          return true;
        }

        // 搜索服饰品牌
        if (sku.brand.toLowerCase().includes(searchLower)) {
          return true;
        }

        // 搜索服饰名字
        if (sku.name.toLowerCase().includes(searchLower)) {
          return true;
        }

        // 搜索服饰类型
        if (sku.type.toLowerCase().includes(searchLower)) {
          return true;
        }

        return false;
      })) {
        return true;
      }

      return false;
    });
  }, [dataSource, skus, searchText]);

  const handleDelete = async (id: number) => {
    try {
      // 检查是否有项目视频引用这个素材
      const referencingVideos = await db.projects
        .filter(video => video.materialIds.includes(id))
        .toArray();

      if (referencingVideos.length > 0) {
        Modal.error({
          title: '无法删除',
          content: (
            <div>
              <p>该素材被以下项目引用，请先删除相关项目：</p>
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
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 50,
      ellipsis: true
    },
    { 
      title: '素材', 
      dataIndex: 'filePath', 
      key: 'filePath',
      width: 150,
      render: (filePath: string, record: VideoMaterial) => (
        <div style={{ 
          maxWidth: '100%',
          wordBreak: 'break-all',
          whiteSpace: 'normal'
        }}>
          <MaterialFolderTag 
            filePath={filePath}
            name={record.name}
          />
        </div>
      )
    },
    { 
      title: '关联服饰', 
      dataIndex: 'skuIds', 
      key: 'skuIds',
      width: 300,
      render: (skuIds: number[]) => (
        <SkuTags skuIds={skuIds} skus={skus} />
      )
    },
    {
      title: '引用次数',
      key: 'referenceCount',
      width: 100,
      render: (_: any, record: VideoMaterial) => {
        const count = referenceCountMap[record.id as number] || 0;
        return (
          <Tooltip>
            <Space>
              <LinkOutlined style={{ color: count > 0 ? '#1890ff' : '#d9d9d9' }} />
              <span>{count}</span>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: VideoMaterial) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            查看
          </Button>
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
        </Space>
      ),
    }
  ];

  return (
    <Table 
      sticky={true}
      scroll={{ x: 1200 }}
      rowKey="id" 
      columns={columns} 
      dataSource={filteredData}
      style={{ marginTop: 16 }}
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
            <span style={{ fontSize: '16px', fontWeight: 500, whiteSpace: 'nowrap' }}>素材列表</span>
            <Input
              placeholder="搜索名字、文件夹路径、关联服饰的ID、品牌、名字、类型"
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ maxWidth: '400px' }}
              allowClear
            />
          </div>
        </div>
      )}
    />
  );
};

export default VideoMaterialsTable; 