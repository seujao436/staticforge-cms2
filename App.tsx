import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { PageEditor } from './components/PageEditor';
import { HtmlPage } from './types';
import { getPages } from './utils/storage';

const App: React.FC = () => {
  // Using simple state-based routing since HashRouter is mentioned as allowed but this is simpler for a manager
  // However, preserving state is better with a route parameter check if we had more complex requirements.
  // For "Run everything on frontend", a conditional render is fastest and cleanest.
  
  const [currentPage, setCurrentPage] = useState<HtmlPage | null>(null);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');

  // Simulate checking URL hash on load for deep linking (optional but nice)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/edit/')) {
        const id = hash.replace('#/edit/', '');
        const found = getPages().find(p => p.id === id);
        if (found) {
          setCurrentPage(found);
          setView('editor');
        }
      } else {
        setView('dashboard');
        setCurrentPage(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleEditPage = (page: HtmlPage) => {
    window.location.hash = `#/edit/${page.id}`;
    // State updates via hash listener
  };

  const handleBackToDashboard = () => {
    window.location.hash = '';
    // State updates via hash listener
  };

  return (
    <div className="bg-gray-950 min-h-screen font-sans text-gray-100">
      {view === 'dashboard' && (
        <Dashboard onEdit={handleEditPage} />
      )}
      
      {view === 'editor' && currentPage && (
        <PageEditor 
          page={currentPage} 
          onBack={handleBackToDashboard}
          onSaveSuccess={() => {}} 
        />
      )}
    </div>
  );
};

export default App;
