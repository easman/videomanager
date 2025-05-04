import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, AutoComplete } from 'antd';
import { BodyRecord, db } from '../../db';
import dayjs from 'dayjs';

interface BodyRecordFormProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  onSubmit: (values: Omit<BodyRecord, 'id'>, id?: number) => Promise<void>;
  submitting: boolean;
  initialData?: BodyRecord;
  mode: 'create' | 'edit';
}

interface BodyRecordFormValues {
  recordDate: dayjs.Dayjs;
  height: number;
  weight: number;
  shoulderWidth: number;
  chestCircumference: number;
  waistCircumference: number;
  hipCircumference: number;
  thighCircumference: number;
  armCircumference: number;
  measurementTime: string;
  extraInfo: string;
}

const BodyRecordForm: React.FC<BodyRecordFormProps> = ({
  modalVisible,
  setModalVisible,
  onSubmit,
  submitting,
  initialData,
  mode
}) => {
  const [form] = Form.useForm<BodyRecordFormValues>();
  const [measurementTimeOptions, setMeasurementTimeOptions] = React.useState<{ value: string }[]>([]);

  // 加载历史测量时间选项
  const loadMeasurementTimeOptions = async () => {
    const records = await db.bodyRecords.toArray();
    const uniqueTimes = Array.from(new Set(
      records
        .map(record => record.measurementTime)
        .filter(time => time) // 过滤掉空值
    ));
    setMeasurementTimeOptions(uniqueTimes.map(time => ({ value: time })));
  };

  useEffect(() => {
    if (modalVisible) {
      loadMeasurementTimeOptions();
      
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          ...initialData,
          recordDate: dayjs(initialData.recordDate)
        });
      } else {
        form.resetFields();
        // 设置默认日期为今天
        form.setFieldValue('recordDate', dayjs());
      }
    }
  }, [modalVisible, initialData, mode, form]);

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date().toISOString();
      
      if (mode === 'edit' && initialData?.id) {
        await onSubmit({
          ...values,
          recordDate: values.recordDate.format('YYYY-MM-DD'),
          measurementTime: values.measurementTime?.trim() || '',
          modifiedTimes: [...(initialData.modifiedTimes || []), now]
        }, initialData.id);
      } else {
        await onSubmit({
          ...values,
          recordDate: values.recordDate.format('YYYY-MM-DD'),
          measurementTime: values.measurementTime?.trim() || '',
          modifiedTimes: [now]
        });
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      maskClosable={false}
      title={mode === 'create' ? "添加身材记录" : "编辑身材记录"}
      open={modalVisible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      cancelText="取消"
      okText="提交"
      confirmLoading={submitting}
      width={600}
      forceRender
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        preserve={false}
      >
        <Form.Item
          name="recordDate"
          label="记录日期"
          rules={[{ required: true, message: '请选择记录日期' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="height"
          label="身高(cm)"
          initialValue={153}
          rules={[{ required: true, message: '请输入身高' }]}
        >
          <InputNumber
            min={0}
            max={300}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入身高"
          />
        </Form.Item>

        <Form.Item
          name="weight"
          label="体重(斤)"
          rules={[{ required: true, message: '请输入体重' }]}
        >
          <InputNumber
            min={0}
            max={1000}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入体重"
          />
        </Form.Item>

        <Form.Item
          name="shoulderWidth"
          label="肩宽(cm)"
          rules={[{ required: true, message: '请输入肩宽' }]}
        >
          <InputNumber
            min={0}
            max={100}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入肩宽"
          />
        </Form.Item>

        <Form.Item
          name="chestCircumference"
          label="胸围(cm)"
          rules={[{ required: true, message: '请输入胸围' }]}
        >
          <InputNumber
            min={0}
            max={200}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入胸围"
          />
        </Form.Item>

        <Form.Item
          name="waistCircumference"
          label="腰围(cm)"
          rules={[{ required: true, message: '请输入腰围' }]}
        >
          <InputNumber
            min={0}
            max={200}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入腰围"
          />
        </Form.Item>

        <Form.Item
          name="hipCircumference"
          label="臀围(cm)"
          rules={[{ required: true, message: '请输入臀围' }]}
        >
          <InputNumber
            min={0}
            max={200}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入臀围"
          />
        </Form.Item>

        <Form.Item
          name="thighCircumference"
          label="大腿围(cm)"
          rules={[{ required: true, message: '请输入大腿围' }]}
        >
          <InputNumber
            min={0}
            max={100}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入大腿围"
          />
        </Form.Item>

        <Form.Item  
          name="armCircumference"
          label="大臂围(cm)"
          rules={[{ required: true, message: '请输入大臂围' }]}
        >
          <InputNumber
            min={0}
            max={100}
            precision={1}
            style={{ width: '100%' }}
            placeholder="请输入大臂围"
          />
        </Form.Item>

        <Form.Item
          name="measurementTime"
          label="测量时间"
        >
          <AutoComplete
            options={measurementTimeOptions}
            placeholder="例如：早餐后、睡前等"
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
          />
        </Form.Item>
        <Form.Item
          name="extraInfo"
          label="备注"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BodyRecordForm; 