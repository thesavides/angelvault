import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, CheckCircle, XCircle, MessageSquare, Video,
  ChevronRight, Loader2, Filter, Search, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent, trackEvents } from '../utils/analytics';
import type { MeetingRequest } from '../types';
import toast from 'react-hot-toast';

export function DeveloperMeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<MeetingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('page_view', { page: 'developer_meetings' });
    loadMeetings();
  }, []);

  useEffect(() => {
    filterMeetings();
  }, [meetings, statusFilter, searchQuery]);

  const loadMeetings = async () => {
    try {
      const res = await api.getDeveloperMeetings();
      setMeetings(res.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMeetings = () => {
    let filtered = [...meetings];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.investor?.first_name?.toLowerCase().includes(query) ||
        m.investor?.last_name?.toLowerCase().includes(query) ||
        m.project?.title?.toLowerCase().includes(query)
      );
    }
    
    setFilteredMeetings(filtered);
  };

  const handleAccept = async (meetingId: string) => {
    setRespondingTo(meetingId);
    try {
      await api.respondToMeeting(meetingId, 'accepted');
      trackEvents.respondToMeeting(meetingId, 'accepted');
      toast.success('Meeting request accepted');
      loadMeetings();
    } catch (error) {
      console.error('Failed to accept meeting:', error);
      toast.error('Failed to accept meeting');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDecline = async (meetingId: string) => {
    const reason = window.prompt('Reason for declining (optional):');
    setRespondingTo(meetingId);
    try {
      await api.respondToMeeting(meetingId, 'declined', reason || undefined);
      trackEvents.respondToMeeting(meetingId, 'declined');
      toast.success('Meeting request declined');
      loadMeetings();
    } catch (error) {
      console.error('Failed to decline meeting:', error);
      toast.error('Failed to decline meeting');
    } finally {
      setRespondingTo(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
      pending: { label: 'Pending Response', variant: 'warning' },
      accepted: { label: 'Accepted', variant: 'success' },
      declined: { label: 'Declined', variant: 'error' },
      completed: { label: 'Completed', variant: 'secondary' },
      cancelled: { label: 'Cancelled', variant: 'secondary' },
    };
    return config[status] || { label: status, variant: 'secondary' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = meetings.filter(m => m.status === 'pending').length;
  const acceptedCount = meetings.filter(m => m.status === 'accepted').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-wide py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-900">Meeting Requests</h1>
            <p className="text-gray-600 mt-1">
              Manage meeting requests from investors
            </p>
          </div>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <Badge variant="warning" size="lg">
                {pendingCount} Awaiting Response
              </Badge>
            )}
            <Badge variant="success">{acceptedCount} Upcoming</Badge>
          </div>
        </motion.div>

        {/* Pending Alert */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-l-4 border-l-amber-500 bg-amber-50">
              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-amber-600" />
                <div className="flex-1">
                  <p className="font-semibold text-navy-900">
                    You have {pendingCount} meeting request{pendingCount > 1 ? 's' : ''} awaiting response
                  </p>
                  <p className="text-sm text-gray-600">Respond promptly to maintain investor interest</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by investor or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </motion.div>

        {/* Meetings List */}
        <div className="space-y-4">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting, index) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card hover className={meeting.status === 'pending' ? 'border-amber-200' : ''}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Investor Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                        {meeting.investor?.first_name?.[0]}{meeting.investor?.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-navy-900">
                            {meeting.investor?.first_name} {meeting.investor?.last_name}
                          </h3>
                          <Badge
                            variant={getStatusBadge(meeting.status).variant}
                            size="sm"
                          >
                            {getStatusBadge(meeting.status).label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Re: {meeting.project?.title}
                        </p>
                        {meeting.investor?.company_name && (
                          <p className="text-xs text-gray-400">{meeting.investor.company_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Meeting Details */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                      {meeting.scheduled_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(meeting.scheduled_at)}</span>
                        </div>
                      )}
                      {meeting.meeting_link && meeting.status === 'accepted' && (
                        <a
                          href={meeting.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {meeting.status === 'pending' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAccept(meeting.id)}
                            isLoading={respondingTo === meeting.id}
                            leftIcon={<CheckCircle className="w-4 h-4" />}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDecline(meeting.id)}
                            disabled={respondingTo === meeting.id}
                            className="text-red-600 hover:bg-red-50"
                            leftIcon={<XCircle className="w-4 h-4" />}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      <Link to={`/developer/meetings/${meeting.id}`}>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Message Preview */}
                  {meeting.message && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Message:</span> {meeting.message}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-navy-900 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No meetings found'
                      : 'No meeting requests yet'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Meeting requests from investors will appear here'}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperMeetingsPage;
