import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '@/utils/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const userInfo = getUserInfo();
  const navigate = useNavigate();
  
  const isAdmin = userInfo?.role === 'ADMIN';
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {userInfo?.fullName || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {userInfo?.email || 'N/A'}</p>
            <p><span className="font-medium">Role:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                userInfo?.role === 'ADMIN' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {userInfo?.role || 'USER'}
              </span>
            </p>
            {userInfo?.departmentId && (
              <p><span className="font-medium">Department ID:</span> {userInfo.departmentId}</p>
            )}
          </div>
        </Card>
        
        {/* Grievance Statistics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Grievance Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Grievances</span>
              <span className="font-medium">24</span>
            </div>
            <div className="flex justify-between">
              <span>Pending</span>
              <span className="font-medium text-yellow-600">8</span>
            </div>
            <div className="flex justify-between">
              <span>In Progress</span>
              <span className="font-medium text-blue-600">10</span>
            </div>
            <div className="flex justify-between">
              <span>Resolved</span>
              <span className="font-medium text-green-600">6</span>
            </div>
          </div>
        </Card>
        
        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full" variant="outline">
              Create New Grievance
            </Button>
            <Button className="w-full" variant="outline">
              View All Grievances
            </Button>
          </div>
        </Card>
        
        {/* Department Info (for users with departments) */}
        {userInfo?.departmentId && (
          <Card className="p-6 md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Department Information</h2>
            <p>You are assigned to department: {userInfo.departmentId}</p>
            <p className="mt-2 text-sm text-gray-600">
              You can only view and manage grievances related to your department.
            </p>
          </Card>
        )}
        
        {/* Admin Panel Access (for admins) */}
        {isAdmin && (
          <Card className="p-6 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-4">Administrator Panel</h2>
            <p className="mb-4">As an administrator, you have access to all system features including user and department management.</p>
            <Button onClick={() => navigate('/admin?section=departments')}>
              Go to Department Management
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;