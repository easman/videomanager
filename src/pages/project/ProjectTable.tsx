import React, { useState, useMemo } from 'react';
import { Table, Button, Tag, Space, Popconfirm, Input } from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Project, Sku, VideoMaterial } from '../../db';
import { getLastDirectory } from '../../utils/path';
import SkuTags from '../../components/SkuTags';
import MaterialFolderTag from '../../components/MaterialFolderTag';
import VideoFileTag from '../../components/VideoFileTag';

interface ProjectTableProps {
  dataSource: Project[];
  materials: VideoMaterial[];
  skus: Sku[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (record: Project) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  dataSource,
  materials,
  skus,
  onDelete,
  onEdit
}) => {
  const [searchText, setSearchText] = useState('');

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!searchText) return dataSource;
    
    const searchLower = searchText.toLowerCase();
    return dataSource.filter(video => {
      // 检查视频ID和名字
      if (String(video.id).includes(searchLower) || 
          video.name.toLowerCase().includes(searchLower)) {
        return true;
      }

      // 检查关联素材
      const relatedMaterials = materials.filter(m => video.materialIds.includes(m.id as number));
      const materialMatch = relatedMaterials.some(material => 
        String(material.id).includes(searchLower) ||
        material.name.toLowerCase().includes(searchLower) ||
        getLastDirectory(material.filePath).toLowerCase().includes(searchLower)
      );
      if (materialMatch) return true;

      // 检查关联服饰
      const materialSkuIds = new Set<number>();
      relatedMaterials.forEach(material => {
        material.skuIds?.forEach(skuId => materialSkuIds.add(skuId));
      });

      const relatedSkus = skus.filter(sku => materialSkuIds.has(sku.id as number));
      return relatedSkus.some(sku => 
        String(sku.id).includes(searchLower) ||
        sku.name.toLowerCase().includes(searchLower) ||
        sku.brand.toLowerCase().includes(searchLower) ||
        sku.type.toLowerCase().includes(searchLower)
      );
    });
  }, [dataSource, materials, skus, searchText]);

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 50,
      ellipsis: true
    },
    { 
      title: '名字', 
      dataIndex: 'name', 
      key: 'name',
      width: 100
    },
    { 
      title: '关联服饰', 
      key: 'skus',
      width: 300,
      render: (_: any, record: Project) => {
        const materialSkuIds = new Set<number>();
        materials
          .filter(m => record.materialIds.includes(m.id as number))
          .forEach(material => {
            material.skuIds?.forEach(skuId => materialSkuIds.add(skuId));
          });
        
        return (
          <SkuTags 
            skuIds={Array.from(materialSkuIds)} 
            skus={skus} 
          />
        );
      }
    },
    { 
      title: '素材文件夹', 
      dataIndex: 'materialIds', 
      key: 'materialIds',
      width: 150,
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
                <MaterialFolderTag 
                  key={id} 
                  filePath={material.filePath} 
                />
              ) : null;
            })}
          </Space>
        </div>
      )
    },
    { 
      title: '视频路径', 
      dataIndex: 'videoPath', 
      key: 'videoPath',
      width: 150,
      render: (videoPath: string) => (
        <div style={{ 
          maxWidth: '100%',
          wordBreak: 'break-all',
          whiteSpace: 'normal'
        }}>
          {videoPath ? <VideoFileTag filePath={videoPath} /> : '-'}
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
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
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
            <span style={{ fontSize: '16px', fontWeight: 500, whiteSpace: 'nowrap' }}>项目列表</span>
            <Input
              placeholder="搜索ID、名字、关联服饰(ID/名字/品牌/类型)、关联素材(ID/名字/文件夹)"
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ maxWidth: '600px' }}
              allowClear
            />
          </div>
        </div>
      )}
    />
  );
};

export default ProjectTable;