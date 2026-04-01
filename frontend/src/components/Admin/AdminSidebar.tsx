import React from 'react';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    {
      category: 'Tickets',
      items: [
        { id: 'all-tickets', label: 'All Tickets' },
        { id: 'my-tickets', label: 'My Tickets' },
      ]
    },
    {
      category: 'Violations',
      items: [
        { id: 'my-violations', label: 'My Violations' },
        { id: 'team-violations', label: 'Team Violations' },
      ]
    },
    {
      category: 'Management',
      items: [
        { id: 'users', label: 'User Management' },
        { id: 'departments', label: 'Department Management' },
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit sticky top-6">
      <div className="p-6">
        {menuItems.map((category, categoryIndex) => (
          <div key={category.category} className={categoryIndex > 0 ? "mt-8" : ""}>
            {/* Category Header */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">
                {category.category}
              </h3>
            </div>
            
            {/* Category Items */}
            <div className="space-y-1">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <span className="ml-2">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;
