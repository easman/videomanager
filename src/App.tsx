import React, { useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import SkuPage from './pages/sku/SkuPage';
import VideoMaterialsPage from './pages/VideoMaterialsPage';
import FinalVideosPage from './pages/FinalVideosPage';
import SettingsPage from './pages/SettingsPage';

const { Header, Content } = Layout;

// 创建一个重定向组件
const RedirectComponent = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/sku');
  }, [navigate]);
  
  return null;
};

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
            <Route path="/" element={<RedirectComponent />} />
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