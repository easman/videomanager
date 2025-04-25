import React from 'react';
import { Card, Button, Space, Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { db } from '../db';

const { confirm } = Modal;

const SettingsPage: React.FC = () => {
  const handleClearData = () => {
    confirm({
      title: '确认清空所有数据？',
      icon: <ExclamationCircleOutlined />,
      content: '此操作将清空所有服饰、视频素材、成品视频数据以及图片文件，且不可恢复。',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          // 清空数据库
          await Promise.all([
            db.skus.clear(),
            db.videoMaterials.clear(),
            db.finalVideos.clear(),
          ]);

          // 清理图片文件
          const imagesDir = await window.electronAPI.getAppImagesDir();
          const clearResult = await window.electronAPI.clearDirectory(imagesDir);
          
          if (!clearResult.success) {
            throw new Error(clearResult.message || '清理图片失败');
          }
          
          message.success('所有数据和图片已清空');
        } catch (error) {
          message.error('清空数据失败：' + (error as Error).message);
        }
      },
    });
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>
      
      <Card title="数据管理" style={{ maxWidth: 800 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Button danger onClick={handleClearData}>
              清空所有数据
            </Button>
            <span style={{ marginLeft: 8, color: '#999' }}>
              清空所有服饰、视频素材、成品视频数据以及图片文件
            </span>
          </div>
          
          <div>
            <Button disabled>
              导出数据
            </Button>
            <span style={{ marginLeft: 8, color: '#999' }}>
              导出所有数据为备份文件（暂未实现）
            </span>
          </div>
          
          <div>
            <Button disabled>
              导入数据
            </Button>
            <span style={{ marginLeft: 8, color: '#999' }}>
              从备份文件导入数据（暂未实现）
            </span>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default SettingsPage; 