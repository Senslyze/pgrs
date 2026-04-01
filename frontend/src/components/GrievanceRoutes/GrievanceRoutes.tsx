import { useState, useEffect } from 'react';
import GrievancesSearch from '@/components/GrievancesSearch/GrievancesSearch';
import GrievancesView from '@/components/GrievancesView/GrievancesView';

const GrievanceRoutes: React.FC = () => {
  const [grievanceId, setGrievanceId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'search' | 'view'>('search');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/view/')) {
        const id = hash.replace('#/view/', '');
        setGrievanceId(id);
        setCurrentView('view');
      } else {
        setCurrentView('search');
        setGrievanceId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return currentView === 'search' ? (
    <GrievancesSearch />
  ) : (
    <GrievancesView grievanceId={grievanceId || undefined} />
  );
};

export default GrievanceRoutes;

