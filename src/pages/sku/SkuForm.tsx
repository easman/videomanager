import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, AutoComplete, InputNumber, message, Modal, Row, Col, Switch } from 'antd';
import ImageUploader from '../../components/ImageUploader';
import { Sku } from '../../db';
import dayjs from 'dayjs';

interface ImageProcessingStatus {
  processing: boolean;
  progress: number;
  statusText: string;
}

interface SkuFormProps {
  form: any;
  typeOptions: { value: string }[];
  brandOptions: { value: string }[];
  platformOptions: { value: string }[];
  colorOptions: { value: string }[];
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  submitting: boolean;
  onSubmit: (sku: Omit<Sku, 'id'>, id?: number) => Promise<void>;
  initialData?: Sku;
  mode?: 'create' | 'edit';
}

const SkuForm: React.FC<SkuFormProps> = ({
  form,
  typeOptions,
  brandOptions,
  platformOptions,
  colorOptions,
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting,
  initialData,
  mode = 'create'
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageStatus, setImageStatus] = useState<ImageProcessingStatus>({
    processing: false,
    progress: 0,
    statusText: ''
  });

  // 初始化表单数据
  useEffect(() => {
    if (modalVisible) {  // 只在弹窗打开时初始化数据
      // 先重置所有字段，确保清除旧数据
      form.resetFields();
      
      if (mode === 'edit' && initialData) {
        // 编辑模式：只设置 initialData 中存在的字段
        const formValues = {
          name: initialData.name || '',
          fullName: initialData.fullName || '',
          type: initialData.type || '',
          brand: initialData.brand || '',
          color: initialData.color || '',
          buyPlatform: initialData.buyPlatform || '',
          sizeInfo: initialData.sizeInfo || '',
          extraInfo: initialData.extraInfo || '',
          buyPrice: initialData.buyPrice || 0,
          returned: initialData.returned || false,
          buyDate: initialData.buyDate ? dayjs(initialData.buyDate) : null
        };
        form.setFieldsValue(formValues);
        setImageUrl(initialData.image || '');
      } else {
        // 新建模式：清空所有状态
        setImageUrl('');
      }
    }
  }, [modalVisible, initialData, mode, form]);

  // 重置表单和图片状态
  const resetForm = () => {
    form.resetFields();  // 重置所有表单字段
    setImageUrl('');
    setImageStatus({
      processing: false,
      progress: 0,
      statusText: ''
    });
  };

  // 处理图片文件
  const processImageFile = (file: File | Blob) => {
    if (file.size === 0) {
      setImageUrl('');
      return;
    }

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
        const percentLoaded = Math.round((e.loaded / e.total) * 50);
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

  const handleSubmit = async (values: any) => {
    try {
      // 基本字段trim处理
      const trimValues = { ...values };

      if (trimValues.name) trimValues.name = String(trimValues.name).trim();
      if (trimValues.type) trimValues.type = String(trimValues.type).trim();
      if (trimValues.brand) trimValues.brand = String(trimValues.brand).trim();
      if (trimValues.color) trimValues.color = String(trimValues.color).trim();
      if (trimValues.buyPlatform) trimValues.buyPlatform = String(trimValues.buyPlatform).trim();
      if (trimValues.sizeInfo) trimValues.sizeInfo = String(trimValues.sizeInfo).trim();

      // 必要字段验证
      if (!trimValues.name) {
        message.error('请输入服饰名字');
        return;
      }

      if (!trimValues.type) {
        message.error('请输入类型');
        return;
      }

      if (!trimValues.buyDate) {
        message.error('请选择购入时间');
        return;
      }

      // 准备提交数据
      const skuData: Omit<Sku, 'id'> = {
        name: trimValues.name,
        fullName: trimValues.fullName,
        type: trimValues.type,
        brand: trimValues.brand || '',
        color: trimValues.color || '',
        buyPlatform: trimValues.buyPlatform || '',
        sizeInfo: trimValues.sizeInfo || '',
        extraInfo: trimValues.extraInfo || '',
        image: imageUrl,
        buyDate: trimValues.buyDate.format('YYYY-MM-DD'),
        buyPrice: trimValues.buyPrice || 0,
        returned: trimValues.returned || false,
        modifiedTimes: initialData 
          ? [...initialData.modifiedTimes, new Date().toISOString()]
          : [new Date().toISOString()],
      };

      // 根据模式调用不同的提交逻辑
      await onSubmit(skuData, mode === 'edit' ? initialData?.id : undefined);

      // 重置表单和图片状态
      form.resetFields();
      resetForm();
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败: ' + (error as Error).message);
    }
  };

  return (
    <Modal
      maskClosable={false}
      title='服饰'
      open={modalVisible}
      cancelText="取消"
      okText="提交"
      onCancel={() => {
        setModalVisible(false);
        resetForm();
      }}
      afterClose={resetForm}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      width={1000}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onReset={resetForm}
      >
        <Row gutter={24}>
          <Col span={14}>
            <Form.Item
              name="name"
              label="名字"
              rules={[{ required: true, message: '请输入服饰名字' }]}
            >
              <Input placeholder="请输入类型" />
            </Form.Item>

            <Form.Item
              name="fullName"
              label="全称"
            >
              <Input placeholder="请输入全称" />
            </Form.Item>

            <Form.Item
              name="type"
              label="类型"
              rules={[{ required: true, message: '请输入类型' }]}
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
              name="color"
              label="颜色"
              rules={[{ required: true, message: '请输入颜色' }]}
            >
              <AutoComplete
                options={colorOptions}
                placeholder="请输入颜色"
                filterOption={(inputValue, option) =>
                  option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                }
              />
            </Form.Item>

            <Form.Item
              name="brand"
              label="品牌"
              rules={[{ required: true, message: '请输入品牌' }]}
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
              rules={[{ required: true, message: '请输入购入平台' }]}
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
                placeholder="请输入购入价格"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>

            <Form.Item
              name="sizeInfo"
              label="尺码信息"
            >
              <Input placeholder="请输入尺码信息" />
            </Form.Item>

            <Form.Item
              name="returned"
              label="是否退货"
              valuePropName="checked"
            >
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </Col>

          <Col span={10}>
            <div style={{ 
              display: 'grid',
              gridTemplateRows: 'auto 1fr',
              gap: '24px',
              height: '100%',
              minHeight: '600px'
            }}>
              <Form.Item 
                label="图片"
                style={{ marginBottom: 0 }}
              >
                <ImageUploader
                  imageUrl={imageUrl}
                  imageStatus={imageStatus}
                  onImageChange={processImageFile}
                />
              </Form.Item>

              <Form.Item
                name="extraInfo"
                label="额外信息"
                style={{ 
                  marginBottom: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Input.TextArea 
                  style={{ 
                    height: '100%',
                    minHeight: '300px',
                    resize: 'none'
                  }}
                  placeholder="请输入额外信息"
                />
              </Form.Item>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SkuForm; 