import React, { useState, useMemo, useEffect } from 'react';
import { Table, Button, Tag, Space, Popconfirm, Input, Image } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, SearchOutlined, PictureOutlined } from '@ant-design/icons';
import { Project, Sku, VideoMaterial } from '../../db';
import { getLastDirectory } from '../../utils/path';
import SkuTags from '../../components/SkuTags';
import MaterialFolderTag from '../../components/MaterialFolderTag';
import VideoFileTag from '../../components/VideoFileTag';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface ProjectTableProps {
  dataSource: Project[];
  materials: VideoMaterial[];
  skus: Sku[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (record: Project) => void;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onTableChange: (pagination: any) => void;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  dataSource,
  materials,
  skus,
  onDelete,
  onEdit,
  pagination,
  onTableChange
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [nameColumnWidth, setNameColumnWidth] = useState(() => {
    const savedWidth = localStorage.getItem('projectTableNameColumnWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 150;
  });

  // 监听 URL 搜索参数变化
  useEffect(() => {
    const searchValue = searchParams.get('search');
    if (searchValue) {
      setSearchText(searchValue);
    }
  }, [searchParams]);

  // 监听列宽变化并保存到 localStorage
  const handleResize = (_: any, { size }: any) => {
    const newWidth = size.width;
    setNameColumnWidth(newWidth);
    localStorage.setItem('projectTableNameColumnWidth', newWidth.toString());
  };

  // 处理搜索文本变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    // 更新 URL 参数
    if (value) {
      navigate(`/projects?search=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate('/projects', { replace: true });
    }
  };

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!searchText) return dataSource;
    
    const searchLower = searchText.toLowerCase();
    return dataSource.filter(video => {
      // 检查视频ID和名字
      if (String(video.id)?.includes(searchLower) || 
          video.name.toLowerCase()?.includes(searchLower)) {
        return true;
      }

      // 检查标签
      if (video.tags?.toLowerCase()?.includes(searchLower)) {
        return true;
      }

      // 检查关联素材
      const relatedMaterials = materials.filter(m => video.materialIds?.includes(m.id as number));
      const materialMatch = relatedMaterials.some(material => 
        String(material.id)?.includes(searchLower) ||
        material.name.toLowerCase()?.includes(searchLower) ||
        getLastDirectory(material.filePath).toLowerCase()?.includes(searchLower)
      );
      if (materialMatch) return true;

      // 检查关联服饰
      const materialSkuIds = new Set<number>();
      relatedMaterials.forEach(material => {
        material.skuIds?.forEach(skuId => materialSkuIds.add(skuId));
      });

      const relatedSkus = skus.filter(sku => materialSkuIds.has(sku.id as number));
      return relatedSkus.some(sku => 
        String(sku.id)?.includes(searchLower) ||
        sku.name.toLowerCase()?.includes(searchLower) ||
        sku.brand.toLowerCase()?.includes(searchLower) ||
        sku.type.toLowerCase()?.includes(searchLower)
      );
    });
  }, [dataSource, materials, skus, searchText]);

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id',
      width: 70,
      fixed: 'left' as const,
      defaultSortOrder: 'ascend' as const,
      sorter: (a, b) => (b.id as number) - (a.id as number)
    },
    { 
      title: (
        <Resizable
          width={nameColumnWidth}
          height={0}
          minConstraints={[150, 0]}
          onResize={handleResize}
        >
          <div>名字</div>
        </Resizable>
      ), 
      fixed: 'left' as const,
      dataIndex: 'name', 
      key: 'name',
      width: nameColumnWidth
    },
    {
      title: '正文',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string) => (
        <div style={{
          fontSize: '12px',
          color: '#8c8c8c',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {text || '-'}
        </div>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string) => (
        <div style={{
          fontSize: '12px',
          color: '#8c8c8c',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {tags || '-'}
        </div>
      )
    },
    { 
      title: '服饰', 
      key: 'skus',
      width: 300,
      render: (_: any, record: Project) => {
        const materialSkuIds = new Set<number>();
        materials
          .filter(m => record.materialIds?.includes(m.id as number))
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
      title: '素材', 
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
                  name={material.name}
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
      title: '封面', 
      dataIndex: 'coverImages', 
      key: 'coverImages',
      width: 90,
      fixed: 'left' as const,
      render: (coverImages: string[]) => {
        if (!coverImages?.length) {
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
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <Image
              src={`file://${encodeURI(coverImages[0])}`}
              alt="封面图片"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                console.error('图片加载失败', e);
              }}
              preview={{
                mask: <div style={{ color: '#fff' }}></div>,
              }}
            />
          </div>
        );
      }
    },
    { 
      title: '状态', 
      dataIndex: 'publishStatus', 
      key: 'publishStatus',
      width: 120,
      filters: [
        { text: '未编辑', value: '未编辑' },
        { text: '编辑中', value: '编辑中' },
        { text: '待发布', value: '待发布' },
        { text: '已发布', value: '已发布' }
      ],
      onFilter: (value: React.Key, record: Project) => 
        record.publishStatus === value,
      render: (status: string) => {
        const colorMap = {
          '未编辑': '#8c8c8c',
          '编辑中': '#1890ff',
          '待发布': '#faad14',
          '已发布': '#52c41a'
        };
        return (
          <span style={{ color: colorMap[status as keyof typeof colorMap] }}>
            {status}
          </span>
        );
      }
    } as ColumnType<Project>,
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
      scroll={{ x: 1400, y: 'calc(100vh - 300px)' }}
      rowKey="id" 
      columns={columns} 
      dataSource={filteredData} 
      style={{ width: '100%', marginTop: 16 }}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条`
      }}
      onChange={onTableChange}
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
              placeholder="搜索ID、名字、标签、关联服饰(ID/名字/品牌/类型)、关联素材(ID/名字/文件夹)"
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              value={searchText}
              onChange={handleSearchChange}
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