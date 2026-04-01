import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { violationApi, userApi, departmentApi } from "@/services/api/admin";
import type { Violation, User, Department } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ViolationManagementProps {
  showMyViolations?: boolean;
  showTeamViolations?: boolean;
}

const ViolationManagement: React.FC<ViolationManagementProps> = ({
  showMyViolations = false,
  showTeamViolations = false,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isUpdatingFromUrlRef = useRef(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || "",
    priority: searchParams.get('priority') || "",
    assignedTo: searchParams.get('assignedTo') || "",
    departmentId: searchParams.get('departmentId') || "",
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
    if (filters.assignedTo) {
      params.set('assignedTo', filters.assignedTo);
    } else {
      params.delete('assignedTo');
    }
    if (filters.departmentId) {
      params.set('departmentId', filters.departmentId);
    } else {
      params.delete('departmentId');
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
    const assignedTo = searchParams.get('assignedTo') || '';
    const departmentId = searchParams.get('departmentId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);

    let shouldUpdate = false;
    setFilters(prev => {
      if (prev.status !== status || prev.priority !== priority || 
          prev.assignedTo !== assignedTo || prev.departmentId !== departmentId) {
        shouldUpdate = true;
        return { status, priority, assignedTo, departmentId };
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

  // Load violations using real violation API
  const loadViolations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "Loading violations with filters:",
        filters,
        " showMyViolations:",
        showMyViolations,
        " showTeamViolations:",
        showTeamViolations
      );

      let response;
      if (showMyViolations) {
        response = await violationApi.getMyViolations(currentPage, limit);
      } else if (showTeamViolations) {
        response = await violationApi.getTeamViolations(
          currentPage,
          limit,
          filters.departmentId
        );
      } else {
        response = await violationApi.getViolations(currentPage, limit, {
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          departmentId: filters.departmentId || undefined,
          assignee: filters.assignedTo || undefined,
          isOverdue: undefined, // Show all for now
        });
      }

      const responseData = response as any;
      const violationsList = responseData?.data?.violations || responseData?.violations || [];
      const pagination = responseData?.data?.pagination || responseData?.pagination;

      if (violationsList && Array.isArray(violationsList)) {
        const mappedViolations: Violation[] = violationsList.map((violation: any) => ({
          id: violation.id || violation.ticketId,
          reportId: violation.grievance?.report_id || violation.reportId || violation.id || 'N/A',
          title: violation.grievance?.subject || violation.title || 'Violation',
          description: violation.grievance?.remark || violation.description || 'No description available',
          department: typeof violation.department === 'string' 
            ? violation.department 
            : violation.department?.name || 'N/A',
          departmentId: violation.department?.id || violation.departmentId || '',
          ticketId: violation.ticketId || violation.id,
          ticketUrl: violation.ticketUrl || `/grievance/view/${violation.grievance?.id || violation.id}`,
          assignedUser: violation.assignedUser,
          deadline: violation.slaDeadline || violation.deadline || '',
          isOverdue: violation.isInViolation || violation.isOverdue || false,
          priority: violation.priority || 'MEDIUM',
          status: violation.status || 'OPEN',
          createdBy: violation.grievance?.created_by || violation.createdBy || violation.assignedUser?.id || '',
          createdAt: violation.createdAt || violation.updatedAt || new Date().toISOString(),
          updatedAt: violation.updatedAt || violation.createdAt || new Date().toISOString(),
          grievanceId: violation.grievance?.id || violation.grievanceId,
        }));

        // Sort violations by time (latest first) - use updatedAt if available, otherwise createdAt
        const sortedViolations = mappedViolations.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA; // Descending order (newest first)
        });

        setViolations(sortedViolations);
        setTotalPages(pagination?.totalPages || pagination?.total_pages || 1);
        setTotalCount(pagination?.total || mappedViolations.length);

        console.log(
          "Violations loaded successfully:",
          mappedViolations.length,
          "violations"
        );
      } else {
        console.warn("Unexpected response format:", response);
        setViolations([]);
        setTotalPages(1);
        setTotalCount(0);
        setError("Failed to load violations: Invalid response format");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load violations";
      setError(errorMsg);
      console.error("Load violations error:", err);
      // Clear data only on error to show error state
      setViolations([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, showMyViolations, showTeamViolations]);

  const loadUsersAndDepartments = useCallback(async () => {
    if (showMyViolations) {
      console.log("Skipping users and departments load for My Violations view");
      return;
    }

    try {
      const [usersResponse, departmentsResponse] = await Promise.all([
        userApi.getUsers(1, 100),
        departmentApi.getDepartments(1, 100),
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data.users || []);
      }

      if (departmentsResponse?.data?.departments) {
        setDepartments(departmentsResponse.data.departments);
      }
    } catch (err) {
      console.error("Error loading users and departments:", err);
    }
  }, [showMyViolations]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    // Reset to first page when switching between my violations / team violations / all violations
    setCurrentPage(1);
    setFilters({
      status: "",
      priority: "",
      assignedTo: "",
      departmentId: "",
    });
  }, [showMyViolations, showTeamViolations]);

  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  useEffect(() => {
    loadUsersAndDepartments();
  }, [loadUsersAndDepartments]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filtering
    // URL params will be updated by the useEffect above
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "",
      priority: "",
      assignedTo: "",
      departmentId: "",
    });
    setCurrentPage(1);
    // Clear filter params but preserve section param
    const params = new URLSearchParams(searchParams);
    params.delete('status');
    params.delete('priority');
    params.delete('assignedTo');
    params.delete('departmentId');
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) {
      return "N/A";
    }

    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) {
      console.warn("Invalid deadline received for violation", deadline);
      return "N/A";
    }

    // Format as DD/MM/YYYY, hh:mm A (e.g., 21/11/2025, 04:14 PM)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Convert to 12-hour format with AM/PM
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const amPm = hours24 >= 12 ? 'PM' : 'AM';
    const hoursFormatted = String(hours12).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hoursFormatted}:${minutes} ${amPm}`;
  };

  // Handle view violation - navigate to grievance detail view
  const handleViewViolation = (violation: any) => {
    const grievanceId = violation.grievance?.id || violation.grievanceId;

    if (grievanceId) {
      console.log('Navigating to grievance view with ID:', grievanceId);
      navigate('/grievance');
      setTimeout(() => {
        window.location.hash = `#/view/${grievanceId}`;
      }, 100);
    } else {
      console.warn('No grievance ID found for violation:', violation.id);
      navigate('/grievance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showMyViolations ? "My Violations" : "All Violations"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track and manage violation-related grievances
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Total:{" "}
            <span className="font-semibold text-gray-700">{totalCount}</span>{" "}
            violations
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Showing {violations.length} of {totalCount} results
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters - Only show for admin, not for user violations */}
      {!showMyViolations && (
        <Card className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="UN_ASSIGNED">UN_ASSIGNED</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="RESPONDED">RESPONDED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Priority
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Assigned To
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) =>
                  handleFilterChange("assignedTo", e.target.value)
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Department
              </label>
              <select
                value={filters.departmentId}
                onChange={(e) =>
                  handleFilterChange("departmentId", e.target.value)
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="w-full text-xs py-1.5"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}
      {/* Violations Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading violations...
            </div>
          ) : violations && violations.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SLA Deadline
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {violations.map((violation: any, index: number) => (
                  <tr
                    key={violation.id || violation.ticketId || `violation-${index}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate font-medium" title={typeof violation.department === 'string' ? violation.department : violation.department?.name}>
                        {typeof violation.department === 'string' ? violation.department : violation.department?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {violation.assignedUser?.fullName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="text-sm" title={violation.deadline ? new Date(violation.deadline).toLocaleString() : "N/A"}>
                        {formatDeadline(violation.deadline)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        onClick={() => handleViewViolation(violation)}
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No violations found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalCount)} of {totalCount}{" "}
              violations
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
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

      {/* Ticket modal removed for now; this view focuses on listing and status updates */}
    </div>
  );
};

export default ViolationManagement;
