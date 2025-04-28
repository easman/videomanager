import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Modal, message, Switch } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { db } from '../../db';
import { exportDB, importDB } from 'dexie-export-import';

const { confirm } = Modal;

const SettingsPage: React.FC = () => {
  const [devToolsEnabled, setDevToolsEnabled] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
      content: '此操作将清空所有服饰、视频素材、项目数据、身材记录以及图片文件，且不可恢复。',
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          // 清空数据库
          await Promise.all([
            db.skus.clear(),
            db.videoMaterials.clear(),
            db.projects.clear(),
            db.bodyRecords.clear(),
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

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      // 导出数据库数据
      const blob = await exportDB(db);
      const exportData = await blob.text();
      
      // 发送到主进程进行保存
      const result = await window.electronAPI.exportData(exportData);
      
      if (result.success) {
        message.success('数据导出成功');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      message.error('导出数据失败：' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      // 确认导入
      confirm({
        title: '确认导入数据？',
        icon: <ExclamationCircleOutlined />,
        content: '此操作将覆盖当前所有数据，请确保已备份重要数据。',
        okText: '确认导入',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
          try {
            // 从主进程获取导入数据
            const result = await window.electronAPI.importData();
            
            if (!result.success || !result.dbData) {
              throw new Error(result.message || '导入失败');
            }
            
            // 清空现有数据
            await Promise.all([
              db.skus.clear(),
              db.videoMaterials.clear(),
              db.projects.clear(),
              db.bodyRecords.clear(),
            ]);
            
            // 导入新数据
            const blob = new Blob([result.dbData], { type: 'application/json' });
            await importDB(blob);
            
            message.success('数据导入成功');
          } catch (error) {
            message.error('导入数据失败：' + (error as Error).message);
          }
        },
      });
    } catch (error) {
      message.error('导入数据失败：' + (error as Error).message);
    } finally {
      setIsImporting(false);
    }
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
                清空所有服饰、视频素材、项目视频、身材记录数据以及图片文件
              </span>
            </div>
            
            <div>
              <Button onClick={handleExportData} loading={isExporting}>
                导出数据
              </Button>
              <span style={{ marginLeft: 8, color: '#999' }}>
                导出所有数据为备份文件
              </span>
            </div>
            
            <div>
              <Button onClick={handleImportData} loading={isImporting}>
                导入数据
              </Button>
              <span style={{ marginLeft: 8, color: '#999' }}>
                从备份文件导入数据
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