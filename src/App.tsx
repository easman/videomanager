import React from 'react';
import { Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import ClothesPage from './pages/ClothesPage';
import VideoMaterialsPage from './pages/VideoMaterialsPage';
import FinalVideosPage from './pages/FinalVideosPage';

const { Header, Content } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header>
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['clothes']}>
            <Menu.Item key="clothes">
              <Link to="/clothes">服饰管理</Link>
            </Menu.Item>
            <Menu.Item key="materials">
              <Link to="/materials">视频素材管理</Link>
            </Menu.Item>
            <Menu.Item key="finalVideos">
              <Link to="/final-videos">成品视频管理</Link>
            </Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: 24 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/clothes" />} />
            <Route path="/clothes" element={<ClothesPage />} />
            <Route path="/materials" element={<VideoMaterialsPage />} />
            <Route path="/final-videos" element={<FinalVideosPage />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App; 