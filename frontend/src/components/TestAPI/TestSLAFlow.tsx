import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { violationApi, ticketApi, departmentApi, userApi } from '@/services/api/admin';

const TestSLAFlow: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    departmentId: '',
    userId: '',
    ticketId: '',
    violationId: ''
  });

  const addResult = (test: string, success: boolean, data: any, error?: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Step 0: Check current user role
  const checkUserRole = async () => {
    setLoading(true);
    try {
      console.log('Checking current user role...');
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        addResult('Check User Role', false, null, 'No authentication token found');
        setLoading(false);
        return;
      }
      
      // Decode JWT to check user role
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Current user role:', payload.role);
      
      addResult('Check User Role', true, { 
        role: payload.role, 
        username: payload.username,
        departmentId: payload.departmentId,
        hasDepartment: !!payload.departmentId,
        canCreateTickets: payload.role === 'ADMIN' && !!payload.departmentId,
        canViewViolations: true
      });
    } catch (error: any) {
      addResult('Check User Role', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 1: Get available departments and users
  const loadTestData = async () => {
    setLoading(true);
    try {
      console.log('Loading test data...');
      
      // Get departments
      const deptResponse = await departmentApi.getDepartments(1, 10);
      const departments = deptResponse.data.departments || [];
      
      // Get users
      const userResponse = await userApi.getUsers(1, 10);
      const users = userResponse.data.users || [];
      
      if (departments.length > 0) {
        setTestData(prev => ({ ...prev, departmentId: departments[0].id }));
      }
      
      if (users.length > 0) {
        setTestData(prev => ({ ...prev, userId: users[0].id }));
      }
      
      addResult('Load Test Data', true, { departments: departments.length, users: users.length });
    } catch (error: any) {
      addResult('Load Test Data', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 2: Create SLA rules for department
  const createSLARules = async () => {
    setLoading(true);
    try {
      console.log('Creating SLA rules...');
      
      // This would be a POST to /slas endpoint
      // For now, we'll simulate it
      const slaData = {
        departmentId: testData.departmentId,
        rules: [
          { status: 'SUBMITTED', timeLimitMinutes: 1 }, // 1 minute for testing
          { status: 'IN_PROGRESS', timeLimitMinutes: 2 }, // 2 minutes for testing
          { status: 'RESOLVED', timeLimitMinutes: 5 } // 5 minutes for testing
        ]
      };
      
      addResult('Create SLA Rules', true, slaData);
    } catch (error: any) {
      addResult('Create SLA Rules', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 3: Create a test ticket
  const createTestTicket = async () => {
    setLoading(true);
    try {
      console.log('Creating test ticket...');
      
      // Check if user has permission to create tickets
      const token = localStorage.getItem('auth_token');
      if (!token) {
        addResult('Create Test Ticket', false, null, 'No authentication token found');
        setLoading(false);
        return;
      }
      
      // Decode JWT to check user role and department
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Current user role:', payload.role);
      console.log('Current user department:', payload.departmentId);
      
      if (payload.role !== 'ADMIN') {
        addResult('Create Test Ticket', false, null, `User role '${payload.role}' cannot create tickets. Only ADMIN users can create tickets.`);
        setLoading(false);
        return;
      }
      
      if (!payload.departmentId) {
        addResult('Create Test Ticket', false, null, `User must be assigned to a department to create tickets. Current department: ${payload.departmentId || 'None'}`);
        setLoading(false);
        return;
      }
      
      const ticketData = {
        title: 'Test SLA Ticket - ' + new Date().toLocaleTimeString(),
        description: 'This is a test ticket to verify SLA violation flow',
        type: 'COMPLAINT' as const,
        priority: 'HIGH' as const,
        assignedTo: testData.userId,
        departmentId: testData.departmentId,
        tags: ['test', 'sla'],
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      const response = await ticketApi.createTicket(ticketData);
      setTestData(prev => ({ ...prev, ticketId: response.data.id }));
      
      addResult('Create Test Ticket', true, response.data);
    } catch (error: any) {
      addResult('Create Test Ticket', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 4: Check for violations (should be empty initially)
  const checkViolations = async () => {
    setLoading(true);
    try {
      console.log('Checking violations...');
      
      const response = await violationApi.getViolations(1, 10);
      addResult('Check Violations', true, response.data);
    } catch (error: any) {
      addResult('Check Violations', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 5: Wait for SLA violation (simulate waiting)
  const waitForViolation = async () => {
    setLoading(true);
    addResult('Wait for SLA Violation', true, { message: 'Waiting 2 minutes for SLA to expire...' });
    
    // Simulate waiting
    setTimeout(async () => {
      try {
        const response = await violationApi.getViolations(1, 10);
        addResult('Check Violations After Wait', true, response.data);
        
        if (response.data.violations && response.data.violations.length > 0) {
          setTestData(prev => ({ ...prev, violationId: response.data.violations[0].id }));
        }
      } catch (error: any) {
        addResult('Check Violations After Wait', false, null, error.message);
      }
      setLoading(false);
    }, 2000); // Wait 2 seconds for demo
  };

  // Step 6: Update ticket status to resolve violation
  const resolveTicket = async () => {
    setLoading(true);
    try {
      console.log('Resolving ticket...');
      
      const response = await ticketApi.updateTicketStatus(testData.ticketId, 'RESOLVED');
      addResult('Resolve Ticket', true, response.data);
    } catch (error: any) {
      addResult('Resolve Ticket', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 7: Check violations after resolution
  const checkViolationsAfterResolution = async () => {
    setLoading(true);
    try {
      console.log('Checking violations after resolution...');
      
      const response = await violationApi.getViolations(1, 10);
      addResult('Check Violations After Resolution', true, response.data);
    } catch (error: any) {
      addResult('Check Violations After Resolution', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 8: Test user perspective
  const testUserPerspective = async () => {
    setLoading(true);
    try {
      console.log('Testing user perspective...');
      
      // Check my tickets
      const myTicketsResponse = await ticketApi.getMyTickets(1, 10);
      addResult('User: My Tickets', true, myTicketsResponse.data);
      
      // Check my violations
      const myViolationsResponse = await violationApi.getMyViolations(1, 10);
      addResult('User: My Violations', true, myViolationsResponse.data);
      
    } catch (error: any) {
      addResult('Test User Perspective', false, null, error.message);
    }
    setLoading(false);
  };

  // Step 9: Test admin perspective
  const testAdminPerspective = async () => {
    setLoading(true);
    try {
      console.log('Testing admin perspective...');
      
      // Check all tickets
      const allTicketsResponse = await ticketApi.getTickets(1, 10);
      addResult('Admin: All Tickets', true, allTicketsResponse.data);
      
      // Check all violations
      const allViolationsResponse = await violationApi.getViolations(1, 10);
      addResult('Admin: All Violations', true, allViolationsResponse.data);
      
      // Check team violations
      const teamViolationsResponse = await violationApi.getTeamViolations(1, 10, testData.departmentId);
      addResult('Admin: Team Violations', true, teamViolationsResponse.data);
      
    } catch (error: any) {
      addResult('Test Admin Perspective', false, null, error.message);
    }
    setLoading(false);
  };

  // Run complete flow
  const runCompleteFlow = async () => {
    setResults([]);
    await checkUserRole();
    await loadTestData();
    await createSLARules();
    await createTestTicket();
    await checkViolations();
    await waitForViolation();
    await resolveTicket();
    await checkViolationsAfterResolution();
    await testUserPerspective();
    await testAdminPerspective();
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SLA → Violation Flow Tester</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Test Data</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department ID:</label>
              <Input 
                value={testData.departmentId} 
                onChange={(e) => setTestData(prev => ({ ...prev, departmentId: e.target.value }))}
                placeholder="Department ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID:</label>
              <Input 
                value={testData.userId} 
                onChange={(e) => setTestData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="User ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket ID:</label>
              <Input 
                value={testData.ticketId} 
                onChange={(e) => setTestData(prev => ({ ...prev, ticketId: e.target.value }))}
                placeholder="Ticket ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Violation ID:</label>
              <Input 
                value={testData.violationId} 
                onChange={(e) => setTestData(prev => ({ ...prev, violationId: e.target.value }))}
                placeholder="Violation ID"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Test Steps</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={checkUserRole} disabled={loading} size="sm" className="bg-purple-600">
              0. Check Role
            </Button>
            <Button onClick={loadTestData} disabled={loading} size="sm">
              1. Load Data
            </Button>
            <Button onClick={createSLARules} disabled={loading} size="sm">
              2. Create SLA
            </Button>
            <Button onClick={createTestTicket} disabled={loading} size="sm">
              3. Create Ticket
            </Button>
            <Button onClick={checkViolations} disabled={loading} size="sm">
              4. Check Violations
            </Button>
            <Button onClick={waitForViolation} disabled={loading} size="sm">
              5. Wait & Check
            </Button>
            <Button onClick={resolveTicket} disabled={loading} size="sm">
              6. Resolve Ticket
            </Button>
            <Button onClick={testUserPerspective} disabled={loading} size="sm">
              7. User View
            </Button>
            <Button onClick={testAdminPerspective} disabled={loading} size="sm">
              8. Admin View
            </Button>
          </div>
          <div className="mt-4">
            <Button onClick={runCompleteFlow} disabled={loading} className="w-full bg-blue-600">
              Run Complete Flow
            </Button>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Ticket creation requires:
              <br />• ADMIN role
              <br />• Department assignment
              <br />If you're logged in as USER or don't have a department, 
              you can still test the violation viewing functionality.
            </p>
          </div>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Test Results</h2>
        <Button onClick={clearResults} variant="outline">
          Clear Results
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className={`p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅' : '❌'} {result.test}
                </h3>
                <p className="text-sm text-gray-600">Time: {result.timestamp}</p>
                {result.error && (
                  <p className="text-sm text-red-600 mt-2">Error: {result.error}</p>
                )}
              </div>
            </div>
            {result.data && (
              <div className="mt-3">
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </Card>
        ))}
      </div>

      {results.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <p>No test results yet. Click "Run Complete Flow" to start testing the SLA → Violation flow.</p>
        </Card>
      )}
    </div>
  );
};

export default TestSLAFlow;
