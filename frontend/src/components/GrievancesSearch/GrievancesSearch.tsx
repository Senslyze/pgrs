import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, FileText, Eye, Download, BarChart3, Users, Clock, AlertCircle } from 'lucide-react';
import type { SearchType, GrievanceData, PaginationInfo } from '@/types';
import { useGrievances, useSearchGrievances, useDownloadMedia } from '@/hooks/useGrievances';
import Pagination from '@/components/pagination/Pagination';

const GrievancesSearch: React.FC = () => {
  const [searchType, setSearchType] = useState<SearchType>('grievance_id');
  const [searchValue, setSearchValue] = useState('');
  const [filterValue, _setFilterValue] = useState('');
  const [showResults, setShowResults] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ grievances: GrievanceData[]; pagination: PaginationInfo | null } | null>(null);
  const [viewingMedia, setViewingMedia] = useState(false);
  const [downloadingMedia, setDownloadingMedia] = useState(false);

  // Use single API call with limit=1000 for both table and statistics
  const { data: allGrievancesData, isLoading, error } = useGrievances(1, 1000);
  const searchMutation = useSearchGrievances();
  const downloadMediaMutation = useDownloadMedia();

  // Helper function to handle nested response structure: data.data.grievances
  const getGrievancesFromResponse = (responseData: any): GrievanceData[] => {
    if (!responseData) return [];
    return responseData.data?.grievances || responseData.grievances || [];
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setIsSearching(false);
      setSearchResults(null);
      setCurrentPage(1);
      // No need to refetch - we already have all data from limit=1000
      return;
    }

    setIsSearching(true);
    try {
      if (searchType === 'grievance_id' || searchType === 'phone_number') {
        // For grievance_id and phone_number, filter client-side from cached data
        // Handle nested response structure: data.data.grievances
        if (allGrievancesData) {
          const responseData = allGrievancesData as any;
          const grievancesList = responseData.data?.grievances || responseData.grievances || [];
          const filtered = grievancesList.filter((g: GrievanceData) => {
            if (searchType === 'grievance_id') {
              return g.id === searchValue || g.id.toLowerCase().includes(searchValue.toLowerCase());
            } else {
              return g.phone_number === searchValue;
            }
          });
          if (filtered.length > 0) {
            setSearchResults({
              grievances: filtered,
              pagination: {
                current_page: 1,
                total_pages: 1,
                total_count: filtered.length,
                limit: filtered.length,
                has_next_page: false,
                has_prev_page: false
              }
            });
          } else {
            setSearchResults({
              grievances: [],
              pagination: null
            });
          }
        } else {
          setSearchResults({
            grievances: [],
            pagination: null
          });
        }
      } else {
        // Use API search for other types
        const response = await searchMutation.mutateAsync({
          type: searchType,
          value: searchValue,
          limit: showResults
        });
        if (response.success) {
          setSearchResults({
            grievances: response.data.grievances,
            pagination: response.data.pagination
          });
        } else {
          setSearchResults({
            grievances: [],
            pagination: null
          });
        }
      }
    } catch (err) {
      console.error('Error searching grievances:', err);
      setSearchResults({
        grievances: [],
        pagination: null
      });
    }
  };

  // Get all grievances from single API call (limit=1000)
  const allGrievancesForStats = isSearching && searchResults 
    ? searchResults.grievances 
    : getGrievancesFromResponse(allGrievancesData?.data);
  
  // Determine which data to use for table (use same data source)
  const grievances = isSearching && searchResults 
    ? searchResults.grievances 
    : allGrievancesForStats;
  
  // Calculate pagination client-side from the data
  const totalGrievances = isSearching && searchResults
    ? searchResults.pagination?.total_count || searchResults.grievances.length
    : allGrievancesForStats.length;
  
  const loading = isLoading || searchMutation.isPending;
  const errorMessage = error ? (error as Error).message : null;
  
  const resolvedCount = allGrievancesForStats.filter((g: GrievanceData) => g.status === 'RESOLVED').length;
  const inProgressCount = allGrievancesForStats.filter((g: GrievanceData) => g.status !== 'RESOLVED').length;
  const highPriorityCount = allGrievancesForStats.filter((g: GrievanceData) => g.ai_priority === 'HIGH').length;

  const filteredGrievances = grievances.filter((grievance: GrievanceData) =>
    filterValue === '' ||
    grievance.name.toLowerCase().includes(filterValue.toLowerCase()) ||
    grievance.report_id.toLowerCase().includes(filterValue.toLowerCase()) ||
    grievance.subject.toLowerCase().includes(filterValue.toLowerCase())
  );
  
  // Client-side pagination for the filtered grievances
  const totalFiltered = filteredGrievances.length;
  const totalPages = Math.ceil(totalFiltered / showResults);
  const startIndex = (currentPage - 1) * showResults;
  const endIndex = startIndex + showResults;
  const paginatedGrievances = filteredGrievances.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Media handling functions
  const handleViewMedia = async (mediaId: string) => {
    try {
      setViewingMedia(true);
      console.log('Viewing media for mediaId:', mediaId);
      const blob = await downloadMediaMutation.mutateAsync(mediaId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Clean up the object URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to view media:', error);
      alert('Failed to load media. Please try again.');
    } finally {
      setViewingMedia(false);
    }
  };

  const handleDownloadMedia = async (mediaId: string, reportId: string) => {
    try {
      setDownloadingMedia(true);
      console.log('Downloading media for mediaId:', mediaId);
      const blob = await downloadMediaMutation.mutateAsync(mediaId);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grievance-${reportId}-media`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download media. Please try again.');
    } finally {
      setDownloadingMedia(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-4 pb-4">
        {/* Dashboard Header */}
        <div className="mb-8 px-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Grievance Management</h1>
              <p className="text-gray-600">Search, filter, and manage public grievances efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">Total Records</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalGrievances}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 px-2">
          {isLoading ? (
            // Loading Skeletons
            <>
              <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-3 bg-blue-400/30 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-blue-400/30 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-6 bg-blue-400/30 rounded animate-pulse"></div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-3 bg-green-400/30 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-green-400/30 rounded w-8 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-6 bg-green-400/30 rounded animate-pulse"></div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-3 bg-yellow-400/30 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-yellow-400/30 rounded w-10 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-6 bg-yellow-400/30 rounded animate-pulse"></div>
                </div>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-3 bg-red-400/30 rounded w-24 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-red-400/30 rounded w-10 animate-pulse"></div>
                  </div>
                  <div className="h-6 w-6 bg-red-400/30 rounded animate-pulse"></div>
                </div>
              </Card>
            </>
          ) : (
            // Actual Data Cards
            <>
              <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium">Total Grievances</p>
                    <p className="text-lg font-bold">{totalGrievances}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-blue-200" />
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs font-medium">Resolved</p>
                    <p className="text-lg font-bold">{resolvedCount}</p>
                  </div>
                  <Users className="h-6 w-6 text-green-200" />
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-xs font-medium">In Progress</p>
                    <p className="text-lg font-bold">{inProgressCount}</p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-200" />
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs font-medium">High Priority</p>
                    <p className="text-lg font-bold">{highPriorityCount}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-red-200" />
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Compact Search Section */}
        <div className="flex items-center gap-6 mb-6 px-2">
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow">
            <Search className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Search By:</span>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value as SearchType)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="grievance_id">Grievance ID</option>
              <option value="phone_number">Phone Number</option>
            </select>
          </div>
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow">
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`Enter ${searchType.replace('_', ' ')}...`}
              className="w-64 border-gray-300"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <Card className="p-6 mb-6 bg-red-50 border border-red-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="text-red-800 font-medium">{errorMessage}</div>
            </div>
          </Card>
        )}

        {/* Enhanced Results Table */}
        <div className="px-2">
          <Card className="overflow-hidden shadow-lg border-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Media</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    // Loading Skeleton Rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedGrievances.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-3">
                          <Search className="h-12 w-12 text-gray-300" />
                          <div className="text-lg font-medium">No grievances found</div>
                          <div className="text-sm">Try adjusting your search criteria</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedGrievances.map((grievance: GrievanceData) => (
                      <tr key={grievance.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm whitespace-nowrap font-medium text-gray-900">
                          {formatDate(grievance.date_of_registration)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(grievance.ai_priority)}`}>
                            {grievance.ai_priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-[120px] truncate" title={grievance.name}>
                          {grievance.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {grievance.phone_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[100px] truncate" title={grievance.department}>
                          {grievance.department}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate" title={grievance.subject}>
                          {grievance.subject}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(grievance.status)}`}>
                            {grievance.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {grievance.media_id ? (
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1"
                                onClick={() => handleViewMedia(grievance.media_id)}
                                title="View Media"
                                disabled={viewingMedia || downloadingMedia}
                              >
                                {viewingMedia ? (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1"
                                onClick={() => handleDownloadMedia(grievance.media_id, grievance.report_id)}
                                title="Download Media"
                                disabled={viewingMedia || downloadingMedia}
                              >
                                {downloadingMedia ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No media</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            onClick={() => {
                              window.location.hash = `#/view/${grievance.id}`;
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            <span>View</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {loading ? (
                // Loading Skeleton Cards for Mobile
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`mobile-skeleton-${index}`} className="p-4 border-b border-gray-200 animate-pulse">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))
              ) : paginatedGrievances.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-3">
                    <Search className="h-12 w-12 text-gray-300" />
                    <div className="text-lg font-medium">No grievances found</div>
                    <div className="text-sm">Try adjusting your search criteria</div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedGrievances.map((grievance: GrievanceData) => (
                    <div key={grievance.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 truncate" title={grievance.subject}>
                            {grievance.subject}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{grievance.name} • {grievance.phone_number}</p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(grievance.ai_priority)}`}>
                            {grievance.ai_priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(grievance.status)}`}>
                            {grievance.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(grievance.date_of_registration)}
                        </div>
                        <div>
                          <span className="font-medium">Dept:</span> <span className="truncate" title={grievance.department}>{grievance.department}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {grievance.media_id && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2"
                                onClick={() => handleViewMedia(grievance.media_id)}
                                title="View Media"
                                disabled={viewingMedia || downloadingMedia}
                              >
                                {viewingMedia ? (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2"
                                onClick={() => handleDownloadMedia(grievance.media_id, grievance.report_id)}
                                title="Download Media"
                                disabled={viewingMedia || downloadingMedia}
                              >
                                {downloadingMedia ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => {
                            window.location.hash = `#/view/${grievance.id}`;
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          <span>View Details</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Enhanced Pagination - Client-side pagination */}
            {!loading && totalFiltered > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={showResults}
                  totalCount={totalFiltered}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                  }}
                  onPageSizeChange={(size) => {
                    setShowResults(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GrievancesSearch;