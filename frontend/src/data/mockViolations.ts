import type { Violation } from '@/types';

// Mock violation data generator for testing
export const generateMockViolations = (count: number = 20): Violation[] => {
  const departments = [
    'Public Works', 'Health Department', 'Environmental Services', 
    'Building Inspection', 'Traffic Management', 'Waste Management'
  ];
  
  const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const statuses: ('OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  
  const violationTypes = [
    'Illegal Dumping', 'Building Code Violation', 'Traffic Violation', 
    'Health Code Violation', 'Environmental Violation', 'Noise Violation',
    'Zoning Violation', 'Safety Violation', 'Permit Violation'
  ];
  
  const descriptions = [
    'Unauthorized construction work without proper permits',
    'Illegal dumping of hazardous materials in public area',
    'Excessive noise during restricted hours',
    'Building safety code violations identified during inspection',
    'Traffic signal malfunction causing safety concerns',
    'Environmental contamination from improper waste disposal',
    'Zoning ordinance violations in residential area',
    'Health code violations in food service establishment',
    'Safety equipment not properly maintained or installed'
  ];

  const violations: Violation[] = [];
  
  for (let i = 1; i <= count; i++) {
    const now = new Date();
    const createdDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
    const deadline = new Date(createdDate.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000); // 1-15 days from creation
    const isOverdue = now > deadline;
    
    const violation: Violation = {
      id: `violation-${i.toString().padStart(3, '0')}`,
      reportId: `VIO-${(1000 + i).toString()}`,
      title: violationTypes[Math.floor(Math.random() * violationTypes.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      departmentId: `dept-${Math.floor(Math.random() * departments.length) + 1}`,
      ticketId: `TKT-${(2000 + i).toString()}`,
      ticketUrl: `/grievance/violation-${i.toString().padStart(3, '0')}`,
      assignee: Math.random() > 0.3 ? `user-${Math.floor(Math.random() * 10) + 1}` : undefined,
      deadline: deadline.toISOString(),
      isOverdue,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdBy: `user-${Math.floor(Math.random() * 5) + 1}`,
      createdAt: createdDate.toISOString(),
      updatedAt: new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...(Math.random() > 0.7 && { resolvedAt: new Date(createdDate.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString() }),
      ...(Math.random() > 0.8 && { closedAt: new Date(createdDate.getTime() + Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString() })
    };
    
    violations.push(violation);
  }
  
  return violations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Mock API responses
export const mockViolationsResponse = {
  success: true,
  data: {
    violations: generateMockViolations(15),
    pagination: {
      current_page: 1,
      total_pages: 2,
      total_count: 15,
      limit: 10,
      has_next_page: true,
      has_prev_page: false
    }
  }
};

export const mockMyViolationsResponse = {
  success: true,
  data: {
    violations: generateMockViolations(8).map(v => ({ ...v, assignee: 'current-user' })),
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_count: 8,
      limit: 10,
      has_next_page: false,
      has_prev_page: false
    }
  }
};

export const mockTeamViolationsResponse = {
  success: true,
  data: {
    violations: generateMockViolations(12),
    pagination: {
      current_page: 1,
      total_pages: 2,
      total_count: 12,
      limit: 10,
      has_next_page: true,
      has_prev_page: false
    }
  }
};
