import React from 'react';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import SkuPage from './pages/SkuPage';
import VideoMaterialsPage from './pages/VideoMaterialsPage';
import FinalVideosPage from './pages/FinalVideosPage';
import SettingsPage from './pages/SettingsPage';

const { Header, Content } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header>
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['sku']}>
            <Menu.Item key="sku">
              <Link to="/sku">服饰管理</Link>
            </Menu.Item>
            <Menu.Item key="materials">
              <Link to="/materials">视频素材管理</Link>
            </Menu.Item>
            <Menu.Item key="finalVideos">
              <Link to="/final-videos">成品视频管理</Link>
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />} style={{ marginLeft: 'auto' }}>
              <Link to="/settings">系统设置</Link>
            </Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/sku" />} />
            <Route path="/sku" element={<SkuPage />} />
            <Route path="/materials" element={<VideoMaterialsPage />} />
            <Route path="/final-videos" element={<FinalVideosPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App; 