import React, { useState, useEffect } from 'react';
import { departmentApi, userApi } from '@/services/api/admin';
import type { Department, User, UserRole } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserInfo } from '@/utils/auth';

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    subject: '',
    subSubject: ''
  });
  
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 'USER' as UserRole,
    departmentId: ''
  });
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Validation states
  const [departmentErrors, setDepartmentErrors] = useState<Record<string, string>>({});
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});
  
  // Search states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  const userInfo = getUserInfo();

  // Check if user is admin
  const isAdmin = userInfo?.role === 'ADMIN';

  // Filtered data based on search
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(departmentSearch.toLowerCase()) ||
    dept.subject.toLowerCase().includes(departmentSearch.toLowerCase()) ||
    dept.subSubject.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.departmentId && departments.find(d => d.id === user.departmentId)?.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [departmentsRes, usersRes] = await Promise.all([
        departmentApi.getDepartments(),
        userApi.getUsers()
      ]);
      
      setDepartments(departmentsRes.data.departments);
      setUsers(usersRes.data.users);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch data';
      setError(`Failed to fetch data: ${errorMsg}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Department form validation
  const validateDepartmentForm = (departmentData: any) => {
    const errors: Record<string, string> = {};
    
    if (!departmentData.name || departmentData.name.trim() === '') {
      errors.name = 'Department name is required';
    }
    
    if (!departmentData.subject || departmentData.subject.trim() === '') {
      errors.subject = 'Subject is required';
    }
    
    if (!departmentData.subSubject || departmentData.subSubject.trim() === '') {
      errors.subSubject = 'Sub-subject is required';
    }
    
    return errors;
  };

  // User form validation
  const validateUserForm = (userData: any, isEdit: boolean = false) => {
    const errors: Record<string, string> = {};
    
    if (!isEdit) {
      if (!userData.username || userData.username.trim() === '') {
        errors.username = 'Username is required';
      }
      
      if (!userData.password || userData.password.trim() === '') {
        errors.password = 'Password is required';
      } else if (userData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    
    if (!userData.fullName || userData.fullName.trim() === '') {
      errors.fullName = 'Full name is required';
    }
    
    if (!userData.email || userData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!userData.role) {
      errors.role = 'Role is required';
    }
    
    return errors;
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateDepartmentForm(newDepartment);
    if (Object.keys(errors).length > 0) {
      setDepartmentErrors(errors);
      return;
    }
    
    setDepartmentErrors({});
    
    try {
      // Clear previous messages
      setError(null);
      setSuccess(null);
      
      const departmentData = {
        name: newDepartment.name,
        subject: newDepartment.subject,
        subSubject: newDepartment.subSubject
      };
      
      const response = await departmentApi.createDepartment(departmentData);
      setDepartments([...departments, response.department]);
      setNewDepartment({ name: '', subject: '', subSubject: '' });
      setSuccess('Department created successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create department';
      setError(`Failed to create department: ${errorMsg}`);
      console.error('Create department error:', err);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;
    
    // Validate form
    const errors = validateDepartmentForm(editingDepartment);
    if (Object.keys(errors).length > 0) {
      setDepartmentErrors(errors);
      return;
    }
    
    setDepartmentErrors({});
    
    try {
      setError(null);
      setSuccess(null);
      
      const departmentData = {
        name: editingDepartment.name,
        subject: editingDepartment.subject,
        subSubject: editingDepartment.subSubject
      };
      
      const response = await departmentApi.updateDepartment(editingDepartment.id, departmentData);
      setDepartments(departments.map(dept => dept.id === editingDepartment.id ? response.department : dept));
      setEditingDepartment(null);
      setSuccess('Department updated successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update department';
      setError(`Failed to update department: ${errorMsg}`);
      console.error('Update department error:', err);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      // Check if department has users assigned
      const hasUsers = users.some(user => user.departmentId === id);
      if (hasUsers) {
        setError('Cannot delete department with assigned users. Please reassign or delete users first.');
        return;
      }
      
      await departmentApi.deleteDepartment(id);
      setDepartments(departments.filter(dept => dept.id !== id));
      setSuccess('Department deleted successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete department';
      setError(`Failed to delete department: ${errorMsg}`);
      console.error('Delete department error:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateUserForm(newUser, false);
    if (Object.keys(errors).length > 0) {
      setUserErrors(errors);
      return;
    }
    
    setUserErrors({});
    
    try {
      // Clear previous messages
      setError(null);
      setSuccess(null);
      
      const response = await userApi.createUser({
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        password: newUser.password,
        role: newUser.role,
        departmentId: newUser.departmentId || null
      });
      setUsers([...users, response.data]);
      setNewUser({ username: '', email: '', fullName: '', password: '', role: 'USER', departmentId: '' });
      setSuccess('User created successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create user';
      setError(`Failed to create user: ${errorMsg}`);
      console.error('Create user error:', err);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Validate form
    const errors = validateUserForm(editingUser, true);
    if (Object.keys(errors).length > 0) {
      setUserErrors(errors);
      return;
    }
    
    setUserErrors({});
    
    try {
      setError(null);
      setSuccess(null);
      
      const userData = {
        email: editingUser.email,
        fullName: editingUser.fullName,
        role: editingUser.role,
        departmentId: editingUser.departmentId
      };
      
      const response = await userApi.updateUser(editingUser.id, userData);
      setUsers(users.map(user => user.id === editingUser.id ? response.data : user));
      setEditingUser(null);
      setSuccess('User updated successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update user';
      setError(`Failed to update user: ${errorMsg}`);
      console.error('Update user error:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      await userApi.deleteUser(id);
      setUsers(users.filter(user => user.id !== id));
      setSuccess('User deleted successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete user';
      setError(`Failed to delete user: ${errorMsg}`);
      console.error('Delete user error:', err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Department & User Management</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {/* Department Management */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-bold">Departments</h2>
          <div className="mt-2 md:mt-0">
            <Input
              type="text"
              placeholder="Search departments..."
              value={departmentSearch}
              onChange={(e) => setDepartmentSearch(e.target.value)}
              className="w-full md:w-64"
            />
          </div>
        </div>
        
        {/* Create/Edit Department Form */}
        <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment} className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-3">{editingDepartment ? 'Edit Department' : 'Create New Department'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={editingDepartment ? editingDepartment.name : newDepartment.name}
                onChange={(e) => {
                  if (editingDepartment) {
                    setEditingDepartment({...editingDepartment, name: e.target.value});
                  } else {
                    setNewDepartment({...newDepartment, name: e.target.value});
                  }
                  // Clear error when user types
                  if (departmentErrors.name) {
                    setDepartmentErrors({...departmentErrors, name: ''});
                  }
                }}
                placeholder="Department name"
              />
              {departmentErrors.name && <p className="text-red-500 text-xs mt-1">{departmentErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                value={editingDepartment ? editingDepartment.subject : newDepartment.subject}
                onChange={(e) => {
                  if (editingDepartment) {
                    setEditingDepartment({...editingDepartment, subject: e.target.value});
                  } else {
                    setNewDepartment({...newDepartment, subject: e.target.value});
                  }
                  // Clear error when user types
                  if (departmentErrors.subject) {
                    setDepartmentErrors({...departmentErrors, subject: ''});
                  }
                }}
                placeholder="Subject"
              />
              {departmentErrors.subject && <p className="text-red-500 text-xs mt-1">{departmentErrors.subject}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sub-Subject</label>
              <Input
                value={editingDepartment ? editingDepartment.subSubject : newDepartment.subSubject}
                onChange={(e) => {
                  if (editingDepartment) {
                    setEditingDepartment({...editingDepartment, subSubject: e.target.value});
                  } else {
                    setNewDepartment({...newDepartment, subSubject: e.target.value});
                  }
                  // Clear error when user types
                  if (departmentErrors.subSubject) {
                    setDepartmentErrors({...departmentErrors, subSubject: ''});
                  }
                }}
                placeholder="Sub-subject"
              />
              {departmentErrors.subSubject && <p className="text-red-500 text-xs mt-1">{departmentErrors.subSubject}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button type="submit">
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
            {editingDepartment && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingDepartment(null);
                  setDepartmentErrors({});
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
        
        {/* Departments List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <tr key={dept.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{dept.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{dept.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{dept.subSubject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => {
                          setEditingDepartment(dept);
                          setDepartmentErrors({});
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    {departmentSearch ? 'No departments found matching your search.' : 'No departments found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* User Management */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-bold">Users</h2>
          <div className="mt-2 md:mt-0">
            <Input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full md:w-64"
            />
          </div>
        </div>
        
        {/* Create/Edit User Form */}
        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-3">{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {!editingUser && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => {
                      setNewUser({...newUser, username: e.target.value});
                      if (userErrors.username) {
                        setUserErrors({...userErrors, username: ''});
                      }
                    }}
                    placeholder="Username"
                  />
                  {userErrors.username && <p className="text-red-500 text-xs mt-1">{userErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => {
                      setNewUser({...newUser, password: e.target.value});
                      if (userErrors.password) {
                        setUserErrors({...userErrors, password: ''});
                      }
                    }}
                    placeholder="Password"
                  />
                  {userErrors.password && <p className="text-red-500 text-xs mt-1">{userErrors.password}</p>}
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                value={editingUser ? editingUser.fullName : newUser.fullName}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({...editingUser, fullName: e.target.value});
                  } else {
                    setNewUser({...newUser, fullName: e.target.value});
                  }
                  // Clear error when user types
                  if (userErrors.fullName) {
                    setUserErrors({...userErrors, fullName: ''});
                  }
                }}
                placeholder="Full name"
              />
              {userErrors.fullName && <p className="text-red-500 text-xs mt-1">{userErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={editingUser ? editingUser.email : newUser.email}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({...editingUser, email: e.target.value});
                  } else {
                    setNewUser({...newUser, email: e.target.value});
                  }
                  // Clear error when user types
                  if (userErrors.email) {
                    setUserErrors({...userErrors, email: ''});
                  }
                }}
                placeholder="Email"
              />
              {userErrors.email && <p className="text-red-500 text-xs mt-1">{userErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={editingUser ? editingUser.role : newUser.role}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({...editingUser, role: e.target.value as UserRole});
                  } else {
                    setNewUser({...newUser, role: e.target.value as UserRole});
                  }
                  // Clear error when user types
                  if (userErrors.role) {
                    setUserErrors({...userErrors, role: ''});
                  }
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
              {userErrors.role && <p className="text-red-500 text-xs mt-1">{userErrors.role}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                value={editingUser ? (editingUser.departmentId || '') : newUser.departmentId}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({...editingUser, departmentId: e.target.value || null});
                  } else {
                    setNewUser({...newUser, departmentId: e.target.value});
                  }
                }}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button type="submit">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
            {editingUser && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditingUser(null);
                  setUserErrors({});
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
        
        {/* Users List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.departmentId 
                        ? departments.find(d => d.id === user.departmentId)?.name || user.departmentId
                        : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => {
                          setEditingUser(user);
                          setUserErrors({});
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {userSearch ? 'No users found matching your search.' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DepartmentManagement;