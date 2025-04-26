import React, { useState, useEffect } from 'react';
import { Space, Tag, Tooltip, Image } from 'antd';
import { Sku } from '../db';

interface SkuTagsProps {
  skuIds: number[];
  skus: Sku[];
  style?: React.CSSProperties;
  onClose?: (skuId: number) => void;
}

const SkuTags: React.FC<SkuTagsProps> = ({
  skuIds,
  skus,
  style,
  onClose
}) => {
  const [imagesDir, setImagesDir] = useState<string>('');

  // 获取图片目录
  useEffect(() => {
    const getImagesDir = async () => {
      const dir = await window.electronAPI.getAppImagesDir();
      setImagesDir(dir);
    };
    getImagesDir();
  }, []);

  if (!skuIds?.length) return null;

  const renderSkuDetail = (sku: Sku) => {
    // 处理图片路径
    const imagePath = sku.image ? `${imagesDir}/${sku.image}` : '';
    console.log('imagePath', imagePath)
    return (
      <div style={{ maxWidth: '300px' }}>
        {imagePath && (
          <div style={{ marginBottom: 12 }}>
            <Image 
              src={`file://${encodeURI(imagePath)}`}
              alt={sku.name}
              style={{ 
                maxWidth: '100%',
                maxHeight: '100px',
                objectFit: 'contain',
                borderRadius: 4
              }}
              onError={(e) => {
                console.error('图片加载失败', e);
              }}
              preview={{
                mask: <div style={{ color: '#fff' }}></div>,
              }}
            />
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          {sku.name}
        </div>
        <div style={{ fontSize: 14 }}>
          <div><strong>ID:</strong> {sku.id}</div>
          <div><strong>品牌:</strong> {sku.brand}</div>
          <div><strong>类型:</strong> {sku.type}</div>
          <div><strong>颜色:</strong> {sku.color}</div>
          <div><strong>尺码:</strong> {sku.sizeInfo || '-'}</div>
          <div><strong>购买平台:</strong> {sku.buyPlatform || '-'}</div>
          <div><strong>购买日期:</strong> {sku.buyDate || '-'}</div>
          <div><strong>购买价格:</strong> {sku.buyPrice ? `¥${sku.buyPrice}` : '-'}</div>
          <div style={{ 
            color: sku.returned ? '#ff7875' : '#95de64',
            marginTop: 4
          }}>
            <strong>{sku.returned ? '已退货' : '未退货'}</strong>
          </div>
          {sku.extraInfo && (
            <div style={{ marginTop: 4 }}>
              <strong>备注:</strong> {sku.extraInfo}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      maxWidth: '100%', 
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      ...style
    }}>
      <Space wrap size={[0, 8]}>
        {skuIds.map(id => {
          const sku = skus.find(s => s.id === id);
          if (!sku) return null;
          
          return (
            <Tooltip 
              key={id}
              title={renderSkuDetail(sku)}
              placement="topLeft"
              mouseEnterDelay={0.5}
              overlayStyle={{ maxWidth: '400px' }}
            >
              <Tag 
                style={{ 
                  maxWidth: '100%',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word'
                }}
                closable={!!onClose}
                onClose={onClose ? () => onClose(id) : undefined}
                color={sku.returned ? 'error' : 'success'}
              >
                [{sku.id}]【{sku.brand}】{sku.name}（{sku.type}）
              </Tag>
            </Tooltip>
          );
        })}
      </Space>
    </div>
  );
};

export default SkuTags; 