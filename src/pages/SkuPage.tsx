import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Upload, AutoComplete, InputNumber, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { db, Sku } from '../db';

const SkuPage: React.FC = () => {
  const [clothes, setClothes] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [typeOptions, setTypeOptions] = useState<{ value: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<{ value: string }[]>([]);
  const [platformOptions, setPlatformOptions] = useState<{ value: string }[]>([]);

  const fetchClothes = async () => {
    const all = await db.skus.toArray();
    setClothes(all);
    
    // 获取所有已存在的类型、品牌和平台，并去重
    const types = Array.from(new Set(all.map(item => item.type))).filter(Boolean);
    const brands = Array.from(new Set(all.map(item => item.brand))).filter(Boolean);
    const platforms = Array.from(new Set(all.map(item => item.buyPlatform))).filter(Boolean);
    
    setTypeOptions(types.map(type => ({ value: type })));
    setBrandOptions(brands.map(brand => ({ value: brand })));
    setPlatformOptions(platforms.map(platform => ({ value: platform })));
  };

  useEffect(() => {
    fetchClothes();
  }, []);

  const handleAdd = async (values: any) => {
    setUploading(true);
    await db.skus.add({
      ...values,
      name: values.name.trim(),
      type: values.type.trim(),
      brand: values.brand?.trim(),
      buyPlatform: values.buyPlatform?.trim(),
      sizeInfo: values.sizeInfo?.trim(),
      extraInfo: values.extraInfo?.trim(),
      image: imageUrl,
      buyDate: values.buyDate.format('YYYY-MM-DD'),
    });
    setUploading(false);
    setModalVisible(false);
    form.resetFields();
    setImageUrl('');
    fetchClothes();
    message.success('添加成功');
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const reader = new FileReader();
      reader.onload = e => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const columns = [
    { title: '图片', dataIndex: 'image', key: 'image', render: (img: string) => img ? <img src={img} alt="服饰" style={{ width: 60 }} /> : '-' },
    { title: '名字', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '购入时间', dataIndex: 'buyDate', key: 'buyDate' },
    { title: '购入平台', dataIndex: 'buyPlatform', key: 'buyPlatform' },
    { title: '购入价格', dataIndex: 'buyPrice', key: 'buyPrice' },
    { title: '尺码信息', dataIndex: 'sizeInfo', key: 'sizeInfo' },
    { title: '额外信息', dataIndex: 'extraInfo', key: 'extraInfo' },
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
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={uploading}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item 
            name="name" 
            label="名字" 
            rules={[{ required: true, message: '请输入服饰名字' }]}
            getValueFromEvent={e => e.target.value.trim()}
          >
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="type" 
            label="类型" 
            rules={[{ required: true, message: '请输入类型' }]}
            getValueFromEvent={e => e.target.value.trim()}
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
            getValueFromEvent={e => e.target.value.trim()}
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
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            name="buyPlatform" 
            label="购入平台"
            getValueFromEvent={e => e.target.value.trim()}
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
            getValueFromEvent={e => e.target.value.trim()}
          >
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="extraInfo" 
            label="额外信息"
            getValueFromEvent={e => e.target.value.trim()}
          >
            <Input.TextArea />
          </Form.Item>
          
          <Form.Item label="图片">
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleImageUpload}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Upload>
            {imageUrl && <img src={imageUrl} alt="预览" style={{ width: 80, marginTop: 8 }} />}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SkuPage; 