import React from 'react';
import { Layout } from 'antd';
import { HashRouter as Router } from 'react-router-dom';
import AppHeader from './components/AppHeader';
import AppContent from './components/AppContent';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  return (
    <>
      <SplashScreen />
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <AppHeader />
          <AppContent />
        </Layout>
      </Router>
    </>
  );
};

export default App; 