import { useState } from 'react';
import Header from '@/components/Header/Header';
import Profile from '@/components/Profile/Profile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showProfileSection, setShowProfileSection] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header onProfileClick={() => setShowProfileSection(true)} />
      
      {showProfileSection ? (
        <Profile onClose={() => setShowProfileSection(false)} />
      ) : (
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      )}
    </div>
  );
};

export default Layout;

