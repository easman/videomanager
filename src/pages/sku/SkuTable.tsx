import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Popconfirm, message, Modal, Space, Image, Input, Tooltip } from 'antd';
import type { ColumnType } from 'antd/es/table';
import { PictureOutlined, DeleteOutlined, SwapOutlined, EditOutlined, SearchOutlined, LinkOutlined } from '@ant-design/icons';
import { Sku } from '../../db';
import { db } from '../../db';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

interface SkuTableProps {
  dataSource: Sku[];
  onDataChange: () => void;
  onEdit: (record: Sku) => void;
}

interface ReferenceInfo {
  id: number;
  name: string;
}

// 定义可搜索的字段
const SEARCHABLE_FIELDS = ['id', 'name', 'type', 'color', 'brand', 'buyPlatform'] as const;

const SkuTable: React.FC<SkuTableProps> = ({ dataSource, onDataChange, onEdit }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // 批量操作模式
  const [batchMode, setBatchMode] = useState(false);
  // 添加引用次数状态
  const [referenceCountMap, setReferenceCountMap] = useState<Record<number, number>>({});
  const [referenceListMap, setReferenceListMap] = useState<Record<number, ReferenceInfo[]>>({});

  // 监听 URL 搜索参数变化
  useEffect(() => {
    const searchValue = searchParams.get('search');
    if (searchValue) {
      setSearchText(searchValue);
    }
  }, [searchParams]);

  // 处理搜索文本变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    // 更新 URL 参数
    if (value) {
      navigate(`/sku?search=${encodeURIComponent(value)}`, { replace: true });
    } else {
      navigate('/sku', { replace: true });
    }
  };

  // 获取引用次数
  const updateReferenceCounts = async () => {
    const counts: Record<number, number> = {};
    const references: Record<number, ReferenceInfo[]> = {};
    const materials = await db.videoMaterials.toArray();
    
    // 统计每个服饰被引用的次数
    materials.forEach(material => {
      material.skuIds?.forEach(skuId => {
        counts[skuId] = (counts[skuId] || 0) + 1;
        if (!references[skuId]) {
          references[skuId] = [];
        }
        references[skuId].push({
          id: material.id as number,
          name: material.name
        });
      });
    });
    
    setReferenceCountMap(counts);
    setReferenceListMap(references);
  };

  // 在组件挂载和数据源更新时获取引用次数
  useEffect(() => {
    updateReferenceCounts();
  }, [dataSource]);

  // 添加数据检查
  React.useEffect(() => {
    console.log('SKU数据:', dataSource.map(sku => ({
      id: sku.id,
      name: sku.name,
      returned: sku.returned
    })));
  }, [dataSource]);

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (!searchText) return dataSource;
    
    const searchLower = searchText.toLowerCase();
    return dataSource.filter(item => 
      SEARCHABLE_FIELDS.some(field => 
        String(item[field] || '').toLowerCase()?.includes(searchLower)
      )
    );
  }, [dataSource, searchText]);

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

  // 处理批量退货
  const handleBatchReturn = async () => {
    try {
      // 获取选中的SKU记录
      const selectedSkus = dataSource.filter(sku => selectedRowKeys?.includes(sku.id as number));
      
      // 更新每个选中的SKU的退货状态
      await Promise.all(
        selectedSkus.map(sku => 
          db.skus.update(sku.id as number, { returned: true })
        )
      );

      message.success('批量退货操作成功');
      setSelectedRowKeys([]); // 清空选择
      onDataChange(); // 刷新数据
    } catch (error) {
      console.error('批量退货失败:', error);
      message.error('批量退货失败: ' + (error as Error).message);
    }
  };

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
      title: '图片', 
      dataIndex: 'image', 
      key: 'image',
      width: 90,
      fixed: 'left' as const,
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
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <Image
              src={`file://${encodeURI(imagePath)}`}
              alt="服饰图片"
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
    { title: '名字', dataIndex: 'name', key: 'name', width: 150 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '颜色', dataIndex: 'color', key: 'color', width: 100 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100 },
    { title: '购入时间', dataIndex: 'buyDate', key: 'buyDate', width: 120 },
    { title: '购入平台', dataIndex: 'buyPlatform', key: 'buyPlatform', width: 120 },
    { title: '购入价格', dataIndex: 'buyPrice', key: 'buyPrice', width: 100 },
    { title: '尺码信息', dataIndex: 'sizeInfo', key: 'sizeInfo', width: 120 },
    {
      title: '引用次数',
      key: 'referenceCount',
      width: 100,
      filters: [
        { text: '0次', value: '0' },
        { text: '1次', value: '1' },
        { text: '2次', value: '2' },
        { text: '3次', value: '3' },
        { text: '4次及以上', value: '4' }
      ],
      onFilter: (value, record: Sku) => {
        const count = referenceCountMap[record.id as number] || 0;
        const filterValue = Number(value);
        if (filterValue === 4) {
          return count >= 4;
        }
        return count === filterValue;
      },
      render: (_: any, record: Sku) => {
        const count = referenceCountMap[record.id as number] || 0;
        const references = referenceListMap[record.id as number] || [];
        
        return (
          <Tooltip 
            title={
              <div style={{ maxWidth: '300px' }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>引用素材列表：</div>
                {references.map((ref, index) => (
                  <div 
                    key={ref.id}
                    style={{ 
                      cursor: 'pointer',
                      padding: '4px 8px',
                      color: '#fff',
                      borderRadius: 4,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      marginBottom: index === references.length - 1 ? 0 : 4,
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // 使用 navigate 进行跳转并传递搜索参数
                      navigate('/materials?search=' + encodeURIComponent(ref.name));
                    }}
                  >
                    {ref.name}
                  </div>
                ))}
              </div>
            }
            overlayStyle={{ maxWidth: 'none' }}
          >
            <Space>
              <LinkOutlined style={{ color: count > 0 ? '#1890ff' : '#d9d9d9' }} />
              <span>{count}</span>
            </Space>
          </Tooltip>
        );
      },
    } as ColumnType<Sku>,
    { 
      title: '退货状态', 
      dataIndex: 'returned', 
      key: 'returned', 
      width: 100,
      filters: [
        { text: '已退货', value: 'true' },
        { text: '未退货', value: 'false' }
      ],
      onFilter: (value, record: Sku) => {
        // 确保 record.returned 有值，如果是 undefined 则视为 false
        const recordReturned = record.returned ?? false;
        return recordReturned === (value === 'true');
      },
      render: (returned: boolean) => (
        <span style={{ color: returned ? '#DC143C' : '#6495ED' }}>
          {returned ? '已退货' : '未退货'}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Sku) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(record);
            }}
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

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

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
      rowSelection={batchMode ? rowSelection : undefined}
      onRow={(record) => ({
        style: { cursor: 'default' }
      })}
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
            <span style={{ fontSize: '16px', fontWeight: 500, whiteSpace: 'nowrap' }}>服饰列表</span>
            <Input
              placeholder="搜索名字、类型、颜色、品牌、购入平台"
              prefix={<SearchOutlined style={{ color: '#999' }} />}
              value={searchText}
              onChange={handleSearchChange}
              style={{ maxWidth: '400px' }}
              allowClear
            />
          </div>
          <Space>
            <Button
              type={batchMode ? "primary" : "default"}
              icon={<SwapOutlined />}
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedRowKeys([]);
              }}
            >
              {batchMode ? '退出' : '批量退货'}
            </Button>
            
            {batchMode && (
              <Popconfirm
                title="批量退货确认"
                description={`确定将选中的 ${selectedRowKeys.length} 个商品标记为退货吗？`}
                onConfirm={handleBatchReturn}
                okText="确定"
                cancelText="取消"
                disabled={selectedRowKeys.length === 0}
              >
                <Button 
                  type="primary" 
                  danger
                  disabled={selectedRowKeys.length === 0}
                >
                  退货
                </Button>
              </Popconfirm>
            )}
          </Space>
        </div>
      )}
    />
  );
};

export default SkuTable; 