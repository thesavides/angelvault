import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, Video, MapPin, MessageSquare,
  Send, Loader2, User, Building2, CheckCircle, XCircle,
  ExternalLink, AlertCircle, Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { MeetingRequest, Message } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  declined: { label: 'Declined', variant: 'error' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  no_show: { label: 'No Show', variant: 'error' },
};

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<MeetingRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isInvestor = user?.role === 'investor';
  const isDeveloper = user?.role === 'developer';

  useEffect(() => {
    trackEvent('page_view', { page: 'meeting_detail', meeting_id: id });
    loadMeeting();
  }, [id]);

  useEffect(() => {
    if (meeting) {
      loadMessages();
    }
  }, [meeting?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMeeting = async () => {
    try {
      const endpoint = isInvestor ? api.getInvestorMeeting : api.getDeveloperMeeting;
      const res = await endpoint(id!);
      setMeeting(res);
    } catch (error) {
      console.error('Failed to load meeting:', error);
      toast.error('Failed to load meeting');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.getMeetingMessages(id!);
      setMessages(res.messages || []);
      await api.markMessagesAsRead(id!);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = await api.sendMeetingMessage(id!, newMessage.trim());
      setMessages([...messages, message]);
      setNewMessage('');
      trackEvent('message_sent', { meeting_id: id });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async () => {
    if (!meeting) return;
    const scheduledTime = window.prompt('Enter scheduled time (YYYY-MM-DD HH:MM):');
    if (!scheduledTime) return;
    
    try {
      const scheduledAt = new Date(scheduledTime).toISOString();
      await api.acceptMeetingRequest(meeting.id, scheduledAt);
      toast.success('Meeting accepted');
      loadMeeting();
    } catch (error) {
      toast.error('Failed to accept meeting');
    }
  };

  const handleDecline = async () => {
    if (!meeting) return;
    const reason = window.prompt('Please provide a reason for declining:');
    if (reason === null) return;

    try {
      await api.declineMeetingRequest(meeting.id, reason);
      toast.success('Meeting declined');
      loadMeeting();
    } catch (error) {
      toast.error('Failed to decline meeting');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Meeting Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[meeting.status] || statusConfig.pending;
  const otherParty = isInvestor ? meeting.developer : meeting.investor;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Meetings
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meeting Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-navy-900">
                          {otherParty?.first_name} {otherParty?.last_name}
                        </h2>
                        <p className="text-gray-500">
                          {isInvestor ? 'Founder' : 'Investor'} • {meeting.project?.title}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>

                  {meeting.scheduled_at && (
                    <div className="bg-primary-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-6 h-6 text-primary-600" />
                        <div>
                          <p className="font-semibold text-navy-900">
                            {format(new Date(meeting.scheduled_at), 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(meeting.scheduled_at), 'h:mm a')} • {meeting.duration_minutes || 30} minutes
                          </p>
                        </div>
                      </div>
                      {meeting.meeting_link && (
                        <a
                          href={meeting.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {meeting.message && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Initial Message</h4>
                      <p className="text-navy-900 bg-gray-50 rounded-lg p-3">{meeting.message}</p>
                    </div>
                  )}

                  {isDeveloper && meeting.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button onClick={handleAccept} className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button variant="outline" onClick={handleDecline} className="flex-1">
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 overflow-y-auto mb-4 space-y-4 pr-2">
                    {messages.length > 0 ? (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                isMe
                                  ? 'bg-primary-600 text-white rounded-br-sm'
                                  : 'bg-gray-100 text-navy-900 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                                {format(new Date(msg.created_at), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button type="submit" isLoading={isSending} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      {meeting.project?.logo_url ? (
                        <img src={meeting.project.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg" />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-900">{meeting.project?.title}</h4>
                      <p className="text-sm text-gray-500">{meeting.project?.tagline}</p>
                    </div>
                  </div>
                  <Link to={`/projects/${meeting.project_id}`} className="mt-4 block">
                    <Button variant="outline" className="w-full" size="sm">
                      View Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-2">
                    {isInvestor ? 'Founder' : 'Investor'}
                  </p>
                  <p className="font-medium text-navy-900">
                    {otherParty?.first_name} {otherParty?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{otherParty?.email}</p>
                  {otherParty?.company_name && (
                    <p className="text-sm text-gray-500 mt-1">{otherParty.company_name}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingDetailPage;
