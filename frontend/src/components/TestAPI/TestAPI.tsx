import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { violationApi, ticketApi } from '@/services/api/admin';
import TestSLAFlow from './TestSLAFlow';
import QuickViolationCheck from '../QuickViolationCheck/QuickViolationCheck';

const TestAPI: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSLAFlow, setShowSLAFlow] = useState(false);
  const [showViolationCheck, setShowViolationCheck] = useState(false);

  const addResult = (test: string, success: boolean, data: any, error?: string) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testViolations = async () => {
    setLoading(true);
    try {
      console.log('Testing violations API...');
      const response = await violationApi.getViolations(1, 10);
      addResult('GET /violations', true, response.data);
    } catch (error: any) {
      addResult('GET /violations', false, null, error.message);
    }
    setLoading(false);
  };

  const testMyViolations = async () => {
    setLoading(true);
    try {
      console.log('Testing my violations API...');
      const response = await violationApi.getMyViolations(1, 10);
      addResult('GET /violations/my', true, response.data);
    } catch (error: any) {
      addResult('GET /violations/my', false, null, error.message);
    }
    setLoading(false);
  };

  const testTeamViolations = async () => {
    setLoading(true);
    try {
      console.log('Testing team violations API...');
      const response = await violationApi.getTeamViolations(1, 10);
      addResult('GET /violations/team', true, response.data);
    } catch (error: any) {
      addResult('GET /violations/team', false, null, error.message);
    }
    setLoading(false);
  };

  const testTickets = async () => {
    setLoading(true);
    try {
      console.log('Testing tickets API...');
      const response = await ticketApi.getTickets(1, 10);
      addResult('GET /tickets', true, response.data);
    } catch (error: any) {
      addResult('GET /tickets', false, null, error.message);
    }
    setLoading(false);
  };

  const testMyTickets = async () => {
    setLoading(true);
    try {
      console.log('Testing my tickets API...');
      const response = await ticketApi.getMyTickets(1, 10);
      addResult('GET /tickets/my', true, response.data);
    } catch (error: any) {
      addResult('GET /tickets/my', false, null, error.message);
    }
    setLoading(false);
  };

  const testAll = async () => {
    setResults([]);
    await testViolations();
    await testMyViolations();
    await testTeamViolations();
    await testTickets();
    await testMyTickets();
  };

  const clearResults = () => {
    setResults([]);
  };

  if (showSLAFlow) {
    return <TestSLAFlow />;
  }

  if (showViolationCheck) {
    return <QuickViolationCheck />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API Endpoint Tester</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setShowViolationCheck(true)} className="bg-red-600 hover:bg-red-700">
            🚨 Check Violations
          </Button>
          <Button onClick={() => setShowSLAFlow(true)} className="bg-green-600">
            Test SLA Flow
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={testViolations} disabled={loading}>
          Test Violations
        </Button>
        <Button onClick={testMyViolations} disabled={loading}>
          Test My Violations
        </Button>
        <Button onClick={testTeamViolations} disabled={loading}>
          Test Team Violations
        </Button>
        <Button onClick={testTickets} disabled={loading}>
          Test Tickets
        </Button>
        <Button onClick={testMyTickets} disabled={loading}>
          Test My Tickets
        </Button>
        <Button onClick={testAll} disabled={loading} className="bg-blue-600">
          Test All
        </Button>
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
          <p>No test results yet. Click a test button above to start testing.</p>
        </Card>
      )}
    </div>
  );
};

export default TestAPI;
