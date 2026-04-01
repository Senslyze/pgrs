import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, User, Building, Download, Clock, AlertCircle, CheckCircle, FileText, ArrowLeft, Calendar } from 'lucide-react';
import { useGrievance, useDownloadMedia } from '@/hooks/useGrievances';

interface GrievancesViewProps {
  grievanceId?: string;
}

interface ReverseGeocodeData {
  city?: string;
  state?: string;
  district?: string;
  country?: string;
  formatted?: string;
}

const GrievancesView: React.FC<GrievancesViewProps> = ({ grievanceId: initialGrievanceId }) => {
  const [grievanceId, setGrievanceId] = useState(initialGrievanceId || '01K5XNWR0GCYEGE6H859AAN6Y0');
  const [reverseGeoData, setReverseGeoData] = useState<ReverseGeocodeData | null>(null);
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false);
  const [viewingMedia, setViewingMedia] = useState(false);
  const [downloadingMedia, setDownloadingMedia] = useState(false);

  // Use React Query hook for fetching grievance
  const { data: grievanceResponse, isLoading: loading, error: queryError, refetch: refetchGrievance } = useGrievance(grievanceId);
  const downloadMediaMutation = useDownloadMedia();

  const responseData = grievanceResponse as any;
  const grievance = responseData?.data?.grievance || responseData?.grievance || responseData?.data || null;
  const error = queryError ? (queryError as Error).message : null;
  
  const fetchGrievance = () => {
    refetchGrievance();
  };

  // If initialGrievanceId changes, update the state
  useEffect(() => {
    if (initialGrievanceId) {
      setGrievanceId(initialGrievanceId);
    }
  }, [initialGrievanceId]);

  useEffect(() => {
    if (grievance?.latitude && grievance?.longitude) {
      fetchReverseGeocodeData(grievance.latitude, grievance.longitude);
    }
  }, [grievance?.latitude, grievance?.longitude]);

  const fetchReverseGeocodeData = async (lat: number, lng: number) => {
    setReverseGeoLoading(true);
    try {
      // Using OpenCage API for reverse geocoding
      const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
      
      // Check if API key is available
      if (!apiKey) {
        console.warn('OpenCage API key not found');
        setReverseGeoLoading(false);
        return;
      }
      
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}%2C+${lng}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;
        
        setReverseGeoData({
          city: components.city || components.town || components.village || 'N/A',
          state: components.state || components.region || 'N/A',
          district: components.county || components.district || 'N/A',
          country: components.country || 'N/A',
          formatted: result.formatted || 'N/A'
        });
      }
    } catch (err) {
      console.error('Error fetching reverse geocode data:', err);
    } finally {
      setReverseGeoLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'SUBMITTED': return <FileText className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };



  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="p-8 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Loading Grievance</h3>
              <p className="text-gray-600">Please wait while we fetch the details...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Grievance Details</h1>
          </div>

          <Card className="p-8 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Error Loading Grievance</h3>
            </div>
            <p className="text-red-700 mb-6">{error}</p>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Try Another Grievance ID:
              </label>
              <div className="flex gap-3">
                <Input
                  value={grievanceId}
                  onChange={(e) => setGrievanceId(e.target.value)}
                  placeholder="Enter grievance ID"
                  className="max-w-md h-12 border-2"
                />
                <Button
                  onClick={fetchGrievance}
                  className="h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Fetch Details
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main grievance view with enhanced UI
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Back to Search Button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>

        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grievance Details</h1>
            <p className="text-gray-600">Complete information about this grievance</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Report ID</div>
            <div className="text-xl font-bold text-blue-600">{grievance?.report_id}</div>
          </div>
        </div>

        {/* Quick Search */}
        <Card className="p-4 mb-6 bg-white shadow-lg">
          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Different Grievance:
              </label>
              <Input
                value={grievanceId}
                onChange={(e) => setGrievanceId(e.target.value)}
                placeholder="Enter grievance ID"
                className="h-10 border-2"
              />
            </div>
            <Button
              onClick={fetchGrievance}
              className="h-10 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Load
            </Button>
          </div>
        </Card>

        {grievance && (
          <div className="space-y-8">
            {/* Status and Priority Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Current Status</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-white">{getStatusIcon(grievance.status)}</div>
                      <p className="text-2xl font-bold">{grievance.status}</p>
                    </div>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-200" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Priority Level</p>
                    <p className="text-2xl font-bold mt-1">{grievance.ai_priority}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-200" />
                </div>
              </Card>
            </div>

            {/* Enhanced Media Section */}
            {(grievance.image_url || grievance.media_id) && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-600" />
                      Grievance Media
                    </CardTitle>
                    {grievance.media_id && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleViewMedia(grievance.media_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                          disabled={viewingMedia || downloadingMedia}
                        >
                          {viewingMedia ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View Media
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDownloadMedia(grievance.media_id, grievance.report_id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          disabled={viewingMedia || downloadingMedia}
                        >
                          {downloadingMedia ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Media ID</div>
                      <div className="text-lg font-mono">{grievance.media_id}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Validation Status</div>
                      <div className={`text-lg font-semibold ${grievance.is_image_validated ? 'text-green-600' : 'text-red-600'}`}>
                        {grievance.is_image_validated ? 'Validated' : 'Not Validated'}
                      </div>
                    </div>
                    {grievance.media_id && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-600">Media Available</div>
                        <div className="text-lg font-semibold text-green-600">Yes</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applicant Details */}
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              <span className="font-medium">Applicant Details</span>
            </div>

            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Name</div>
                    <div>{grievance.name}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Phone Number</div>
                    <div>{grievance.phone_number}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Age</div>
                    <div>{grievance.age}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Gender</div>
                    <div>{grievance.gender}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Submission Time</div>
                    <div>{formatDateTime(grievance.submission_time)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600 mb-1">Created At</div>
                    <div>{formatDateTime(grievance.created_at)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-gray-600 mb-1">Grievance Address</div>
                    <div>{grievance.location_address || grievance.grievance_address || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Location Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coordinates Section */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-medium text-gray-600 mb-1">Latitude</div>
                      <div className="text-lg font-mono">{grievance.latitude}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-medium text-gray-600 mb-1">Longitude</div>
                      <div className="text-lg font-mono">{grievance.longitude}</div>
                    </div>
                  </div>
                  
                  {/* Map Section */}
                  <div className="lg:col-span-2">
                    <div className="font-medium text-gray-600 mb-1">Location Map</div>
                    <div className="h-full">
                      {grievance.location_name ? (
                        <div className="h-full">
                          <div className="text-gray-900 mb-2 font-medium">{grievance.location_name}</div>
                          {/* Embedded Google Maps preview using location name */}
                          <div className="rounded-lg overflow-hidden w-full h-64 relative border border-gray-300 shadow-sm">
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(grievance.location_name || '')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                            ></iframe>
                          </div>
                          <button
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(grievance.location_name || '')}`, '_blank', 'noopener,noreferrer')}
                            className="mt-2 w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            View on Google Maps
                          </button>
                        </div>
                      ) : grievance.latitude && grievance.longitude ? (
                        <div className="h-full">
                          {/* Embedded Google Maps preview using lat/long */}
                          <div className="rounded-lg overflow-hidden w-full h-64 relative border border-gray-300 shadow-sm">
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://maps.google.com/maps?q=${grievance.latitude},${grievance.longitude}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                            ></iframe>
                          </div>
                          <button
                            onClick={() => window.open(`https://www.google.com/maps?q=${grievance.latitude},${grievance.longitude}`, '_blank', 'noopener,noreferrer')}
                            className="mt-2 w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            View on Google Maps
                          </button>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                          <span className="text-gray-400">No location data available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Reverse Geocoding Information */}
                  {(grievance.latitude && grievance.longitude) && (
                    <div className="lg:col-span-3 mt-4">
                      <div className="border-t pt-4">
                        <h3 className="text-md font-semibold mb-3">Administrative Information</h3>
                        {reverseGeoLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading location details...</span>
                          </div>
                        ) : reverseGeoData ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <div className="text-xs text-blue-600 font-medium">City</div>
                              <div className="font-medium mt-1">{reverseGeoData.city}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <div className="text-xs text-green-600 font-medium">District</div>
                              <div className="font-medium mt-1">{reverseGeoData.district}</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <div className="text-xs text-purple-600 font-medium">State</div>
                              <div className="font-medium mt-1">{reverseGeoData.state}</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <div className="text-xs text-yellow-600 font-medium">Country</div>
                              <div className="font-medium mt-1">{reverseGeoData.country}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">
                            Unable to fetch administrative details for this location
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grievance Details */}
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5" />
              <span className="font-medium">Grievance Details</span>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Department</div>
                        <div>{grievance.department}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Sub Subject</div>
                        <div>{grievance.sub_subject}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Priority</div>
                        <div>
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            {grievance.ai_priority}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Status</div>
                        <div className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded inline-block">
                          {grievance.status}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Remarks</div>
                        <div>{grievance.remark}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Subject</div>
                        <div>{grievance.subject}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Last Updated</div>
                        <div>{formatDateTime(grievance.updated_at)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-600 mb-1">Image Validation</div>
                        <div className={`text-sm ${grievance.is_image_validated ? 'text-green-600' : 'text-red-600'}`}>
                          {grievance.is_image_validated ? 'Validated' : 'Not Validated'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrievancesView;