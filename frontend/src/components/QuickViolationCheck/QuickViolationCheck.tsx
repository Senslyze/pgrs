import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { violationApi } from '@/services/api/admin';
import type { Violation } from '@/types';

const QuickViolationCheck: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const checkViolations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking violations for Sam Marsh...');
      
      // Get all violations
      const violationsResponse = await violationApi.getViolations(1, 50);
      console.log('📊 All Violations:', violationsResponse);
      
      // Get Sam's violations specifically
      const myViolationsResponse = await violationApi.getMyViolations(1, 50);
      console.log('👤 Sam\'s Violations:', myViolationsResponse);
      
      setViolations(violationsResponse.data.violations || []);
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load violations');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createExpiredTicketForSam = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎫 Creating mock expired ticket and violation for Sam Marsh...');
      
      // Since we can't create real tickets with USER role, let's create a mock violation
      // that simulates what would appear in Sam's "My Violations" section
      const mockViolation = {
        id: `viol_${Date.now()}`,
        title: 'Water Supply Issue - SLA Violation',
        description: 'Water supply complaint not resolved within SLA timeframe',
        ticketId: `tkt_water_${Date.now()}`,
        department: 'Public Works',
        assignee: 'sam_marsh',
        assigneeUser: {
          fullName: 'Sam Marsh',
          email: 'sam.marsh@municipality.gov'
        },
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        status: 'OPEN',
        priority: 'HIGH',
        isOverdue: true,
        overdueTime: '1 day, 3 hours',
        violationType: 'SLA_BREACH',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      };
      
      console.log('🚨 Mock violation created:', mockViolation);
      
      // Add the mock violation to the current violations list
      setViolations(prev => [mockViolation as unknown as Violation, ...prev]);
      
      setSuccess('✅ Mock expired ticket and violation created for Sam Marsh! Check the violations list below.');
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create mock violation');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOverdueDisplay = (violation: Violation) => {
    if (!violation.isOverdue) {
      return <span className="text-green-600 font-medium">On Time</span>;
    }
    return (
      <span className="text-red-600 font-medium">
        {violation.overdueTime || 'Overdue'}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚨 Quick Violation Check</h1>
        <p className="text-gray-600">Check violations for Sam Marsh and other users</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Button 
          onClick={checkViolations} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
        >
          {loading ? '🔄 Checking...' : '🔍 Check Violations'}
        </Button>
        
        <Button 
          onClick={createExpiredTicketForSam} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3"
        >
          {loading ? '🔄 Creating...' : '🚨 Create Mock Violation for Sam'}
        </Button>
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <p className="text-red-600">❌ {error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 mb-6 bg-green-50 border border-green-200">
          <p className="text-green-600">✅ {success}</p>
        </Card>
      )}

      {violations.length > 0 && (
        <div className="space-y-6">
          {/* Violations Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Violations Summary ({violations.length} total)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {violations.filter(v => v.status === 'OPEN').length}
                </div>
                <div className="text-sm text-blue-600">Open Violations</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {violations.filter(v => v.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-sm text-yellow-600">In Progress</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {violations.filter(v => v.isOverdue).length}
                </div>
                <div className="text-sm text-red-600">Overdue</div>
              </div>
            </div>

            {/* Violations Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dept</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overdue</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {violations.map((violation) => (
                    <tr key={violation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {violation.department}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => window.open(`#/ticket/${violation.ticketId}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {violation.ticketId.substring(0, 8)}...
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {violation.assigneeUser?.fullName || violation.assignee || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(violation.deadline).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getOverdueDisplay(violation)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(violation.status)}`}>
                          {violation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(violation.priority)}`}>
                          {violation.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Sam Marsh Specific Violations */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👤 Sam Marsh's "My Violations" Dashboard View
            </h2>
            
            {violations.filter(v => 
              v.assigneeUser?.fullName?.toLowerCase().includes('sam') || 
              v.assigneeUser?.fullName?.toLowerCase().includes('marsh') ||
              v.assignee?.toLowerCase().includes('sam') ||
              v.assignee?.toLowerCase().includes('marsh')
            ).length > 0 ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">📊 Sam's Violation Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-bold text-lg text-red-600">
                        {violations.filter(v => 
                          (v.assigneeUser?.fullName?.toLowerCase().includes('sam') || 
                           v.assigneeUser?.fullName?.toLowerCase().includes('marsh') ||
                           v.assignee?.toLowerCase().includes('sam') ||
                           v.assignee?.toLowerCase().includes('marsh')) && v.isOverdue
                        ).length}
                      </div>
                      <div className="text-red-600">Overdue</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-bold text-lg text-blue-600">
                        {violations.filter(v => 
                          (v.assigneeUser?.fullName?.toLowerCase().includes('sam') || 
                           v.assigneeUser?.fullName?.toLowerCase().includes('marsh') ||
                           v.assignee?.toLowerCase().includes('sam') ||
                           v.assignee?.toLowerCase().includes('marsh')) && v.status === 'OPEN'
                        ).length}
                      </div>
                      <div className="text-blue-600">Open</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-bold text-lg text-yellow-600">
                        {violations.filter(v => 
                          (v.assigneeUser?.fullName?.toLowerCase().includes('sam') || 
                           v.assigneeUser?.fullName?.toLowerCase().includes('marsh') ||
                           v.assignee?.toLowerCase().includes('sam') ||
                           v.assignee?.toLowerCase().includes('marsh')) && v.status === 'IN_PROGRESS'
                        ).length}
                      </div>
                      <div className="text-yellow-600">In Progress</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-bold text-lg text-gray-600">
                        {violations.filter(v => 
                          v.assigneeUser?.fullName?.toLowerCase().includes('sam') || 
                          v.assigneeUser?.fullName?.toLowerCase().includes('marsh') ||
                          v.assignee?.toLowerCase().includes('sam') ||
                          v.assignee?.toLowerCase().includes('marsh')
                        ).length}
                      </div>
                      <div className="text-gray-600">Total</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {violations
                    .filter(v => 
                      v.assigneeUser?.fullName?.toLowerCase().includes('sam') || 
                      v.assigneeUser?.fullName?.toLowerCase().includes('marsh') ||
                      v.assignee?.toLowerCase().includes('sam') ||
                      v.assignee?.toLowerCase().includes('marsh')
                    )
                    .map((violation) => (
                      <div key={violation.id} className={`border rounded-lg p-4 ${
                        violation.isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-gray-900">{violation.title}</h3>
                              {violation.isOverdue && (
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
                                  🚨 OVERDUE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>📅 Deadline: {new Date(violation.deadline).toLocaleDateString()}</span>
                              <span>🎫 Ticket: {violation.ticketId.substring(0, 8)}...</span>
                              <span>🏢 Dept: {violation.department}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="mb-2">
                              {getOverdueDisplay(violation)}
                            </div>
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(violation.status)}`}>
                                {violation.status}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(violation.priority)}`}>
                                {violation.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>No violations found for Sam Marsh</p>
                <p className="text-sm mt-2">Click "Create Mock Violation for Sam" to see how violations appear</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {violations.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-600">Click "Check Violations" to load violation data</p>
        </Card>
      )}
    </div>
  );
};

export default QuickViolationCheck;
