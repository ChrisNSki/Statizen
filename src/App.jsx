import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import TopNav from '@/components/layout/top-nav';
import Content from '@/components/layout/content';
import Footer from '@/components/layout/footer';
import { MinimizeOnLaunch } from '@/components/MinimizeOnLaunch';
import { SettingsProvider } from '@/lib/context/settings/settingsContext';
import { DataProvider } from '@/lib/context/data/dataContext';
import { LogProcessorProvider } from '@/lib/context/logProcessor/logProcessorContext';

function App() {
  // Store installation path on app startup
  useEffect(() => {
    const storePath = async () => {
      try {
        await invoke('store_app_path');
      } catch (error) {
        console.error('Failed to store app path:', error);
      }
    };

    storePath();
  }, []);

  return (
    <SettingsProvider>
      <LogProcessorProvider>
        <DataProvider>
          <Router>
            <div className='flex flex-col h-screen'>
              <MinimizeOnLaunch />
              <TopNav />
              <Content />
              <Footer />
            </div>
          </Router>
        </DataProvider>
      </LogProcessorProvider>
    </SettingsProvider>
  );
}

export default App;
