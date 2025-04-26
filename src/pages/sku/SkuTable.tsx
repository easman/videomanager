import React, { useState } from 'react';
import { Table, Button, Popconfirm, message, Modal, Space } from 'antd';
import { PictureOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { Sku } from '../../db';
import { db } from '../../db';

interface SkuTableProps {
  dataSource: Sku[];
  onDataChange: () => void;
  onEdit: (record: Sku) => void;
}

const SkuTable: React.FC<SkuTableProps> = ({ dataSource, onDataChange, onEdit }) => {
  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // 批量操作模式
  const [batchMode, setBatchMode] = useState(false);

  // 添加数据检查
  React.useEffect(() => {
    console.log('SKU数据:', dataSource.map(sku => ({
      id: sku.id,
      name: sku.name,
      returned: sku.returned
    })));
  }, [dataSource]);

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
      const selectedSkus = dataSource.filter(sku => selectedRowKeys.includes(sku.id as number));
      
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
                console.error('图片加载失败', e);
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
        <span style={{ color: returned ? '#ff4d4f' : '#52c41a' }}>
          {returned ? '已退货' : '未退货'}
        </span>
      )
    },
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
      scroll={{ x: 1300 }}
      rowKey="id" 
      columns={columns} 
      dataSource={dataSource}
      rowSelection={batchMode ? rowSelection : undefined}
      onRow={(record) => ({
        onClick: () => {
          if (!batchMode) {
            onEdit(record);  // 非批量操作模式下点击行触发编辑
          }
        },
        style: { cursor: batchMode ? 'default' : 'pointer' }
      })}
      title={() => (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>服饰列表</span>
          <Space>
            <Button
              type={batchMode ? "primary" : "default"}
              icon={<SwapOutlined />}
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedRowKeys([]); // 切换模式时清空选择
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