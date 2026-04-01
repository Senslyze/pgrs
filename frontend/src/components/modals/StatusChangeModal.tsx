import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import type { GrievanceData } from '@/types';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: GrievanceData | null;
  currentStatus: string;
  onStatusUpdate: (grievanceId: string, newStatus: string, comment: string) => Promise<void>;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  grievance,
  currentStatus,
  onStatusUpdate
}) => {
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Only allow RESPONDED and RESOLVED statuses
  const getAllowedStatuses = () => {
    return ['RESPONDED', 'RESOLVED'];
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewStatus('');
      setComment('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!grievance) return;
    
    // Validation
    if (!newStatus) {
      setError('Please select a new status');
      return;
    }
    
    // Comment is REQUIRED for RESPONDED and RESOLVED
    if ((newStatus === 'RESPONDED' || newStatus === 'RESOLVED') && !comment.trim()) {
      setError('Comment is required for RESPONDED and RESOLVED status');
      return;
    }
    
    // Comment is optional but recommended for other statuses
    if (!comment.trim() && newStatus !== 'RESPONDED' && newStatus !== 'RESOLVED') {
      setError('Please enter a comment explaining the status change');
      return;
    }
    
    if (newStatus === currentStatus) {
      setError('Please select a different status');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onStatusUpdate(grievance.id, newStatus, comment.trim());
      
      // Close modal on success
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen || !grievance) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Update Status</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Status <span className="text-red-500">*</span>
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {getAllowedStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter comment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                disabled={loading}
              />
              <div className="text-xs text-gray-500">
                {comment.length}/500 characters
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !newStatus || !comment.trim()}
                className="flex-1"
              >
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusChangeModal;
