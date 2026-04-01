import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { createUserSchema, updateUserSchema } from '@/schemas';
import type { User, Department, CreateUserRequest, ApiError } from '@/types';
import { X, User as UserIcon, Mail, Lock, Shield, Building2 } from 'lucide-react';

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    return apiError.response?.data?.error || 
           apiError.response?.data?.message || 
           apiError.message || 
           'Failed to save user';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Failed to save user';
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: User | null;
  departments: Department[];
  onUserCreated: () => void;
  onUserUpdated: () => void;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  departments,
  onUserCreated,
  onUserUpdated
}) => {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: 'USER' as 'ADMIN' | 'USER',
      departmentId: null as string | null,
    },
    onSubmit: async ({ value }) => {
      try {
        if (editingUser) {
          // Clean the data for update - remove empty password
          const updateData: Partial<CreateUserRequest> = { ...value };
          if (!updateData.password || updateData.password.trim() === '') {
            delete updateData.password;
          }
          
          // If user is admin, remove departmentId (admins shouldn't have departments)
          if (updateData.role === 'ADMIN') {
            updateData.departmentId = null;
          }
          
          await updateUserMutation.mutateAsync({
            id: editingUser.id,
            userData: updateData,
          });
          onUserUpdated();
        } else {
          // For new users, if role is admin, remove departmentId
          const createData: CreateUserRequest = { ...value };
          if (createData.role === 'ADMIN') {
            createData.departmentId = null;
          }
          
          await createUserMutation.mutateAsync(createData);
          onUserCreated();
        }

        onClose();
      } catch (err: unknown) {
        console.error('Error saving user:', err);
        // Error handling is done by the mutation
      }
    },
  });

  // Reset form when modal opens/closes or editing user changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        // Reset form with all editing user values at once
        form.reset({
          username: editingUser.username || '',
          email: editingUser.email || '',
          fullName: editingUser.fullName || '',
          password: '',
          role: editingUser.role || 'USER',
          departmentId: editingUser.departmentId || null,
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, editingUser, form]);

  // Auto-clear department when admin role is selected
  useEffect(() => {
    if (form.state.values.role === 'ADMIN' && form.state.values.departmentId) {
      form.setFieldValue('departmentId', null);
    }
  }, [form.state.values.role, form.state.values.departmentId, form]);

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;
  const error = createUserMutation.error || updateUserMutation.error;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-0 shadow-2xl border-0 bg-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingUser ? 'Update user information' : 'Add a new user to the system'}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-red-600" />
                </div>
                <p className="text-sm text-red-700 font-medium">
                  {getErrorMessage(error)}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5"
          >
            {/* Username Field */}
            <form.Field
              name="username"
              validators={{
                onChange: ({ value }) => {
                  const schema = editingUser ? updateUserSchema : createUserSchema;
                  const result = schema.shape.username.safeParse(value);
                  if (!result.success) {
                    return result.error.issues[0]?.message;
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter username"
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      } rounded-lg transition-all duration-200`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Email Field */}
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  const schema = editingUser ? updateUserSchema : createUserSchema;
                  const result = schema.shape.email.safeParse(value);
                  if (!result.success) {
                    return result.error.issues[0]?.message;
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter email address"
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      } rounded-lg transition-all duration-200`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Full Name Field */}
            <form.Field
              name="fullName"
              validators={{
                onChange: ({ value }) => {
                  const schema = editingUser ? updateUserSchema : createUserSchema;
                  const result = schema.shape.fullName.safeParse(value);
                  if (!result.success) {
                    return result.error.issues[0]?.message;
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter full name"
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      } rounded-lg transition-all duration-200`}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Password Field */}
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  if (editingUser) {
                    // Password is optional for updates
                    return undefined;
                  } else {
                    // Password is required for new users
                    const result = createUserSchema.shape.password.safeParse(value);
                    if (!result.success) {
                      return result.error.issues[0]?.message;
                    }
                    return undefined;
                  }
                },
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password {!editingUser && '*'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      } rounded-lg transition-all duration-200`}
                      required={!editingUser}
                      disabled={isLoading}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-red-600">{field.state.meta.errors[0]}</p>
                  )}
                  {editingUser && (
                    <p className="text-xs text-gray-500">Leave blank to keep the current password</p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Role Field */}
            <form.Field name="role">
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Role *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Shield className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as 'ADMIN' | 'USER')}
                      disabled={isLoading}
                      className="w-full pl-10 h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200 bg-white"
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
              )}
            </form.Field>

            {/* Department Field */}
            <form.Field name="departmentId">
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={field.state.value || ''}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      disabled={isLoading || form.state.values.role === 'ADMIN'}
                      className="w-full pl-10 h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{form.state.values.role === 'ADMIN' ? 'Admins have no department' : 'No Department'}</option>
                      {departments && departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No departments available</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </form.Field>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{editingUser ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{editingUser ? 'Update User' : 'Create User'}</span>
                  </div>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
                className="px-6 h-11 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default UserModal;
