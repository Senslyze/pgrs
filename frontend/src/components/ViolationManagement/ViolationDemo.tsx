import React, { useState } from 'react';
import ViolationManagement from './ViolationManagement';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ViolationDemo: React.FC = () => {
  const [currentView, setCurrentView] = useState<'all' | 'my' | 'team'>('all');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <Card className="p-4">
        <div className="flex space-x-4">
          <Button
            onClick={() => setCurrentView('all')}
            variant={currentView === 'all' ? 'default' : 'outline'}
          >
            All Violations
          </Button>
          <Button
            onClick={() => setCurrentView('my')}
            variant={currentView === 'my' ? 'default' : 'outline'}
          >
            My Violations
          </Button>
          <Button
            onClick={() => setCurrentView('team')}
            variant={currentView === 'team' ? 'default' : 'outline'}
          >
            Team Violations
          </Button>
        </div>
      </Card>

      {/* Violation Management Component */}
      <ViolationManagement
        showMyViolations={currentView === 'my'}
        showTeamViolations={currentView === 'team'}
      />
    </div>
  );
};

export default ViolationDemo;
