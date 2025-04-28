import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[1] || 'sku';

  return (
    <Header>
      <Menu theme="dark" mode="horizontal" selectedKeys={[currentPath]}>
        <Menu.Item key="sku">
          <Link to="/sku">服饰管理</Link>
        </Menu.Item>
        <Menu.Item key="materials">
          <Link to="/materials">视频素材管理</Link>
        </Menu.Item>
        <Menu.Item key="projects">
          <Link to="/projects">项目视频管理</Link>
        </Menu.Item>
        <Menu.Item key="body">
          <Link to="/body">身材记录</Link>
        </Menu.Item>
        <Menu.Item key="settings" icon={<SettingOutlined />} style={{ marginLeft: 'auto' }}>
          <Link to="/settings">系统设置</Link>
        </Menu.Item>
      </Menu>
    </Header>
  );
};

export default AppHeader; 