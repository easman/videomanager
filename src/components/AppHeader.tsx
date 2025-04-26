import React from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  return (
    <Header>
      <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['sku']}>
        <Menu.Item key="sku">
          <Link to="/sku">服饰管理</Link>
        </Menu.Item>
        <Menu.Item key="materials">
          <Link to="/materials">视频素材管理</Link>
        </Menu.Item>
        <Menu.Item key="projects">
          <Link to="/projects">项目视频管理</Link>
        </Menu.Item>
        <Menu.Item key="settings" icon={<SettingOutlined />} style={{ marginLeft: 'auto' }}>
          <Link to="/settings">系统设置</Link>
        </Menu.Item>
      </Menu>
    </Header>
  );
};

export default AppHeader; 