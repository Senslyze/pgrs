import React, { useState, useEffect } from 'react';
import { useCreateTicket, useUpdateTicket } from '@/hooks/useTickets';
import type { Ticket, CreateTicketRequest, UpdateTicketRequest, TicketType, TicketPriority, TicketStatus, User, Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTicket?: Ticket | null;
  users: User[];
  departments: Department[];
  onTicketCreated: (ticket: Ticket) => void;
  onTicketUpdated: (ticket: Ticket) => void;
  // New props for grievance assignment
  isGrievanceAssignment?: boolean;
  selectedGrievance?: any;
  onGrievanceAssigned?: (grievanceId: string, assignedTo: string, departmentId: string) => void;
}

const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  editingTicket,
  users,
  departments,
  onTicketCreated,
  onTicketUpdated,
  isGrievanceAssignment = false,
  selectedGrievance,
  onGrievanceAssigned: _onGrievanceAssigned
}) => {
  const createTicketMutation = useCreateTicket();
  const updateTicketMutation = useUpdateTicket();
  
  const loading = createTicketMutation.isPending || updateTicketMutation.isPending;
  const error = createTicketMutation.error || updateTicketMutation.error;
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    type: 'COMPLAINT' as TicketType,
    priority: 'MEDIUM' as TicketPriority,
    status: 'OPEN' as TicketStatus,
    assignedTo: '',
    departmentId: '',
    tags: '',
    dueDate: '',
  });
  
  // Department-based user filtering
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Filter users based on selected department
  useEffect(() => {
    if (ticketForm.departmentId) {
      const departmentUsers = users.filter(user => user.departmentId === ticketForm.departmentId);
      setFilteredUsers(departmentUsers);
      if (ticketForm.assignedTo && !departmentUsers.find(user => user.id === ticketForm.assignedTo)) {
        setTicketForm(prev => ({ ...prev, assignedTo: '' }));
      }
    } else {
      setFilteredUsers([]);
      setTicketForm(prev => ({ ...prev, assignedTo: '' }));
    }
  }, [ticketForm.departmentId, users]);

  // Reset form when modal opens/closes or editing ticket changes
  useEffect(() => {
    if (isOpen) {
      if (isGrievanceAssignment && selectedGrievance) {
        // For grievance assignment, pre-fill with grievance data
        setTicketForm({
          title: selectedGrievance.subject || '',
          description: selectedGrievance.description || '',
          type: 'COMPLAINT',
          priority: 'MEDIUM',
          status: 'ASSIGNED',
          assignedTo: '',
          departmentId: '',
          tags: '',
          dueDate: '',
        });
      } else if (editingTicket) {
        setTicketForm({
          title: editingTicket.title,
          description: editingTicket.description,
          type: editingTicket.type,
          priority: editingTicket.priority,
          status: editingTicket.status,
          assignedTo: editingTicket.assignedTo || '',
          departmentId: editingTicket.departmentId || '',
          tags: editingTicket.tags?.join(', ') || '',
          dueDate: editingTicket.dueDate ? editingTicket.dueDate.split('T')[0] : '',
        });
      } else {
        setTicketForm({
          title: '',
          description: '',
          type: 'COMPLAINT',
          priority: 'MEDIUM',
          status: 'OPEN',
          assignedTo: '',
          departmentId: '',
          tags: '',
          dueDate: '',
        });
      }
    }
  }, [isOpen, editingTicket, isGrievanceAssignment, selectedGrievance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isGrievanceAssignment && selectedGrievance) {
        // Create ticket from grievance
        if (!ticketForm.assignedTo || !ticketForm.departmentId) {
          return;
        }
        
        // Validate that grievanceId is present
        if (!selectedGrievance.id) {
          return;
        }
        
        const ticketData = {
          title: selectedGrievance.subject,
          description: selectedGrievance.description || selectedGrievance.subject,
          type: 'COMPLAINT' as TicketType,
          priority: (selectedGrievance.priority || 'MEDIUM') as TicketPriority,
          status: 'ASSIGNED' as TicketStatus,
          assignedTo: ticketForm.assignedTo,
          departmentId: ticketForm.departmentId,
          tags: [],
          dueDate: undefined,
          grievanceId: selectedGrievance.id
        };
        
        console.log('✅ Creating ticket with ASSIGNED status:', ticketData);
        console.log('✅ Status being sent:', ticketData.status);
        console.log('✅ Assigned to user:', ticketData.assignedTo);
        console.log('✅ Department:', ticketData.departmentId);
        console.log('✅ Grievance ID:', ticketData.grievanceId);

        // Ensure type and priority are correct enums, and grievanceId is included
        const createTicketPayload: CreateTicketRequest = {
          ...ticketData,
          type: 'COMPLAINT',
          priority: ticketData.priority || 'MEDIUM',
          grievanceId: ticketData.grievanceId,
        };

        if (!createTicketPayload.grievanceId) {
          return;
        }

        const response = await createTicketMutation.mutateAsync(createTicketPayload);
        if (onTicketCreated) {
          onTicketCreated(response.data);
        }
        onClose();
      } else {
        // Validate required fields for ticket creation/update
        if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
          return;
        }

        const ticketData = {
          ...ticketForm,
          tags: ticketForm.tags ? ticketForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
          assignedTo: ticketForm.assignedTo || undefined,
          departmentId: ticketForm.departmentId || undefined,
          dueDate: ticketForm.dueDate || undefined,
        };

        if (editingTicket) {
          const updateData: UpdateTicketRequest = ticketData;
          const response = await updateTicketMutation.mutateAsync({
            id: editingTicket.id,
            ticketData: updateData,
          });
          onTicketUpdated(response.data);
        } else {
          const createData: CreateTicketRequest = ticketData;
          const response = await createTicketMutation.mutateAsync(createData);
          onTicketCreated(response.data);
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Ticket save error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isGrievanceAssignment ? 'Assign Ticket' : 
               editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
            </h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {(error as any)?.response?.data?.message || 
               (error as any)?.response?.data?.error || 
               (error as any)?.message || 
               'Failed to save ticket'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isGrievanceAssignment && (
              <>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={ticketForm.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ticket title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={ticketForm.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ticket description"
                    required
                  />
                </div>
              </>
            )}

            {!isGrievanceAssignment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={ticketForm.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="COMPLAINT">Complaint</option>
                    <option value="REQUEST">Request</option>
                    <option value="INQUIRY">Inquiry</option>
                    <option value="VIOLATION">Violation</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={ticketForm.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            )}

            {editingTicket && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={ticketForm.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={ticketForm.departmentId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department First</option>
                  {departments && departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {!ticketForm.departmentId && (
                  <p className="text-sm text-gray-500 mt-1">Please select a department to see available officers</p>
                )}
              </div>

              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To Officer *
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={ticketForm.assignedTo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">
                    {!ticketForm.departmentId ? 'Select Department First' : 'Select Officer'}
                  </option>
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
                {ticketForm.departmentId && filteredUsers.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">No officers found in this department</p>
                )}
              </div>
            </div>

            {!isGrievanceAssignment && (
              <>
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={ticketForm.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={ticketForm.dueDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Saving...' : 
                 isGrievanceAssignment ? 'Assign Ticket' :
                 editingTicket ? 'Update Ticket' : 'Create Ticket'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default TicketModal;
