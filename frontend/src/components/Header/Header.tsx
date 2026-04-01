import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { clearAuthData, getCurrentUser } from '@/utils/auth';
import { departmentApi, userApi } from '@/services/api/admin';

interface HeaderProps {
  onProfileClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => {
  const userInfo = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = () => {
    clearAuthData();
    navigate('/login', { replace: true });
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(false);
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleSettingsClick = () => {
    setIsProfileDropdownOpen(false);
    navigate('/settings');
  };


  // Load department name
  useEffect(() => {
    const loadDepartmentName = async () => {
      if (!userInfo?.departmentId) {
        setDepartmentName('No department assigned');
        return;
      }

      // First check if department info is already available in user object
      if (userInfo.department?.name) {
        setDepartmentName(userInfo.department.name);
        return;
      }

      // Fetch department by ID - this should work for all users
      try {
        const response = await departmentApi.getDepartmentById(userInfo.departmentId);

        console.log('Department response:', response.department.name);
        if (response.department.name) {
          setDepartmentName(response.department.name);
        } else {
          setDepartmentName('Department not found');
        }
      } catch (err: any) {
        console.error('Error loading department from getDepartmentById:', err);
        // If 403 error, try fetching user profile which might include department info
        if (err?.response?.status === 403) {
          try {
            const userResponse = await userApi.getUserById(userInfo.id);
            if (userResponse.success && userResponse.data?.department?.name) {
              setDepartmentName(userResponse.data.department.name);
            } else {
              setDepartmentName('Department access restricted');
            }
          } catch (userErr: any) {
            console.error('Error loading user profile:', userErr);
            setDepartmentName('Department access restricted');
          }
        } else if (err?.response?.status === 404) {
          setDepartmentName('Department not found');
        } else {
          setDepartmentName('Department info unavailable');
        }
      }
    };

    loadDepartmentName();
  }, [userInfo?.departmentId, userInfo?.department]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userInfo?.fullName) return 'U';
    const names = userInfo.fullName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Check if user is admin
  const isAdmin = userInfo?.role === 'ADMIN';

  // Helper function to get navigation link classes
  const getNavLinkClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `px-6 py-4 transition-colors flex items-center gap-1 ${
      isActive 
        ? 'bg-orange-700 text-white font-semibold' 
        : 'text-white hover:bg-orange-700'
    }`;
  };

  return (
    <header className="bg-white shadow-md relative z-10">
      <div className="max-w-7xl mx-auto px-2">
        {/* Top section with logo */}
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">{getUserInitials()}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">
                Public Grievance Redressal System(PGRS)
              </h1>
            </div>
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Profile Avatar */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
              </div>
              
              {/* User Info - Hidden on small screens */}
              <div className="text-left hidden sm:block">
                <div className="font-medium text-gray-900 text-sm">
                  {userInfo?.fullName || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {userInfo?.role || 'USER'}
                </div>
              </div>
              
              {/* Dropdown Arrow */}
              <ChevronDown 
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Details Section */}
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">{getUserInitials()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {userInfo?.fullName || 'User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userInfo?.email || 'user@example.com'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Role: <span className="font-medium text-blue-600">{userInfo?.role || 'USER'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Profile Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="text-gray-900">{userInfo?.username || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="text-gray-900">{departmentName || 'No department assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="text-gray-900">
                        {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  
                  {isAdmin ? (
                    <button
                      onClick={handleSettingsClick}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed flex items-center gap-3 opacity-60"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  )}
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation section */}
        <nav className="bg-orange-600">
          <div className="flex items-center">
            <Link to="/dashboard" className={getNavLinkClasses('/dashboard')}>
              Dashboard
            </Link>
            <Link to="/grievance" className={getNavLinkClasses('/grievance')}>
              Grievance <span className="text-sm">▼</span>
            </Link>
            <Link to="/report" className={getNavLinkClasses('/report')}>
              Report <span className="text-sm">▼</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className={getNavLinkClasses('/admin')}>
                Admin <span className="text-sm">▼</span>
              </Link>
            )}
            <Link to="/cmo-grievances" className={getNavLinkClasses('/cmo-grievances')}>
              CMO Grievances <span className="text-sm">▼</span>
            </Link>
            <Link to="/scheme" className={getNavLinkClasses('/scheme')}>
              Scheme <span className="text-sm">▼</span>
            </Link>
            <Link to="/ams" className={getNavLinkClasses('/ams')}>
              AMS <span className="text-sm">▼</span>
            </Link>
            <Link to="/audit-reports" className={getNavLinkClasses('/audit-reports')}>
              Audit Reports <span className="text-sm">▼</span>
            </Link>
            <Link to="/ceo-rtgs" className={`${getNavLinkClasses('/ceo-rtgs')} ml-auto`}>
              CEO, RTGS <span className="text-sm">▼</span>
            </Link>
          </div>
        </nav>
      </div>

    </header>
  );
};

export default Header;