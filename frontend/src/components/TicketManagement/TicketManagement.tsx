import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ticketApi, departmentApi, userApi } from '@/services/api/admin';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, MoreVertical, Edit } from 'lucide-react';
import { StatusChangeModal, TicketModal } from '@/components/modals';
import type { Ticket, Department, GrievanceData, User, TicketStatus, TicketPriority } from '@/types';

type TicketWithReportId = Ticket & { report_id?: string; reopenCount?: number };

interface TicketManagementProps {
  showMyTickets?: boolean;
  showCompleted?: boolean;
  showReopened?: boolean; // Shows RESPONDED tickets (legacy name, but shows responded)
  showActualReopened?: boolean; // Shows RE_OPENED tickets (for future use)
  onCreateTicket?: () => void;
}

const TicketManagement: React.FC<TicketManagementProps> = ({ 
  showMyTickets = false, 
  showCompleted = false, 
  showReopened = false,
  showActualReopened = false
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
    const [allTickets, setAllTickets] = useState<TicketWithReportId[]>([]); // Store all fetched tickets
  const [tickets, setTickets] = useState<TicketWithReportId[]>([]); // Filtered tickets for display
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs to prevent duplicate API calls
  const isLoadingTicketsRef = useRef(false);
  const isLoadingDepartmentsRef = useRef(false);
  const isLoadingUsersRef = useRef(false);
  const isUpdatingFromUrlRef = useRef(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    department: searchParams.get('department') || '',
    searchTerm: searchParams.get('search') || '',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  
  // Update URL params when filters or page change (but not when updating from URL)
  useEffect(() => {
    if (isUpdatingFromUrlRef.current) {
      isUpdatingFromUrlRef.current = false;
      return;
    }
    
    const params = new URLSearchParams(searchParams);
    if (filters.status) {
      params.set('status', filters.status);
    } else {
      params.delete('status');
    }
    if (filters.priority) {
      params.set('priority', filters.priority);
    } else {
      params.delete('priority');
    }
    if (filters.department) {
      params.set('department', filters.department);
    } else {
      params.delete('department');
    }
    if (filters.searchTerm) {
      params.set('search', filters.searchTerm);
    } else {
      params.delete('search');
    }
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    } else {
      params.delete('page');
    }
    
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams, searchParams]);
  
  useEffect(() => {
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const department = searchParams.get('department') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    let shouldUpdate = false;
    setFilters(prev => {
      if (prev.status !== status || prev.priority !== priority || 
          prev.department !== department || prev.searchTerm !== search) {
        shouldUpdate = true;
        return { status, priority, department, searchTerm: search };
      }
      return prev;
    });
    
    if (currentPage !== page) {
      shouldUpdate = true;
      setCurrentPage(page);
    }
    
    if (shouldUpdate) {
      isUpdatingFromUrlRef.current = true;
    }
  }, [searchParams, currentPage]);

  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithReportId | null>(null);
  const [selectedCurrentStatus, setSelectedCurrentStatus] = useState('');

  // Grievance assignment modal
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceData | null>(null);
  
  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<TicketWithReportId | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');

  // Load users for assignment (only when needed)
  const loadUsers = useCallback(async () => {
    // Only load users if we're not showing "My Tickets" 
    // because "My Tickets" view doesn't need user data for assignment
    if (showMyTickets) {
      console.log('Skipping users load for My Tickets view');
      return;
    }

    // Prevent duplicate calls
    if (isLoadingUsersRef.current) {
      console.log('Users already loading, skipping duplicate call');
      return;
    }

    try {
      isLoadingUsersRef.current = true;
      const response = await userApi.getUsers(1, 100);
      
      // Handle different response structures
      let usersList: User[];
      if (Array.isArray(response.data)) {
        // If response.data is directly an array
        usersList = response.data as User[];
      } else if (response.data.users) {
        // If response.data has a users property
        usersList = response.data.users;
      } else {
        // Fallback
        usersList = [];
      }
      
      setUsers(usersList);
    } catch (err: any) {
      console.error('Error loading users:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      isLoadingUsersRef.current = false;
    }
  }, [showMyTickets]);


  const loadTickets = useCallback(async () => {
    // Prevent duplicate calls
    if (isLoadingTicketsRef.current) {
      console.log('Tickets already loading, skipping duplicate call');
      return;
    }
    
    try {
      isLoadingTicketsRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('Loading tickets - showMyTickets:', showMyTickets);
      
      let response;
      let ticketsData: any[] = [];
      let paginationData: any = null;
      
      if (showMyTickets) {
        // Use ticket API to get assigned tickets for the officer
        response = await ticketApi.getMyTickets(1, 1000);
        
        // Handle response structure - API returns { tickets: [], pagination: {} } or { success: true, data: { tickets: [], pagination: {} } }
        const responseData = response as any;
        if (responseData.success && responseData.data) {
          // Wrapped response structure
          ticketsData = responseData.data.tickets || [];
          paginationData = responseData.data.pagination;
        } else if (responseData.tickets) {
          // Direct response structure
          ticketsData = responseData.tickets || [];
          paginationData = responseData.pagination;
        }
      } else {
        // Admin view: Load all tickets with filters
        const apiFilters: any = {};
        if (filters.status) apiFilters.status = filters.status;
        if (filters.priority) apiFilters.priority = filters.priority;
        if (filters.department) {
          // Find department ID from name
          const dept = departments.find(d => d.name === filters.department || d.id === filters.department);
          if (dept) apiFilters.departmentId = dept.id;
        }
        
        response = await ticketApi.getTickets(currentPage, limit, apiFilters);
        
        // Handle response structure
        const responseData = response as any;
        if (responseData.success && responseData.data) {
          ticketsData = responseData.data.tickets || [];
          paginationData = responseData.data.pagination;
        } else if (responseData.tickets) {
          ticketsData = responseData.tickets || [];
          paginationData = responseData.pagination;
        } else if (responseData.data?.tickets) {
          ticketsData = responseData.data.tickets || [];
          paginationData = responseData.data.pagination;
        }
      }
      
      console.log('Tickets data loaded:', ticketsData.length, 'tickets');
      
      // Map API response to Ticket interface
      const mappedTickets: TicketWithReportId[] = ticketsData.map((ticket: any) => ({
        id: ticket.id,
        title: ticket.grievance?.subject || ticket.title || ticket.description || 'No Title',
        description: ticket.description || ticket.grievance?.subject || '',
        type: ticket.type || 'COMPLAINT' as const,
        status: ticket.status as TicketStatus,
        priority: ticket.priority as TicketPriority,
        assignedTo: ticket.assignedTo || undefined,
        assignedToUser: ticket.assignedUser || ticket.assignedToUser ? {
          id: (ticket.assignedUser || ticket.assignedToUser).id,
          username: (ticket.assignedUser || ticket.assignedToUser).username,
          email: (ticket.assignedUser || ticket.assignedToUser).email,
          fullName: (ticket.assignedUser || ticket.assignedToUser).fullName,
          role: (ticket.assignedUser || ticket.assignedToUser).role || 'USER' as const,
          departmentId: (ticket.assignedUser || ticket.assignedToUser).departmentId || null,
          createdAt: (ticket.assignedUser || ticket.assignedToUser).createdAt || '',
          updatedAt: (ticket.assignedUser || ticket.assignedToUser).updatedAt || ''
        } : undefined,
        createdBy: ticket.createdUserId || ticket.createdBy || ticket.createdUser?.id || '',
        createdByUser: ticket.createdUser ? {
          id: ticket.createdUser.id,
          username: ticket.createdUser.username,
          email: ticket.createdUser.email,
          fullName: ticket.createdUser.fullName,
          role: ticket.createdUser.role || 'USER' as const,
          departmentId: ticket.createdUser.departmentId || null,
          createdAt: ticket.createdUser.createdAt || '',
          updatedAt: ticket.createdUser.updatedAt || ''
        } : undefined,
        departmentId: ticket.departmentId || ticket.department?.id || undefined,
        department: ticket.department ? {
          id: ticket.department.id,
          name: ticket.department.name,
          subject: ticket.department.subject || '',
          subSubject: ticket.department.subSubject || '',
          createdAt: ticket.department.createdAt || '',
          updatedAt: ticket.department.updatedAt || ''
        } : undefined,
        createdAt: ticket.AssignedAt || ticket.createdAt || ticket.updatedAt || new Date().toISOString(),
        updatedAt: ticket.updatedAt || new Date().toISOString(),
        resolvedAt: ticket.resolvedAt || undefined,
        closedAt: ticket.closedAt || undefined,
        grievanceId: ticket.grievanceId || ticket.grievance?.id || undefined,
        report_id: ticket.grievance?.report_id || ticket.report_id || undefined
      }));
      
      // Sort tickets by createdAt in descending order (newest first)
      mappedTickets.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      
      setAllTickets(mappedTickets);
      
      if (paginationData) {
        setTotalPages(paginationData.totalPages || paginationData.total_pages || 1);
        setTotalCount(paginationData.total || paginationData.total_count || mappedTickets.length);
      } else {
        setTotalCount(mappedTickets.length);
      }
        setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load tickets';
      setError(errorMsg);
      console.error('Load tickets error:', err);
      setAllTickets([]);
    } finally {
      setLoading(false);
      isLoadingTicketsRef.current = false;
    }
  }, [showMyTickets, filters, currentPage, limit, departments]); // Include filters and departments for admin view

  // Apply client-side filtering and pagination
  useEffect(() => {
    let filteredTickets = [...allTickets];
    
    // Apply completed/responded/reopened filters (for My Tickets view)
    // These filters are applied client-side after fetching all "My Tickets"
    if (showMyTickets) {
      if (showCompleted) {
        // Completed tickets: Show only RESOLVED status
        filteredTickets = filteredTickets.filter((t: TicketWithReportId) => t.status === 'RESOLVED');
      }
      if (showReopened) {
        // Responded tickets: Show only RESPONDED status
        filteredTickets = filteredTickets.filter((t: TicketWithReportId) => t.status === 'RESPONDED');
      }
      if (showActualReopened) {
        // Reopened tickets: Show only RE_OPENED status (for future use)
        filteredTickets = filteredTickets.filter((t: TicketWithReportId) => t.status === 'RE_OPENED');
      }
    }
    
    // For admin view, filters are applied server-side, but we still apply search client-side
    // For user view, apply all filters client-side
    if (showMyTickets) {
      // Apply status filter (client-side for user view)
      if (filters.status) {
        filteredTickets = filteredTickets.filter((t: TicketWithReportId) => t.status === filters.status);
      }
      
      // Apply priority filter (client-side for user view)
      if (filters.priority) {
        filteredTickets = filteredTickets.filter((t: TicketWithReportId) => t.priority === filters.priority);
      }
      
      // Apply department filter (client-side for user view)
      if (filters.department) {
        filteredTickets = filteredTickets.filter((t: TicketWithReportId) => 
          t.department?.id === filters.department || t.department?.name === filters.department
        );
      }
    }
    
    // Apply search filter (always client-side)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredTickets = filteredTickets.filter((t: TicketWithReportId) => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.assignedToUser?.fullName?.toLowerCase().includes(searchLower) ||
        t.id.toLowerCase().includes(searchLower) ||
        t.report_id?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort tickets by createdAt in descending order (newest first)
    filteredTickets.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
    
    // For admin view with server-side pagination, use tickets as-is
    if (showMyTickets) {
      const totalFiltered = filteredTickets.length;
      const totalPagesCount = Math.ceil(totalFiltered / limit);
      setTotalCount(totalFiltered);
      setTotalPages(totalPagesCount);
      
      // Apply pagination
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
      
      setTickets(paginatedTickets);
    } else {
      // Admin view: tickets are already paginated from server, just apply search filter
      setTickets(filteredTickets);
    }
  }, [allTickets, filters, currentPage, showMyTickets, showCompleted, showReopened, showActualReopened, limit]);

  // Load departments (only for admin views that need filtering)
  const loadDepartments = useCallback(async () => {
    // Only load departments if we're not showing "My Tickets" 
    // because "My Tickets" view doesn't need department data for filtering
    if (showMyTickets) {
      console.log('Skipping departments load for My Tickets view');
      return;
    }

    // Prevent duplicate calls
    if (isLoadingDepartmentsRef.current) {
      console.log('Departments already loading, skipping duplicate call');
      return;
    }

    try {
      isLoadingDepartmentsRef.current = true;
      console.log('Loading departments in TicketManagement...');
      const departmentsResponse = await departmentApi.getDepartments(1, 100);
      console.log('Departments API response:', departmentsResponse);
      
      if (departmentsResponse) {
        // Handle different response structures
        let departmentsArray: Department[];
        if (Array.isArray(departmentsResponse.data)) {
          // If response.data is directly an array
          departmentsArray = departmentsResponse.data as Department[];
          console.log('Departments array (direct):', departmentsArray);
        } else if (departmentsResponse.data && departmentsResponse.data.departments) {
          // If response.data has a departments property
          departmentsArray = departmentsResponse.data.departments as Department[];
          console.log('Departments array (nested):', departmentsArray);
        } else {
          console.error('Unexpected departments response structure:', departmentsResponse.data);
          departmentsArray = [];
        }
        
        setDepartments(departmentsArray);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
    } finally {
      isLoadingDepartmentsRef.current = false;
    }
  }, [showMyTickets]);

  // Load data on mount and when key dependencies change
  useEffect(() => {
    loadTickets();
  }, [loadTickets]); // loadTickets only changes when showMyTickets, showCompleted, showReopened, or showActualReopened change

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);



  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      department: '',
      searchTerm: '',
    });
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    params.delete('status');
    params.delete('priority');
    params.delete('department');
    params.delete('search');
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  // Handle status update (opens modal)
  const handleUpdateStatus = (ticket: TicketWithReportId) => {
    setSelectedTicket(ticket);
    setSelectedCurrentStatus(ticket.status);
    setShowStatusModal(true);
  };

  // Handle status update with comment
  const handleStatusUpdateWithComment = async (id: string, newStatus: string, comment: string) => {
    try {
      setError(null);
      setSuccess(null);
      
      // RESTRICTION: Users can only set IN_PROGRESS, RESPONDED, or RESOLVED
      if (showMyTickets) {
        const allowedStatuses = ['IN_PROGRESS', 'RESPONDED', 'RESOLVED'];
        if (!allowedStatuses.includes(newStatus)) {
          setError('You can only update status to IN_PROGRESS, RESPONDED, or RESOLVED');
          return;
        }
        
        // RESTRICTION: RESPONDED and RESOLVED require comment
        if ((newStatus === 'RESPONDED' || newStatus === 'RESOLVED') && !comment.trim()) {
          setError('Comment is required for RESPONDED and RESOLVED status');
          return;
        }
      }
      
      console.log('Updating ticket status for:', id, 'to:', newStatus, 'with comment:', comment);
      
      // Use ticket API for ticket status updates
      const response = await ticketApi.updateTicketStatus(id, newStatus, comment);
      
      // Handle response structure: { message: string, ticket: {...} } or { success: boolean, data: {...} }
      const responseData = response as any;
      
      // Check if update was successful (either by message or success flag)
      if (responseData.message || (responseData.success && responseData.data)) {
        const successMessage = responseData.message || 'Status updated successfully!';
        setSuccess(successMessage);
        setError(null); // Clear any previous errors
        setTimeout(() => setSuccess(null), 3000);
        
        // Reload data to reflect the change
        await loadTickets();
      } else {
        setError('Failed to update status');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update status';
      setError(errorMsg);
      console.error('Update status error:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };
  

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedTicketForAssign(null);
    setSelectedDepartmentId('');
    setSelectedOfficerId('');
  };

  // Handle ticket assignment
  const handleAssignTicket = async () => {
    if (!selectedTicketForAssign || !selectedOfficerId || !selectedDepartmentId) {
      setError('Please select both department and officer');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      console.log('Assigning ticket:', selectedTicketForAssign.id, 'to user:', selectedOfficerId, 'departmentId:', selectedDepartmentId);
      
      const response = await ticketApi.assignTicket(selectedTicketForAssign.id, selectedOfficerId, selectedDepartmentId);
      
      console.log('Ticket assignment response:', response);
      
      // Handle different response structures
      const responseData = response as any;
      if (responseData.success || responseData.ticket || responseData.message) {
        const successMessage = responseData.message || 'Ticket assigned successfully!';
        setSuccess(successMessage);
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
        // Reload tickets to reflect the assignment
        await loadTickets();
        handleCloseAssignModal();
      } else {
        setError('Failed to assign ticket');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to assign ticket';
      setError(errorMsg);
      console.error('Assignment error:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Close status modal
  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedTicket(null);
    setSelectedCurrentStatus('');
  };

  const handleViewTicket = (ticket: TicketWithReportId) => {
    // Navigate to the specific grievance view using the stored grievance ID
    if (ticket.grievanceId) {
      // Route directly to the grievance view with the specific grievance ID
      // This will trigger the same grievance details page as the home page
      console.log('Navigating to grievance view with ID:', ticket.grievanceId);
      console.log('This will make API call to: /api/grievances/manage/' + ticket.grievanceId);
      // Use React Router navigate to avoid full page reload
      navigate('/grievance');
      // Set hash after navigation completes - this matches admin's approach in GrievancesSearch
      // Using setTimeout ensures the route component has mounted
      setTimeout(() => {
        window.location.hash = `#/view/${ticket.grievanceId}`;
      }, 100);
    } else {
      // Fallback: navigate to main grievance system if no grievance ID is stored
      console.warn('No grievance ID found for ticket:', ticket.id, '- This ticket was likely created before the grievance mapping was implemented');
      console.log('Navigating to main grievance search page where you can search for the original grievance');
      // Use React Router navigate to avoid full page reload
      navigate('/grievance');
    }
  };


  const handleUpdateTicketStatus = (ticket: TicketWithReportId) => {
    handleUpdateStatus(ticket);
  };

  const handleCloseAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedGrievance(null);
  };

  const handleTicketCreated = async (_ticket: any) => {
    try {
      setSuccess('Ticket created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload the data to reflect the new ticket
      loadTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    }
  };

  // Color helper functions (matching grievance main page)

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).toUpperCase();
  };

  // Filter officers based on selected department for assign modal
  const availableOfficers = selectedDepartmentId
    ? users.filter(user => user.departmentId === selectedDepartmentId)
    : [];

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {showMyTickets ? 'My Tickets' : 'All Tickets'}
        </h2>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Compact Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
            >
              <option value="">All</option>
              <option value="UN_ASSIGNED">UN ASSIGNED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="RESPONDED">RESPONDED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
            >
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Dept:</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
            >
              <option value="">All</option>
              {departments && departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No departments available</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Search:</label>
            <input
              type="text"
              placeholder="ID, name..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
            />
          </div>

          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Government Table */}
      <Card className="overflow-hidden shadow-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-lg font-medium">Loading tickets...</div>
            </div>
          </div>
        ) : tickets && tickets.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  {showMyTickets ? (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{showMyTickets ? 'Actions' : 'Assign'}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {showMyTickets ? (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm whitespace-nowrap font-medium text-gray-900">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="truncate max-w-[100px]" title={ticket.title}>
                          {ticket.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="truncate max-w-[120px]" title={ticket.department?.name || 'N/A'}>
                          {ticket.department?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {/* Show ASSIGNED if ticket has an assigned user, even if DB says OPEN */}
                          {ticket.status === 'ASSIGNED' && ticket.assignedTo ? 'ASSIGNED' : ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
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
                              className="cursor-pointer"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleUpdateTicketStatus(ticket)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm whitespace-nowrap font-medium text-gray-900">
                        {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        <div className="truncate max-w-[120px]" title={ticket.title}>
                          {ticket.title}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="truncate max-w-[100px]" title={ticket.assignedToUser?.fullName || 'Unassigned'}>
                          {ticket.assignedToUser?.fullName || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="truncate max-w-[120px]" title={ticket.department?.name || 'No Department'}>
                          {ticket.department?.name || 'No Department'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        onClick={() => {
                          setSelectedTicketForAssign(ticket);
                          setSelectedDepartmentId('');
                          setSelectedOfficerId('');
                          setShowAssignModal(true);
                          loadUsers();
                        }}
                        disabled={
                          ticket.status === 'RESOLVED' || 
                          ticket.status === 'RESPONDED' ||
                          ticket.status === 'CLOSED' ||
                          !!ticket.assignedToUser ||
                          !!ticket.assignedTo
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                      >
                        Assign
                      </Button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="flex flex-col items-center space-y-3">
              <FileText className="h-12 w-12 text-gray-300" />
              <div className="text-lg font-medium">No grievances found</div>
              <div className="text-sm">Try adjusting your filters</div>
            </div>
          </div>
        )}
        
        {/* Professional Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} grievances
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Status Change Modal */}
      {selectedTicket && (
      <StatusChangeModal
        isOpen={showStatusModal}
        onClose={handleCloseStatusModal}
          grievance={{
            id: selectedTicket.id,
            report_id: selectedTicket.report_id || '',
            name: '',
            phone_number: '',
            age: 0,
            gender: '',
            date_of_registration: selectedTicket.createdAt,
            department: selectedTicket.department?.name || '',
            priority: (selectedTicket.priority === 'URGENT' ? 'HIGH' : selectedTicket.priority) as GrievanceData['priority'],
            subject: selectedTicket.title,
            sub_subject: selectedTicket.description || '',
            grievance_address: '',
            remark: selectedTicket.description || '',
            latitude: 0,
            longitude: 0,
            location_name: null,
            location_address: null,
            media_id: '',
            image_url: '',
            ai_priority: (selectedTicket.priority === 'URGENT' ? 'HIGH' : selectedTicket.priority) as GrievanceData['priority'],
            ai_confidence: 0,
            is_image_validated: false,
            flow_token: '',
            status: selectedTicket.status as GrievanceData['status'],
            submission_time: selectedTicket.createdAt,
            is_deleted: false,
            created_at: selectedTicket.createdAt,
            updated_at: selectedTicket.updatedAt || selectedTicket.createdAt
          }}
        currentStatus={selectedCurrentStatus}
        onStatusUpdate={handleStatusUpdateWithComment}
      />
      )}

      {/* Grievance Assignment Modal */}
      <TicketModal
        isOpen={showAssignmentModal}
        onClose={handleCloseAssignmentModal}
        isGrievanceAssignment={true}
        selectedGrievance={selectedGrievance}
        users={users}
        departments={departments}
        onTicketCreated={handleTicketCreated}
        onTicketUpdated={() => {}}
      />


      {/* Assignment Modal */}
      {showAssignModal && selectedTicketForAssign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: 0, padding: '1rem' }}>
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Assign Ticket</h2>
                  <Button
                    variant="outline"
                    onClick={handleCloseAssignModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </div>

                {/* Department Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedDepartmentId}
                    onChange={(e) => {
                      setSelectedDepartmentId(e.target.value);
                      setSelectedOfficerId('');
                    }}
                  >
                    <option value="">Select Department First</option>
                    {departments && departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {!selectedDepartmentId && (
                    <p className="text-sm text-gray-500 mt-1">Please select a department to see available officers</p>
                  )}
                </div>

                {/* Officer Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To Officer *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={selectedOfficerId}
                    onChange={(e) => {
                      setSelectedOfficerId(e.target.value);
                    }}
                    disabled={!selectedDepartmentId || availableOfficers.length === 0}
                  >
                    <option value="">
                      {!selectedDepartmentId 
                        ? 'Select Department First' 
                        : availableOfficers.length === 0 
                          ? 'No officers available' 
                          : 'Select an officer'}
                    </option>
                    {availableOfficers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} - {user.department?.name || 'No Department'}
                      </option>
                    ))}
                  </select>
                  {selectedDepartmentId && availableOfficers.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">No officers available in this department</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCloseAssignModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignTicket}
                    disabled={!selectedDepartmentId || !selectedOfficerId || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                  >
                    {loading ? 'Assigning...' : 'Assign Ticket'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
      )}

    </div>
  );
};

export default TicketManagement;


