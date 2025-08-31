import { BrowserRouter as Router } from 'react-router-dom';

import TopNav from '@/components/layout/top-nav';
import Content from '@/components/layout/content';
import Footer from '@/components/layout/footer';
import { MinimizeOnLaunch } from '@/components/MinimizeOnLaunch';
import { SettingsProvider } from '@/lib/context/settings/settingsContext';
import { DataProvider } from '@/lib/context/data/dataContext';
import { LogProcessorProvider } from '@/lib/context/logProcessor/logProcessorContext';

function App() {
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
