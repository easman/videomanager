import React, { useEffect, useState, useRef } from 'react';
import { Button, Form, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { db, Sku } from '../../db';
import SkuForm from './SkuForm';
import SkuTable from './SkuTable';

const SkuPage: React.FC = () => {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [typeOptions, setTypeOptions] = useState<{ value: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<{ value: string }[]>([]);
  const [platformOptions, setPlatformOptions] = useState<{ value: string }[]>([]);
  const [colorOptions, setColorOptions] = useState<{ value: string }[]>([]);
  const [currentSku, setCurrentSku] = useState<Sku | undefined>();
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [imagesDir, setImagesDir] = useState<string>('');

  // 获取图片目录
  useEffect(() => {
    const getImagesDir = async () => {
      const dir = await window.electronAPI.getAppImagesDir();
      setImagesDir(dir);
    };
    getImagesDir();
  }, []);

  const fetchSkus = async () => {
    try {
      const all = await db.skus.toArray();
      
      // 预处理所有图片路径
      const processedSkus = all.map(item => ({
        ...item,
        image: item.image ? `${imagesDir}/${item.image}` : ''
      }));
      
      setSkus(processedSkus);
      
      // 获取所有已存在的类型、品牌和平台，并去重
      const types = Array.from(new Set(all.map(item => item.type))).filter(Boolean);
      const brands = Array.from(new Set(all.map(item => item.brand))).filter(Boolean);
      const colors = Array.from(new Set(all.map(item => item.color))).filter(Boolean);
      const platforms = Array.from(new Set(all.map(item => item.buyPlatform))).filter(Boolean);
      
      setTypeOptions(types.map(type => ({ value: type })));
      setBrandOptions(brands.map(brand => ({ value: brand })));
      setColorOptions(colors.map(color => ({ value: color })));
      setPlatformOptions(platforms.map(platform => ({ value: platform })));
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    }
  };

  useEffect(() => {
    if (imagesDir) {
      fetchSkus();
    }
  }, [imagesDir]);

  const handleSubmit = async (values: Omit<Sku, 'id'>, id?: number) => {
    try {
      setSubmitting(true);
      
      // 处理图片保存
      let finalImagePath = '';
      if (values.image) {
        // 如果是编辑模式且图片路径没有改变，直接使用原文件名
        if (id && values.image === currentSku?.image) {
          finalImagePath = values.image.split('/').pop() || values.image.split('\\').pop() || values.image;
        } else {
          const saveResult = await window.electronAPI.saveImage(values.image);
          if (!saveResult.success) {
            message.error(`图片保存失败: ${saveResult.message}`);
            return;
          }
          // 只保存文件名
          finalImagePath = saveResult.path.split('/').pop() || saveResult.path.split('\\').pop() || saveResult.path;
        }
      }

      const skuData: Omit<Sku, 'id'> = {
        ...values,
        image: finalImagePath
      };

      if (id) {
        // 编辑模式
        await db.skus.update(id, skuData);
        message.success('更新成功');
      } else {
        // 新增模式
        await db.skus.add(skuData);
        message.success('添加成功');
      }
      
      setModalVisible(false);
      fetchSkus();
    } catch (error) {
      console.error(id ? '更新失败:' : '添加失败:', error);
      message.error((id ? '更新' : '添加') + '失败: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: Sku) => {
    // 编辑时传入完整路径
    setCurrentSku({
      ...record,
      image: record.image ? `${imagesDir}/${record.image.split('/').pop() || record.image.split('\\').pop() || record.image}` : ''
    });
    setFormMode('edit');
    setModalVisible(true);
  };

  const handleAdd = () => {
    setCurrentSku(undefined);
    setFormMode('create');
    setModalVisible(true);
  };

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
        添加服饰
      </Button>
      
      <SkuTable 
        dataSource={skus} 
        onDataChange={fetchSkus}
        onEdit={handleEdit}
      />
      
      <SkuForm
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        form={form}
        colorOptions={colorOptions}
        typeOptions={typeOptions}
        brandOptions={brandOptions}
        platformOptions={platformOptions}
        onSubmit={handleSubmit}
        submitting={submitting}
        initialData={currentSku}
        mode={formMode}
      />
    </div>
  );
};

export default SkuPage; 