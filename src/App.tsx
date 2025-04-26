import React, { useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { HashRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { SettingOutlined } from '@ant-design/icons';
import SkuPage from './pages/sku/SkuPage';
import VideoMaterialsPage from './pages/materials/VideoMaterialsPage';
import ProjectPage from './pages/project/ProjectPage';
import SettingsPage from './pages/settings/SettingsPage';

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
            <Menu.Item key="projects">
              <Link to="/projects">项目视频管理</Link>
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
            <Route path="/projects" element={<ProjectPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App; 