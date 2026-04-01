import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreateDepartment, useUpdateDepartment } from '@/hooks/useDepartments';
import { departmentSchema } from '@/schemas';
import type { Department } from '@/types';
import { X, Building2, FileText, Tag } from 'lucide-react';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDepartment: Department | null;
  onDepartmentCreated: () => void;
  onDepartmentUpdated: () => void;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  editingDepartment,
  onDepartmentCreated,
  onDepartmentUpdated
}) => {
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();

  const form = useForm({
    defaultValues: {
      name: '',
      subject: '',
      subSubject: '',
    },
    onSubmit: async ({ value }) => {
      try {
        if (editingDepartment) {
          await updateDepartmentMutation.mutateAsync({
            id: editingDepartment.id,
            departmentData: value,
          });
          onDepartmentUpdated();
        } else {
          await createDepartmentMutation.mutateAsync(value);
          onDepartmentCreated();
        }

        onClose();
      } catch (err: any) {
        console.error('Error saving department:', err);
        // Error handling is done by the mutation
      }
    },
  });

  // Reset form when modal opens/closes or editing department changes
  useEffect(() => {
    if (isOpen) {
      if (editingDepartment) {
        form.setFieldValue('name', editingDepartment.name);
        form.setFieldValue('subject', editingDepartment.subject);
        form.setFieldValue('subSubject', editingDepartment.subSubject);
      } else {
        form.reset();
      }
    }
  }, [isOpen, editingDepartment, form]);

  const isLoading = createDepartmentMutation.isPending || updateDepartmentMutation.isPending;
  const error = createDepartmentMutation.error || updateDepartmentMutation.error;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-0 shadow-2xl border-0 bg-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDepartment ? 'Edit Department' : 'Create New Department'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingDepartment ? 'Update department information' : 'Add a new department to the system'}
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
                  {(error as any)?.response?.data?.message || 'Failed to save department'}
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
            {/* Department Name Field */}
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  const result = departmentSchema.shape.name.safeParse(value);
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
                    Department Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter department name"
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
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

            {/* Subject Field */}
            <form.Field
              name="subject"
              validators={{
                onChange: ({ value }) => {
                  const result = departmentSchema.shape.subject.safeParse(value);
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
                    Subject *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter subject"
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
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

            {/* Sub Subject Field */}
            <form.Field
              name="subSubject"
              validators={{
                onChange: ({ value }) => {
                  const result = departmentSchema.shape.subSubject.safeParse(value);
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
                    Sub Subject *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Enter sub subject"
                      className={`pl-10 h-11 border-2 ${
                        field.state.meta.errors.length > 0
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
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

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 h-11 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{editingDepartment ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>{editingDepartment ? 'Update Department' : 'Create Department'}</span>
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

export default DepartmentModal;
