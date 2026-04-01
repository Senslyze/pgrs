import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUsers, useDepartments, useDeleteUser, useDeleteDepartment } from '@/hooks';
import { UserModal, DepartmentModal } from '@/components/modals';
import TicketManagement from '@/components/TicketManagement/TicketManagement';
import ViolationManagement from '@/components/ViolationManagement/ViolationManagement';
import AdminSidebar from './AdminSidebar';
import type { Department, User } from '@/types';
import { Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const Admin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<string>(sectionFromUrl || 'all-tickets');
  
  // Update active section when URL parameter changes
  useEffect(() => {
    if (sectionFromUrl) {
      setActiveSection(sectionFromUrl);
    }
  }, [sectionFromUrl]);
  
  // Update URL when active section changes (but don't override if coming from URL)
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSearchParams({ section });
  };

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Use React Query hooks
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers(1, 100);
  const { data: departmentsData, isLoading: departmentsLoading, error: departmentsError, refetch: refetchDepartments } = useDepartments(1, 100);
  const deleteUserMutation = useDeleteUser();
  const deleteDepartmentMutation = useDeleteDepartment();

  // Extract users and departments from response - handle different response structures
  const extractUsers = () => {
    if (!usersData) return [];
    
    // Handle different response structures
    if (Array.isArray(usersData)) {
      return usersData;
    }
    if (usersData.data) {
      if (Array.isArray(usersData.data)) {
        return usersData.data;
      }
      if (usersData.data.users && Array.isArray(usersData.data.users)) {
        return usersData.data.users;
      }
    }
    return [];
  };

  const extractDepartments = () => {
    if (!departmentsData) return [];
    
    // Handle different response structures
    if (Array.isArray(departmentsData)) {
      return departmentsData;
    }
    if (departmentsData.data) {
      // if (Array.isArray(departmentsData.data)) {
      //   return departmentsData.data;
      // }
      if (departmentsData.data.departments && Array.isArray(departmentsData.data.departments)) {
        return departmentsData.data.departments;
      }
    }
    return [];
  };

  const users = extractUsers();
  const departments = extractDepartments();
  
  // Separate loading states for better UX
  const usersLoadingState = usersLoading || deleteUserMutation.isPending;
  const departmentsLoadingState = departmentsLoading || deleteDepartmentMutation.isPending;

  // Debug API responses
  useEffect(() => {
    console.log('Users API Response:', usersData);
    console.log('Extracted Users:', users);
    console.log('Users Loading:', usersLoading);
    console.log('Users Error:', usersError);
  }, [usersData, users, usersLoading, usersError]);

  useEffect(() => {
    console.log('Departments API Response:', departmentsData);
    console.log('Extracted Departments:', departments);
    console.log('Departments Loading:', departmentsLoading);
    console.log('Departments Error:', departmentsError);
  }, [departmentsData, departments, departmentsLoading, departmentsError]);

  // Helper function to get department name by ID
  const getDepartmentName = (departmentId: string | null): string => {
    if (!departmentId) return 'No Department';
    
    // If departments haven't loaded yet, show the ID temporarily
    if (departments.length === 0) {
      return `Loading... (${departmentId.substring(0, 8)}...)`;
    }
    
    const department = departments.find(dept => dept.id === departmentId);
    console.log(`Looking for department ID: ${departmentId}, Found:`, department);
    return department ? department.name : `Unknown (${departmentId.substring(0, 8)}...)`;
  };

  // User management functions
  const handleUserCreated = () => {
      refetchUsers();
  };

  const handleUserUpdated = () => {
      setEditingUser(null);
      refetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteUserMutation.mutateAsync(id);
      refetchUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  // Department management functions
  const handleDepartmentCreated = () => {
    refetchDepartments();
  };

  const handleDepartmentUpdated = () => {
    setEditingDepartment(null);
    refetchDepartments();
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await deleteDepartmentMutation.mutateAsync(id);
      refetchDepartments();
    } catch (err: any) {
      console.error('Error deleting department:', err);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setShowDepartmentModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleCloseDepartmentModal = () => {
    setShowDepartmentModal(false);
    setEditingDepartment(null);
  };


  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'all-tickets':
        return <TicketManagement showMyTickets={false} />;
      case 'my-tickets':
        return <TicketManagement showMyTickets={true} />;
      case 'my-violations':
        return <ViolationManagement showMyViolations={true} />;
      case 'team-violations':
        return <ViolationManagement showMyViolations={false} showTeamViolations={true} />;
      case 'users':
        return renderUserManagement();
      case 'departments':
        return renderDepartmentManagement();
      default:
        return <TicketManagement showMyTickets={false} />;
    }
  };

  // Render user management section
  const renderUserManagement = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button onClick={handleAddUser} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersLoadingState ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : usersError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Error loading users: {(usersError as any)?.response?.data?.message || (usersError as any)?.message || 'Unknown error'}
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDepartmentName(user.departmentId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-blue-50 text-blue-600"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-red-50 text-red-600"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // Render department management section
  const renderDepartmentManagement = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Department Management</h2>
        <Button onClick={handleAddDepartment} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Departments Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departmentsLoadingState ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Loading departments...
                  </td>
                </tr>
              ) : departmentsError ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-red-500">
                    Error loading departments: {(departmentsError as any)?.response?.data?.message || (departmentsError as any)?.message || 'Unknown error'}
                  </td>
                </tr>
              ) : departments && departments.length > 0 ? (
                departments.map((department) => (
                  <tr key={department.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {department.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {department.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {department.subSubject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-blue-50 text-blue-600"
                            onClick={() => handleEditDepartment(department)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Department
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-red-50 text-red-600"
                            onClick={() => handleDeleteDepartment(department.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Department
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No departments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">

        {(usersError || departmentsError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            {usersError && (
              <p className="text-red-600 mb-2">
                Users Error: {(usersError as any)?.response?.data?.message || (usersError as any)?.message || 'Unknown error'}
              </p>
            )}
            {departmentsError && (
              <p className="text-red-600 mb-2">
                Departments Error: {(departmentsError as any)?.response?.data?.message || (departmentsError as any)?.message || 'Unknown error'}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {usersError && (
                <Button 
                  onClick={() => refetchUsers()} 
                  variant="outline" 
                  size="sm"
                >
                  Retry Users
                </Button>
              )}
              {departmentsError && (
                <Button 
                  onClick={() => refetchDepartments()} 
                  variant="outline" 
                  size="sm"
                >
                  Retry Departments
                </Button>
              )}
            </div>
          </div>
        )}


        {/* Main Layout with Sidebar */}
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <AdminSidebar 
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


      {/* Modal Components */}
      <UserModal
        isOpen={showUserModal}
        onClose={handleCloseUserModal}
        editingUser={editingUser}
        departments={departments}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />

      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={handleCloseDepartmentModal}
        editingDepartment={editingDepartment}
        onDepartmentCreated={handleDepartmentCreated}
        onDepartmentUpdated={handleDepartmentUpdated}
      />
    </div>
  );
};

export default Admin;
