import React, { useState } from 'react';
import { Form, Input, DatePicker, AutoComplete, InputNumber, message, Modal } from 'antd';
import ImageUploader from '../../components/ImageUploader';
import { Sku } from '../../db';

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
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  submitting: boolean;
  onSubmit: (sku: Omit<Sku, 'id'>) => Promise<void>;
}

const SkuForm: React.FC<SkuFormProps> = ({
  form,
  typeOptions,
  brandOptions,
  platformOptions,
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageStatus, setImageStatus] = useState<ImageProcessingStatus>({
    processing: false,
    progress: 0,
    statusText: ''
  });

  // 重置图片状态
  const resetImageState = () => {
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
      if (trimValues.buyPlatform) trimValues.buyPlatform = String(trimValues.buyPlatform).trim();
      if (trimValues.sizeInfo) trimValues.sizeInfo = String(trimValues.sizeInfo).trim();
      if (trimValues.extraInfo) trimValues.extraInfo = String(trimValues.extraInfo).trim();

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
      const newSku: Omit<Sku, 'id'> = {
        name: trimValues.name,
        type: trimValues.type,
        brand: trimValues.brand || '',
        buyPlatform: trimValues.buyPlatform || '',
        sizeInfo: trimValues.sizeInfo || '',
        extraInfo: trimValues.extraInfo || '',
        image: imageUrl, // 图片URL将在父组件中处理保存
        buyDate: trimValues.buyDate.format('YYYY-MM-DD'),
        buyPrice: trimValues.buyPrice || 0,
        modifiedTimes: [new Date().toISOString()],
      };

      await onSubmit(newSku);

      // 重置表单和图片状态
      form.resetFields();
      resetImageState();
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败: ' + (error as Error).message);
    }
  };

  return (
    <Modal
      maskClosable={false}
      title="添加服饰"
      open={modalVisible}
      onCancel={() => {
        setModalVisible(false);
        form.resetFields();
      }}
      afterClose={() => {
        form.resetFields();
        resetImageState()
      }}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      width={650}
    >


      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onReset={resetImageState}
      >
        <Form.Item
          name="name"
          label="名字"
          rules={[{ required: true, message: '请输入服饰名字' }]}
          getValueFromEvent={e => {
            if (typeof e === 'string') return e.trim();
            if (e && e.target) return e.target.value.trim();
            return e;
          }}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="图片">
          <ImageUploader
            imageUrl={imageUrl}
            imageStatus={imageStatus}
            onImageChange={processImageFile}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请输入类型' }]}
          getValueFromEvent={value => {
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
          rules={[{ required: true, message: '请输入品牌' }]}
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
          rules={[{ required: true, message: '请输入购入平台' }]}
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
  );
};

export default SkuForm; 