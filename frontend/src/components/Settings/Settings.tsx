import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { departmentApi, userApi, slaApi } from '@/services/api/admin';
import SettingsSidebar from './SettingsSidebar';

interface SLADefinition {
  id: string;
  departmentId: string;
  departmentName: string;
  status: 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED';
  timeLimit: string; // 
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
  subject: string;
  subSubject: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId: string;
}

interface EscalationSettings {
  id: string;
  departmentId: string;
  departmentName: string;
  status: 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED';
  responsibleUserId: string;
  responsibleUserName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SettingsProps {
  onClose?: () => void;
}

// Constants for time state management

const Settings: React.FC<SettingsProps> = () => {
  const [activeSection, setActiveSection] = useState<'sla-definition' | 'sla-escalation'>('sla-definition');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [slaDefinitions, setSlaDefinitions] = useState<SLADefinition[]>([]);
  const [escalationSettings, setEscalationSettings] = useState<EscalationSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [showSLAForm, setShowSLAForm] = useState(false);
  const [editingSlaId, setEditingSlaId] = useState<string | null>(null);
  const [slaForm, setSlaForm] = useState({
    departmentId: '',
    status: 'UN_ASSIGNED' as 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED',
    timeLimit: '1:00',
    isActive: true
  });

  const [showEscalationForm, setShowEscalationForm] = useState(false);
  const [editingEscalationId, setEditingEscalationId] = useState<string | null>(null);
  const [escalationForm, setEscalationForm] = useState({
    departmentId: '',
    status: 'UN_ASSIGNED' as 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED',
    responsibleUserId: '',
    isActive: true
  });

  // Load departments, users, SLA definitions, and escalation settings
  useEffect(() => {
    loadDepartments();
    loadUsers();
    loadSLADefinitions();
    // Load escalation settings will be called after departments and users load
  }, []);

  // Load escalation settings after departments and users are loaded
  useEffect(() => {
    if (departments.length > 0 && users.length > 0) {
      loadEscalationSettings();
    }
  }, [departments.length, users.length]); // Only depend on lengths to avoid infinite loops

  const loadDepartments = async () => {
    try {
      // Fetch all departments with a high limit to get all of them
      const response = await departmentApi.getDepartments(1, 1000);
      console.log('Departments response:', response);
      
      // Handle different response structures
      let departmentsArray: Department[];
      if (Array.isArray(response.data)) {
        departmentsArray = response.data as Department[];
      } else if (response.data && response.data.departments) {
        departmentsArray = response.data.departments as Department[];
      } else if (Array.isArray(response)) {
        departmentsArray = response as Department[];
      } else {
        departmentsArray = [];
      }
      
      console.log('Loaded departments:', departmentsArray.length);
      setDepartments(departmentsArray);
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Failed to load departments. Please refresh the page.');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users...');
      // Fetch all users with a high limit to get all of them
      const response = await userApi.getUsers(1, 1000);
      console.log('Users API response:', response);
      console.log('Users data:', response.data);
      
      // Handle different response structures
      let usersArray: User[];
      if (Array.isArray(response.data)) {
        // If response.data is directly an array
        usersArray = response.data as User[];
        console.log('Users array (direct):', usersArray);
      } else if (response.data && response.data.users) {
        // If response.data has a users property
        usersArray = response.data.users as User[];
        console.log('Users array (nested):', usersArray);
      } else {
        console.error('Unexpected users response structure:', response.data);
        usersArray = [];
      }
      
      console.log('Loaded users:', usersArray.length);
      setUsers(usersArray);
      console.log('Users state set to:', usersArray);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadEscalationSettings = useCallback(async () => {
    try {
      console.log('Loading escalation settings from backend...');
      const response = await slaApi.getEscalations();
      console.log('Escalation API response:', response);
      
      // Handle different response structures
      let escalationsList: any[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        escalationsList = response;
      } else if (response.success && response.data) {
        // Wrapped response: { success: true, data: [...] }
        escalationsList = Array.isArray(response.data) ? response.data : [];
      } else if (response.data) {
        // Nested data: { data: [...] }
        escalationsList = Array.isArray(response.data) ? response.data : [];
      } else if (response.escalations) {
        // Escalations property: { escalations: [...] }
        escalationsList = Array.isArray(response.escalations) ? response.escalations : [];
      }
      
      console.log('Escalations list:', escalationsList);
      console.log('Current departments:', departments);
      console.log('Current users:', users);
      
      // Map escalation data to include department and user names
      // Use current state values for departments and users
      setEscalationSettings(() => {
        const mappedEscalations: EscalationSettings[] = escalationsList.map((esc: any) => {
          // Find department name - check current departments state
          const department = departments.find(d => d.id === esc.departmentId);
          const departmentName = department?.name || esc.department?.name || esc.departmentName || 'Unknown';
          
          // Find user name - check current users state
          const user = users.find(u => u.id === esc.responsibleUserId);
          const responsibleUserName = user?.fullName || esc.responsibleUser?.fullName || esc.responsibleUserName || 'Unknown';
          
          return {
            id: esc.id,
            departmentId: esc.departmentId,
            departmentName: departmentName,
            status: esc.status,
            responsibleUserId: esc.responsibleUserId,
            responsibleUserName: responsibleUserName,
            isActive: esc.isActive !== undefined ? esc.isActive : true,
            createdAt: esc.createdAt || '',
            updatedAt: esc.updatedAt || ''
          };
        });
        
        console.log('Mapped escalations:', mappedEscalations);
        return mappedEscalations;
      });
    } catch (err: any) {
      console.error('Error loading escalation settings:', err);
      setEscalationSettings([]);
    }
  }, [departments, users]);

  // Helper function to convert numeric timeLimit (in minutes) to MM:SS format
  const formatTimeLimit = (timeLimit: number): string => {
    const minutes = Math.floor(timeLimit);
    const seconds = 0; // API returns minutes, so seconds are always 0
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const loadSLADefinitions = async () => {
    setLoading(true);
    try {
      console.log('Loading SLA definitions from backend...');
      const response = await slaApi.getSLAs();
      
      // Handle response structure: { slaDefinitions: [...], pagination: {...} }
      const responseData = response as any;
      const slaDefinitionsList = responseData.slaDefinitions || responseData.data?.slaDefinitions || responseData.data || [];
      
      console.log('SLA definitions loaded:', slaDefinitionsList);
      
      // Map API response to component format, converting timeLimit to MM:SS
      const mappedDefinitions: SLADefinition[] = slaDefinitionsList.map((sla: any) => ({
        id: sla.id,
        departmentId: sla.departmentId,
        departmentName: sla.department?.name || sla.departmentName || 'Unknown',
        status: sla.status,
        timeLimit: typeof sla.timeLimit === 'number' ? formatTimeLimit(sla.timeLimit) : sla.timeLimit,
        isActive: sla.isActive,
        createdAt: sla.createdAt,
        updatedAt: sla.updatedAt,
        department: sla.department
      }));
      
      setSlaDefinitions(mappedDefinitions);
    } catch (err: any) {
      console.error('Error loading SLA definitions:', err);
      setError('Failed to load SLA definitions');
      setSlaDefinitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSLA = () => {
    setSlaForm({
      departmentId: '',
      status: 'UN_ASSIGNED',
      timeLimit: '03:00',
      isActive: true
    });
    setEditingSlaId(null);
    setShowSLAForm(true);
  };

  const handleEditSLA = (slaId: string) => {
    const sla = slaDefinitions.find(s => s.id === slaId);
    if (sla) {
      setSlaForm({
        departmentId: sla.departmentId,
        status: sla.status,
        timeLimit: sla.timeLimit,
        isActive: sla.isActive
      });
      setEditingSlaId(slaId);
      setShowSLAForm(true);
    }
  };

  // Helper function to check if a status is already used for a department
  const isStatusUsedForDepartment = (departmentId: string, status: 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED'): boolean => {
    if (!departmentId) return false;
    
    // If editing, allow the current status
    if (editingSlaId) {
      const editingSla = slaDefinitions.find(sla => sla.id === editingSlaId);
      if (editingSla && editingSla.departmentId === departmentId && editingSla.status === status) {
        return false;
      }
    }
    
    // Check if status is already used for this department
    return slaDefinitions.some(sla => 
      sla.departmentId === departmentId && sla.status === status
    );
  };

  const handleSaveSLA = async () => {
    if (!slaForm.departmentId || !slaForm.status || !slaForm.timeLimit) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate MM:SS format
    const timeFormatRegex = /^\d{1,3}:\d{2}$/;
    if (!timeFormatRegex.test(slaForm.timeLimit)) {
      setError('Time limit must be in MM:SS format (e.g., 03:00, 15:30)');
      return;
    }

    // Validate that seconds are between 00-59 and minutes are reasonable
    const [minutes, seconds] = slaForm.timeLimit.split(':').map(Number);
    if (seconds > 59) {
      setError('Seconds must be between 00-59');
      return;
    }
    if (minutes > 999) {
      setError('Minutes must be less than 999');
      return;
    }

    // Convert MM:SS format to total minutes (as number) for API
    // API expects timeLimit as a number representing minutes
    const timeLimitInMinutes = minutes + (seconds / 60);

    try {
      setLoading(true);
      setError(null);

      console.log('Saving SLA with data:', {
        departmentId: slaForm.departmentId,
        status: slaForm.status,
        timeLimit: timeLimitInMinutes, // Send as number
        timeLimitDisplay: slaForm.timeLimit, // Keep for logging
        isActive: slaForm.isActive
      });

      // Check if SLA already exists for this department and status
      const existingSLA = slaDefinitions.find(sla => 
        sla.departmentId === slaForm.departmentId && sla.status === slaForm.status
      );

      if (editingSlaId || existingSLA) {
        // Update existing SLA
        const slaId = editingSlaId || existingSLA!.id;
        const response = await slaApi.updateSLA(slaId, {
          status: slaForm.status,
          timeLimit: timeLimitInMinutes, // Send as number
          isActive: slaForm.isActive
        });

        if (response.success) {
          setSuccess('SLA definition updated successfully');
          setEditingSlaId(null);
        }
      } else {
        // Create new SLA
        const response = await slaApi.createSLA({
          departmentId: slaForm.departmentId,
          status: slaForm.status,
          timeLimit: timeLimitInMinutes, // Send as number
          isActive: slaForm.isActive
        });

        if (response.success) {
          setSuccess('SLA definition created successfully');
        }
      }

      // Reload SLA definitions
      await loadSLADefinitions();
      
      setShowSLAForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save SLA definition';
      setError(errorMsg);
      console.error('Error saving SLA:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSLA = async (slaId: string) => {
    if (window.confirm('Are you sure you want to delete this SLA definition?')) {
      try {
        setLoading(true);
        const response = await slaApi.deleteSLA(slaId);
        
        if (response.success) {
          setSuccess('SLA definition deleted successfully');
          // Reload SLA definitions
          await loadSLADefinitions();
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete SLA definition';
        setError(errorMsg);
        console.error('Error deleting SLA:', err);
      } finally {
        setLoading(false);
      }
    }
  };



  const handleAddEscalation = () => {
    setEscalationForm({
      departmentId: '',
      status: 'UN_ASSIGNED',
      responsibleUserId: '',
      isActive: true
    });
    setEditingEscalationId(null);
    setShowEscalationForm(true);
  };

  const handleEditEscalation = (escalationId: string) => {
    const escalation = escalationSettings.find(e => e.id === escalationId);
    if (escalation) {
      setEscalationForm({
        departmentId: escalation.departmentId,
        status: escalation.status,
        responsibleUserId: escalation.responsibleUserId,
        isActive: escalation.isActive
      });
      setEditingEscalationId(escalationId);
      setShowEscalationForm(true);
    }
  };

  // Helper function to check if a status is already used for escalation
  const isEscalationStatusUsedForDepartment = (departmentId: string, status: 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED'): boolean => {
    if (!departmentId) return false;
    
    // If editing, allow the current status
    if (editingEscalationId) {
      const editingEscalation = escalationSettings.find(esc => esc.id === editingEscalationId);
      if (editingEscalation && editingEscalation.departmentId === departmentId && editingEscalation.status === status) {
        return false;
      }
    }
    
    // Check if status is already used for this department
    return escalationSettings.some(esc => 
      esc.departmentId === departmentId && esc.status === status
    );
  };

  const handleSaveEscalation = async () => {
    if (!escalationForm.departmentId || !escalationForm.status || !escalationForm.responsibleUserId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Saving escalation with data:', {
        departmentId: escalationForm.departmentId,
        status: escalationForm.status,
        responsibleUserId: escalationForm.responsibleUserId,
        isActive: escalationForm.isActive
      });

      // Check if escalation already exists for this department and status
      const existingEscalation = escalationSettings.find(esc => 
        esc.departmentId === escalationForm.departmentId && esc.status === escalationForm.status
      );

      if (editingEscalationId || existingEscalation) {
        // Update existing escalation
        const escalationId = editingEscalationId || existingEscalation!.id;
        const response = await slaApi.updateEscalation(escalationId, {
          status: escalationForm.status,
          responsibleUserId: escalationForm.responsibleUserId,
          isActive: escalationForm.isActive
        });

        if (response.success) {
          setSuccess('Escalation setting updated successfully');
          setEditingEscalationId(null);
        }
      } else {
        // Create new escalation
        const response = await slaApi.createEscalation({
          departmentId: escalationForm.departmentId,
          status: escalationForm.status,
          responsibleUserId: escalationForm.responsibleUserId,
          isActive: escalationForm.isActive
        });

        if (response.success) {
          setSuccess('Escalation setting created successfully');
        }
      }

      // Reload escalation settings
      await loadEscalationSettings();
      
      setShowEscalationForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save escalation settings';
      setError(errorMsg);
      console.error('Error saving escalation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEscalation = async (escalationId: string) => {
    if (window.confirm('Are you sure you want to delete this escalation setting?')) {
      try {
        setLoading(true);
        const response = await slaApi.deleteEscalation(escalationId);
        
        if (response.success) {
          setSuccess('Escalation setting deleted successfully');
          // Reload escalation settings
          await loadEscalationSettings();
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete escalation setting';
        setError(errorMsg);
        console.error('Error deleting escalation:', err);
      } finally {
        setLoading(false);
      }
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <SettingsSidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Dynamic Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {activeSection === 'sla-definition' ? 'SLA Definition' : 'SLA Escalation'}
              </h2>
              <p className="text-gray-600 text-sm">
                {activeSection === 'sla-definition' 
                  ? 'Configure service level agreements for different departments and grievance types'
                  : 'Set up escalation policies and assign responsible users for SLA violations'
                }
              </p>
              <div className="mt-4">
                {activeSection === 'sla-definition' ? (
                  <Button onClick={handleAddSLA} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add SLA Definition
                  </Button>
                ) : (
                  <Button onClick={handleAddEscalation} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add SLA Escalation
                  </Button>
                )}
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {success}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* SLA Definition Section */}
            {activeSection === 'sla-definition' && (
            <div className="space-y-6">

            {/* SLA Form Modal */}
            <Dialog open={showSLAForm} onOpenChange={setShowSLAForm}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {slaForm.departmentId ? 'Edit SLA Definition' : 'Add New SLA Definition'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <Select value={slaForm.departmentId} onValueChange={(value) => {
                        // Check if current status is already used for the new department
                        const currentStatusUsed = slaDefinitions.some(sla => 
                          sla.departmentId === value && sla.status === slaForm.status && sla.id !== editingSlaId
                        );
                        
                        // If current status is used, find first available status
                        if (currentStatusUsed) {
                          const statuses: Array<'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED'> = ['UN_ASSIGNED', 'ASSIGNED', 'RESOLVED', 'RESPONDED'];
                          const availableStatus = statuses.find(status => 
                            !slaDefinitions.some(sla => sla.departmentId === value && sla.status === status)
                          ) || 'UN_ASSIGNED';
                          setSlaForm({...slaForm, departmentId: value, status: availableStatus});
                        } else {
                          setSlaForm({...slaForm, departmentId: value});
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.length === 0 ? (
                            <SelectItem value="no-departments" disabled>
                              {loading ? 'Loading departments...' : 'No departments available'}
                            </SelectItem>
                          ) : (
                            departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                  <div className="space-y-6">
                    {/* Status Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        key={`status-${slaForm.departmentId}-${editingSlaId || 'new'}`}
                        value={slaForm.status} 
                        onValueChange={(value: 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED') => setSlaForm({...slaForm, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem 
                            value="UN_ASSIGNED" 
                            disabled={isStatusUsedForDepartment(slaForm.departmentId, 'UN_ASSIGNED')}
                          >
                            UN_ASSIGNED {isStatusUsedForDepartment(slaForm.departmentId, 'UN_ASSIGNED') && '(Already assigned)'}
                          </SelectItem>
                          <SelectItem 
                            value="ASSIGNED"
                            disabled={isStatusUsedForDepartment(slaForm.departmentId, 'ASSIGNED')}
                          >
                            ASSIGNED {isStatusUsedForDepartment(slaForm.departmentId, 'ASSIGNED') && '(Already assigned)'}
                          </SelectItem>
                          <SelectItem 
                            value="RESOLVED"
                            disabled={isStatusUsedForDepartment(slaForm.departmentId, 'RESOLVED')}
                          >
                            RESOLVED {isStatusUsedForDepartment(slaForm.departmentId, 'RESOLVED') && '(Already assigned)'}
                          </SelectItem>
                          <SelectItem 
                            value="RESPONDED"
                            disabled={isStatusUsedForDepartment(slaForm.departmentId, 'RESPONDED')}
                          >
                            RESPONDED {isStatusUsedForDepartment(slaForm.departmentId, 'RESPONDED') && '(Already assigned)'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {slaForm.departmentId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Grey options are already configured for this department
                        </p>
                      )}
                    </div>

                    {/* Time Limit Field */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Time Limit (MM:SS) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={slaForm.timeLimit}
                        onChange={(e) => setSlaForm({...slaForm, timeLimit: e.target.value})}
                        placeholder="03:00"
                        className="w-full text-center text-lg font-semibold"
                      />
                      <p className="text-xs text-gray-500 text-center">Format: Minutes:Seconds (e.g., 03:00 = 3 minutes, 05:30 = 5 minutes 30 seconds)</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSLAForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveSLA}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* SLA Definitions Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Limit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {slaDefinitions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <p className="text-sm">No SLA definitions found</p>
                            <p className="text-xs text-gray-400">Click "Add SLA Definition" to create one</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      slaDefinitions.map((sla) => (
                      <tr key={sla.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sla.departmentName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sla.status}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sla.timeLimit}</span>
                            <span className="text-xs text-gray-400">
                              ({(() => {
                                const [minutes, seconds] = sla.timeLimit.split(':').map(Number);
                                const totalSeconds = (minutes * 60) + seconds;
                                const displayMinutes = Math.floor(totalSeconds / 60);
                                const displaySeconds = totalSeconds % 60;
                                
                                if (displayMinutes > 0 && displaySeconds > 0) {
                                  return `${displayMinutes} minute${displayMinutes > 1 ? 's' : ''} and ${displaySeconds} second${displaySeconds > 1 ? 's' : ''}`;
                                } else if (displayMinutes > 0) {
                                  return `${displayMinutes} minute${displayMinutes > 1 ? 's' : ''}`;
                                } else {
                                  return `${displaySeconds} second${displaySeconds > 1 ? 's' : ''}`;
                                }
                              })()})
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditSLA(sla.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSLA(sla.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

            {/* SLA Escalation Section */}
            {activeSection === 'sla-escalation' && (
            <div className="space-y-6">

            {/* Escalation Form Modal */}
            <Dialog open={showEscalationForm} onOpenChange={setShowEscalationForm}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {escalationForm.departmentId ? 'Edit SLA Escalation' : 'Add New SLA Escalation'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <Select value={escalationForm.departmentId} onValueChange={(value) => {
                        // Check if current status is already used for the new department
                        const currentStatusUsed = escalationSettings.some(esc => 
                          esc.departmentId === value && esc.status === escalationForm.status && esc.id !== editingEscalationId
                        );
                        
                        // If current status is used, find first available status
                        if (currentStatusUsed) {
                          const statuses: Array<'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED'> = ['UN_ASSIGNED', 'ASSIGNED', 'RESOLVED', 'RESPONDED'];
                          const availableStatus = statuses.find(status => 
                            !escalationSettings.some(esc => esc.departmentId === value && esc.status === status)
                          ) || 'UN_ASSIGNED';
                          setEscalationForm({...escalationForm, departmentId: value, status: availableStatus});
                        } else {
                          setEscalationForm({...escalationForm, departmentId: value});
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.length === 0 ? (
                            <SelectItem value="no-departments" disabled>
                              {loading ? 'Loading departments...' : 'No departments available'}
                            </SelectItem>
                          ) : (
                            departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                  <div className="space-y-6">
                    {/* Status Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        key={`escalation-status-${escalationForm.departmentId}-${editingEscalationId || 'new'}`}
                        value={escalationForm.status} 
                        onValueChange={(value: 'UN_ASSIGNED' | 'ASSIGNED' | 'RESOLVED' | 'RESPONDED') => setEscalationForm({...escalationForm, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem 
                            value="UN_ASSIGNED"
                            disabled={isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'UN_ASSIGNED')}
                          >
                            UN_ASSIGNED {isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'UN_ASSIGNED') && '(Already assigned)'}
                          </SelectItem>
                          <SelectItem 
                            value="ASSIGNED"
                            disabled={isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'ASSIGNED')}
                          >
                            ASSIGNED {isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'ASSIGNED') && '(Already assigned)'}
                          </SelectItem>
                          <SelectItem 
                            value="RESOLVED"
                            disabled={isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'RESOLVED')}
                          >
                            RESOLVED {isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'RESOLVED') && '(Already assigned)'}
                          </SelectItem>
                          <SelectItem 
                            value="RESPONDED"
                            disabled={isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'RESPONDED')}
                          >
                            RESPONDED {isEscalationStatusUsedForDepartment(escalationForm.departmentId, 'RESPONDED') && '(Already assigned)'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {escalationForm.departmentId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Grey options are already configured for this department
                        </p>
                      )}
                    </div>

                    {/* Responsible User Field */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Responsible User <span className="text-red-500">*</span>
                      </label>
                      <Select value={escalationForm.responsibleUserId} onValueChange={(value) => setEscalationForm({...escalationForm, responsibleUserId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select User" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.length > 0 ? (
                            users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.fullName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-users" disabled>
                              No users available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEscalationForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveEscalation}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Escalation Settings Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responsible User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && escalationSettings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <p className="text-sm">Loading escalation settings...</p>
                          </div>
                        </td>
                      </tr>
                    ) : escalationSettings.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <p className="text-sm">No escalation settings found</p>
                            <p className="text-xs text-gray-400">Click "Add SLA Escalation" to create one</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      escalationSettings.map((escalation) => (
                        <tr key={escalation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {escalation.departmentName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {escalation.status}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{escalation.responsibleUserName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEscalation(escalation.id)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEscalation(escalation.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

