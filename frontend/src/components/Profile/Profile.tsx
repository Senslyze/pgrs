import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentUser, clearAuthData } from '@/utils/auth';
import { userApi, departmentApi } from '@/services/api/admin';
import { Edit, Save, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const userInfo = getCurrentUser();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
  });

  useEffect(() => {
    if (userInfo) {
      setEditForm({
        fullName: userInfo.fullName,
        email: userInfo.email,
      });
      loadDepartments();
    }
  }, [userInfo?.departmentId, userInfo?.department, userInfo?.id]);

  const loadDepartments = async () => {
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
      
      if (response.department) {
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

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (userInfo) {
      setEditForm({
        fullName: userInfo.fullName,
        email: userInfo.email,
      });
    }
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!userInfo) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await userApi.updateUser(userInfo.id, {
        fullName: editForm.fullName,
        email: editForm.email,
      });

      if (response.success) {
        setSuccess('Profile updated successfully!');
        setEditing(false);
        setTimeout(() => setSuccess(null), 3000);
        // Refresh the page to get updated user info
        window.location.reload();
      } else {
        setError('Failed to update profile');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update profile';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate('/login', { replace: true });
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
          <Button 
            onClick={onClose} 
            variant="outline" 
            size="sm"
          >
            Close
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {userInfo.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{userInfo.fullName || 'User'}</h2>
              <p className="text-gray-600">{userInfo.email || 'user@example.com'}</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  userInfo.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {userInfo.role || 'USER'}
                </span>
              </div>
            </div>
            {!editing ? (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {editing ? (
                <Input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                  placeholder="Enter your full name"
                  disabled={saving}
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900 py-2">{userInfo.fullName || 'N/A'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              {editing ? (
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="Enter your email"
                  disabled={saving}
                  className="w-full"
                />
              ) : (
                <p className="text-gray-900 py-2">{userInfo.email || 'N/A'}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <p className="text-gray-900 py-2">{userInfo.username || 'N/A'}</p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <p className="text-gray-900 py-2">
                {departmentName || 'No department assigned'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;