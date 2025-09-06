import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import TopNav from '@/components/layout/top-nav';
import Footer from '@/components/layout/footer';
import { MinimizeOnLaunch } from '@/components/MinimizeOnLaunch';
import { SettingsProvider } from '@/lib/context/settings/settingsContext';
import { DataProvider } from '@/lib/context/data/dataContext';
import { LogProcessorProvider } from '@/lib/context/logProcessor/logProcessorContext';
import { ToastProvider } from '@/lib/context/toast/toastContext';

// Import all views
import Dashboard from '@/views/Dashboard';
import PVP from '@/views/PVP';
import PVE from '@/views/PVE';
import Overlay from '@/views/Overlay';
import Org from '@/views/Org';
import Dictionary from '@/views/Dictionary';
import Settings from '@/views/Settings';
import LogFileLoader from '@/components/LogFileLoader';
import PageWrapper from '@/components/PageWrapper';

const consoleDebugging = false;

// Component to conditionally render layout
function AppContent() {
  const location = useLocation();
  const isOverlay = location.pathname === '/overlay';

  if (isOverlay) {
    // Overlay gets no layout - just the component
    // But it still needs access to all the context providers
    return <Overlay />;
  }

  // All other pages get full layout
  return (
    <div className='flex flex-col h-screen'>
      <MinimizeOnLaunch />
      <TopNav />
      <div className='flex-1 bg-accent overflow-y-auto'>
        <Routes>
          <Route
            path='/'
            element={
              <PageWrapper>
                <Dashboard />
              </PageWrapper>
            }
          />
          <Route
            path='/dashboard'
            element={
              <PageWrapper>
                <Dashboard />
              </PageWrapper>
            }
          />
          <Route
            path='/pvp'
            element={
              <PageWrapper>
                <PVP />
              </PageWrapper>
            }
          />
          <Route
            path='/pve'
            element={
              <PageWrapper>
                <PVE />
              </PageWrapper>
            }
          />
          <Route
            path='/org'
            element={
              <PageWrapper>
                <Org />
              </PageWrapper>
            }
          />
          <Route path='/settings' element={<Settings />} />
          <Route
            path='/load-log'
            element={
              <PageWrapper>
                <LogFileLoader />
              </PageWrapper>
            }
          />
          <Route path='/dictionary' element={<Dictionary />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  // Listen for messages from overlay window
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === '🎮 Overlay window loaded!') {
        consoleDebugging && console.log('✅ Received confirmation that overlay window loaded!');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Note: Global shortcut functionality removed due to plugin compatibility issues
  // The overlay edit mode can be toggled through the overlay settings in the main window

  return (
    <SettingsProvider>
      <LogProcessorProvider>
        <DataProvider>
          <ToastProvider>
            <Router>
              <Routes>
                <Route path='/*' element={<AppContent />} />
              </Routes>
            </Router>
          </ToastProvider>
        </DataProvider>
      </LogProcessorProvider>
    </SettingsProvider>
  );
}

export default App;
