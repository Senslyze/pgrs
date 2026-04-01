import { useState } from 'react';
import Header from '@/components/Header/Header';
import Profile from '@/components/Profile/Profile';
import { Card } from '@/components/ui/card';

const NotFound: React.FC = () => {
  const [showProfileSection, setShowProfileSection] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header onProfileClick={() => setShowProfileSection(true)} />
      
      {showProfileSection ? (
        <Profile onClose={() => setShowProfileSection(false)} />
      ) : (
        <div className="min-h-[calc(100vh-200px)] bg-gray-50 flex items-center justify-center px-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
              <p className="text-gray-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotFound;

