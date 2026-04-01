import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/utils/auth';
import UserSidebar from './UserSidebar';
import TicketManagement from '@/components/TicketManagement/TicketManagement';
import ViolationManagement from '@/components/ViolationManagement/ViolationManagement';

const UserDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<string>(sectionFromUrl || 'my-tickets');
  const [error, setError] = useState<string | null>(null);

  // Load current user info
  useEffect(() => {
    const user = getCurrentUser();
    console.log('User dashboard - Current user:', user);
  }, []);

  // Update active section when URL parameter changes
  useEffect(() => {
    if (sectionFromUrl) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl]);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'my-tickets':
        return <TicketManagement showMyTickets={true} />;
      case 'completed-tickets':
        return <TicketManagement showMyTickets={true} showCompleted={true} />;
      case 'responded-tickets':
        return <TicketManagement showMyTickets={true} showReopened={true} />;
      case 'reopened-tickets':
        return <TicketManagement showMyTickets={true} showActualReopened={true} />;
      case 'my-violations':
        return <ViolationManagement showMyViolations={true} />;
      default:
        return <TicketManagement showMyTickets={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => setError(null)} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Main Layout with Sidebar */}
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <UserSidebar 
              activeSection={activeSection} 
              onSectionChange={handleSectionChange} 
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
