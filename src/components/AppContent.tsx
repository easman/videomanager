import React from 'react';
import { Layout } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import SkuPage from '../pages/sku/SkuPage';
import VideoMaterialsPage from '../pages/materials/VideoMaterialsPage';
import ProjectPage from '../pages/project/ProjectPage';
import SettingsPage from '../pages/settings/SettingsPage';
import BodyRecordPage from '../pages/body/BodyRecordPage';

const { Content } = Layout;

const RedirectComponent = () => <Navigate to="/sku" />;

const AppContent: React.FC = () => {
  return (
    <Content style={{ padding: 24 }}>
      <Routes>
        <Route path="/" element={<RedirectComponent />} />
        <Route path="/sku" element={<SkuPage />} />
        <Route path="/materials" element={<VideoMaterialsPage />} />
        <Route path="/projects" element={<ProjectPage />} />
        <Route path="/body" element={<BodyRecordPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Content>
  );
};

export default AppContent; 