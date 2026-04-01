import { useState, useEffect } from 'react';
import TicketView from '@/components/TicketView/TicketView';
import UserDashboard from '@/components/User/User';

interface TicketRoutesProps {
  showUserDashboard?: boolean;
}

const TicketRoutes: React.FC<TicketRoutesProps> = ({ showUserDashboard = false }) => {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'search' | 'view'>('search');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/ticket/')) {
        const id = hash.replace('#/ticket/', '');
        setTicketId(id);
        setCurrentView('view');
      } else {
        setCurrentView('search');
        setTicketId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (showUserDashboard) {
    return currentView === 'view' && ticketId ? (
      <TicketView ticketId={ticketId} />
    ) : (
      <UserDashboard />
    );
  }

  return currentView === 'search' ? (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket Search</h1>
      <p className="text-gray-600">Use the navigation to view tickets from the dashboard.</p>
    </div>
  ) : (
    <TicketView ticketId={ticketId || undefined} />
  );
};

export default TicketRoutes;

