import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Modal, message, Switch } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { db } from '../../db';

const { confirm } = Modal;

const SettingsPage: React.FC = () => {
  const [devToolsEnabled, setDevToolsEnabled] = useState(false);

  // 获取开发者工具状态
  useEffect(() => {
    const checkDevTools = async () => {
      const isEnabled = await window.electronAPI.isDevToolsEnabled();
      setDevToolsEnabled(isEnabled);
    };
    checkDevTools();
  }, []);

  // 处理开发者工具开关
  const handleDevToolsToggle = async (checked: boolean) => {
    try {
      await window.electronAPI.toggleDevTools(checked);
      setDevToolsEnabled(checked);
      message.success(`已${checked ? '启用' : '禁用'}开发者工具`);
    } catch (error) {
      message.error('操作失败：' + (error as Error).message);
    }
  };

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
      
      <Space direction="vertical" size="large" style={{ display: 'flex' }}>
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

        <Card title="开发者选项" style={{ maxWidth: 800 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Switch
                checked={devToolsEnabled}
                onChange={handleDevToolsToggle}
              />
              <span style={{ marginLeft: 8 }}>
                开发者工具
                <span style={{ marginLeft: 8, color: '#999' }}>
                  启用后可以使用 Ctrl+Shift+I (Windows) 或 Cmd+Option+I (Mac) 打开开发者工具
                </span>
              </span>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default SettingsPage; 