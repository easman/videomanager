import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Upload, AutoComplete, InputNumber, message, Progress, Spin } from 'antd';
import { PlusOutlined, UploadOutlined, InboxOutlined, LoadingOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { db, Sku } from '../db';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface ImageProcessingStatus {
  processing: boolean;
  progress: number;
  statusText: string;
}

const SkuPage: React.FC = () => {
  const [clothes, setClothes] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePath, setImagePath] = useState<string>('');
  const [typeOptions, setTypeOptions] = useState<{ value: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<{ value: string }[]>([]);
  const [platformOptions, setPlatformOptions] = useState<{ value: string }[]>([]);
  const [imageStatus, setImageStatus] = useState<ImageProcessingStatus>({
    processing: false,
    progress: 0,
    statusText: ''
  });
  
  // 用于图片粘贴
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  
  // 添加缓存引用
  const imageCache = useRef<Map<string, string>>(new Map());

  const fetchClothes = async () => {
    try {
      const all = await db.skus.toArray();
      
      // 预处理所有图片路径
      const processedClothes = all.map(item => ({
        ...item,
        image: item.image ? (imageCache.current.get(item.image) || item.image) : ''
      }));
      
      setClothes(processedClothes);
      
      // 获取所有已存在的类型、品牌和平台，并去重
      const types = Array.from(new Set(all.map(item => item.type))).filter(Boolean);
      const brands = Array.from(new Set(all.map(item => item.brand))).filter(Boolean);
      const platforms = Array.from(new Set(all.map(item => item.buyPlatform))).filter(Boolean);
      
      setTypeOptions(types.map(type => ({ value: type })));
      setBrandOptions(brands.map(brand => ({ value: brand })));
      setPlatformOptions(platforms.map(platform => ({ value: platform })));
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    }
  };

  useEffect(() => {
    fetchClothes();
    
    // 清理函数
    return () => {
      if (pasteAreaRef.current) {
        pasteAreaRef.current.removeEventListener('paste', handlePaste);
      }
      // 清理图片缓存
      imageCache.current.clear();
    };
  }, []);
  
  // 当模态框显示或隐藏时，添加或移除粘贴事件监听器
  useEffect(() => {
    if (modalVisible && pasteAreaRef.current) {
      pasteAreaRef.current.addEventListener('paste', handlePaste);
      // 自动聚焦粘贴区域
      setTimeout(() => {
        pasteAreaRef.current?.focus();
      }, 300);
    }
    return () => {
      if (pasteAreaRef.current) {
        pasteAreaRef.current.removeEventListener('paste', handlePaste);
      }
    };
  }, [modalVisible]);

  // 处理粘贴事件
  const handlePaste = (e: ClipboardEvent) => {
    if (!e.clipboardData) return;
    
    // 检查是否有图片
    const items = e.clipboardData.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          processImageFile(blob);
          break;
        }
      }
    }
  };

  const handleAdd = async (values: any) => {
    try {
      console.log('表单提交值:', values);
      setUploading(true);
      
      // 再次确保所有文本字段都经过trim处理
      const trimValues = { ...values };
      
      // 基本字段trim处理，处理可能为undefined的情况
      if (trimValues.name) trimValues.name = String(trimValues.name).trim();
      if (trimValues.type) trimValues.type = String(trimValues.type).trim();
      if (trimValues.brand) trimValues.brand = String(trimValues.brand).trim();
      if (trimValues.buyPlatform) trimValues.buyPlatform = String(trimValues.buyPlatform).trim();
      if (trimValues.sizeInfo) trimValues.sizeInfo = String(trimValues.sizeInfo).trim();
      if (trimValues.extraInfo) trimValues.extraInfo = String(trimValues.extraInfo).trim();
      
      // 必要字段验证
      if (!trimValues.name) {
        message.error('请输入服饰名字');
        setUploading(false);
        return;
      }
      
      if (!trimValues.type) {
        message.error('请输入类型');
        setUploading(false);
        return;
      }
      
      if (!trimValues.buyDate) {
        message.error('请选择购入时间');
        setUploading(false);
        return;
      }
      
      // 图片处理
      let finalImagePath = '';
      
      if (imageUrl) {
        const saveResult = await window.electronAPI.saveImage(imageUrl);
        console.log('saveResult', saveResult);
        if (!saveResult.success) {
          message.error(`图片保存失败: ${saveResult.message}`);
          setUploading(false);
          return;
        }
        finalImagePath = saveResult.path;
      }

      const newSku: Omit<Sku, 'id'> = {
        name: trimValues.name,
        type: trimValues.type,
        brand: trimValues.brand || '',
        buyPlatform: trimValues.buyPlatform || '',
        sizeInfo: trimValues.sizeInfo || '',
        extraInfo: trimValues.extraInfo || '',
        image: finalImagePath,
        buyDate: trimValues.buyDate.format('YYYY-MM-DD'),
        buyPrice: trimValues.buyPrice || 0,
        modifiedTimes: [new Date().toISOString()],
      };
      
      // Dexie 会自动处理自增 ID
      await db.skus.add(newSku);
      
      setUploading(false);
      setModalVisible(false);
      resetForm();
      fetchClothes();
      message.success('添加成功');
    } catch (error) {
      console.error('添加失败:', error);
      message.error('添加失败: ' + (error as Error).message);
      setUploading(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setImageUrl('');
    setImagePath('');
    setImageStatus({
      processing: false,
      progress: 0,
      statusText: ''
    });
  };

  // 处理上传图片
  const handleImageUpload = async (info: any) => {
    if (info.file.status === 'uploading') {
      setImageStatus({
        processing: true,
        progress: 30,
        statusText: '处理中...'
      });
      return;
    }
    
    if (info.file.originFileObj) {
      processImageFile(info.file.originFileObj);
    }
  };

  // 处理图片文件
  const processImageFile = (file: File | Blob) => {
    setImageStatus({
      processing: true,
      progress: 30,
      statusText: '读取图片...'
    });
    
    const reader = new FileReader();
    
    reader.onloadstart = () => {
      setImageStatus({
        processing: true,
        progress: 10,
        statusText: '开始读取图片...'
      });
    };
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentLoaded = Math.round((e.loaded / e.total) * 50); // 读取过程占50%
        setImageStatus({
          processing: true,
          progress: percentLoaded,
          statusText: `读取图片: ${percentLoaded}%`
        });
      }
    };
    
    reader.onerror = () => {
      setImageStatus({
        processing: false,
        progress: 0,
        statusText: '读取图片失败'
      });
      message.error('读取图片失败');
    };
    
    reader.onload = async (e) => {
      try {
        setImageStatus({
          processing: true,
          progress: 70,
          statusText: '处理图片...'
        });
        
        const dataUrl = e.target?.result as string;
        console.log('dataUrl', dataUrl);
        setImageUrl(dataUrl);
        
        setImageStatus({
          processing: false,
          progress: 100,
          statusText: '图片加载完成'
        });
      } catch (error) {
        setImageStatus({
          processing: false,
          progress: 0,
          statusText: '处理图片失败'
        });
        message.error('处理图片失败: ' + (error as Error).message);
      }
    };
    
    reader.readAsDataURL(file);
  };

  // 图片拖拽上传配置
  const draggerProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    accept: 'image/*',
    beforeUpload: (file) => {
      processImageFile(file);
      return false; // 阻止默认上传行为
    },
    onChange: handleImageUpload,
    // 阻止点击Dragger区域时触发上传
    openFileDialogOnClick: false
  };

  // 渲染图片上传区域
  const renderImageUpload = () => {
    return (
      <div 
        ref={pasteAreaRef} 
        style={{ 
          outline: 'none',
          position: 'relative',
          border: '1px dashed #d9d9d9',
          borderRadius: '8px',
          padding: '4px',
          backgroundColor: '#fafafa',
          transition: 'all 0.3s'
        }} 
        tabIndex={0}
        onFocus={() => console.log('粘贴区域获得焦点')}
        onClick={() => {
          // 手动聚焦粘贴区域，增加粘贴成功率
          pasteAreaRef.current?.focus();
          message.info('区域已激活，可以按Ctrl+V粘贴图片');
        }}
      >
        {!imageUrl && !imageStatus.processing && (
          <div 
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0, 0, 0, 0.03)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              zIndex: 5
            }}
          >
            <kbd style={{background: '#fff', border: '1px solid #d9d9d9', borderRadius: '3px', padding: '1px 4px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)'}}>Ctrl</kbd>+<kbd style={{background: '#fff', border: '1px solid #d9d9d9', borderRadius: '3px', padding: '1px 4px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)'}}>V</kbd> 粘贴图片
          </div>
        )}
        <Dragger 
          {...draggerProps} 
          style={{ 
            padding: imageUrl ? '0' : '20px 0',
            background: 'transparent',
            border: 'none'
          }}
        >
          {imageStatus.processing ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />} />
              <p style={{ marginTop: 15, color: '#666' }}>{imageStatus.statusText}</p>
              <Progress 
                percent={imageStatus.progress} 
                status="active" 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ margin: '10px 20px' }}
              />
            </div>
          ) : imageUrl ? (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              borderRadius: '6px',
              overflow: 'hidden',
              background: '#fff' 
            }}>
              <div style={{ 
                position: 'relative',
                marginBottom: 16,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'inline-block',
                maxWidth: '90%'
              }}>
                <img 
                  src={encodeURI(imageUrl)} 
                  alt="预览" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '180px',
                    display: 'block',
                    objectFit: 'contain'
                  }} 
                />
              </div>
              <div>
                <Button 
                  type="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl('');
                    setImagePath('');
                  }}
                  danger
                  icon={<DeleteOutlined />}
                  style={{
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(255,77,79,0.2)'
                  }}
                >
                  移除图片
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px 0' }}>
              <p className="ant-upload-drag-icon" style={{ color: '#1890ff', marginBottom: 16 }}>
                <InboxOutlined style={{ fontSize: 48 }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.85)', fontWeight: 500 }}>
                点击下方按钮选择图片或拖拽图片到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)', margin: '8px 0 16px' }}>
                支持单个图片上传。也可以直接复制图片后，点击区域并按Ctrl+V粘贴。
              </p>
              <Button 
                type="primary" 
                icon={<UploadOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  // 使用原生文件选择器，避免使用electronAPI
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                      processImageFile(file);
                    }
                  };
                  input.click();
                }}
                style={{ 
                  marginTop: 10,
                  height: '38px',
                  padding: '0 20px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(24,144,255,0.2)'
                }}
              >
                选择图片
              </Button>
            </div>
          )}
        </Dragger>
      </div>
    );
  };

  const columns = [
    { 
      title: '图片', 
      dataIndex: 'image', 
      key: 'image',
      width: 90, 
      render: (imagePath: string) => {
        console.log('imagePath', imagePath);
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
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '购入时间', dataIndex: 'buyDate', key: 'buyDate' },
    { title: '购入平台', dataIndex: 'buyPlatform', key: 'buyPlatform' },
    { title: '购入价格', dataIndex: 'buyPrice', key: 'buyPrice' },
    { title: '尺码信息', dataIndex: 'sizeInfo', key: 'sizeInfo' },
  ];

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
        添加服饰
      </Button>
      <Table rowKey="id" columns={columns} dataSource={clothes} style={{ marginTop: 16 }} />
      <Modal
        title="添加服饰"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          resetForm();
        }}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item 
            name="name" 
            label="名字" 
            rules={[{ required: true, message: '请输入服饰名字' }]}
            getValueFromEvent={e => {
              // 兼容不同类型的事件对象
              if (typeof e === 'string') return e.trim();
              if (e && e.target) return e.target.value.trim();
              return e;
            }}
          >
            <Input />
          </Form.Item>

          <Form.Item label="图片">
            {renderImageUpload()}
          </Form.Item>
          
          <Form.Item 
            name="type" 
            label="类型" 
            rules={[{ required: true, message: '请输入类型' }]}
            getValueFromEvent={value => {
              // 对于AutoComplete，值可能直接是字符串
              if (typeof value === 'string') return value.trim();
              if (value && value.target) return value.target.value.trim();
              return value;
            }}
          >
            <AutoComplete
              options={typeOptions}
              placeholder="请输入类型"
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
          
          <Form.Item 
            name="brand" 
            label="品牌"
            getValueFromEvent={value => {
              if (typeof value === 'string') return value.trim();
              if (value && value.target) return value.target.value.trim();
              return value;
            }}
          >
            <AutoComplete
              options={brandOptions}
              placeholder="请输入品牌"
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
          
          <Form.Item name="buyDate" label="购入时间" rules={[{ required: true, message: '请选择购入时间' }]}>
            <DatePicker placeholder='请选择购入时间' style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            name="buyPlatform" 
            label="购入平台"
            getValueFromEvent={value => {
              if (typeof value === 'string') return value.trim();
              if (value && value.target) return value.target.value.trim();
              return value;
            }}
          >
            <AutoComplete
              options={platformOptions}
              placeholder="请输入购入平台"
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>
          
          <Form.Item name="buyPrice" label="购入价格">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              prefix="¥"
            />
          </Form.Item>
          
          <Form.Item 
            name="sizeInfo" 
            label="尺码信息"
            getValueFromEvent={e => {
              if (typeof e === 'string') return e.trim();
              if (e && e.target) return e.target.value.trim();
              return e;
            }}
          >
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="extraInfo" 
            label="额外信息"
            getValueFromEvent={e => {
              if (typeof e === 'string') return e.trim();
              if (e && e.target) return e.target.value.trim();
              return e;
            }}
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SkuPage; 