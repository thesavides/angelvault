import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Clock, MessageSquare, Building2,
  Loader2, Send, AlertCircle, Video, Phone, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import type { Project } from '../types';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';

export function MeetingRequestPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [message, setMessage] = useState('');
  const [meetingType, setMeetingType] = useState<'video' | 'phone' | 'in_person'>('video');
  const [duration, setDuration] = useState(30);
  const [proposedTimes, setProposedTimes] = useState<string[]>(['', '', '']);

  useEffect(() => {
    trackEvent('page_view', { page: 'meeting_request', project_id: projectId });
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const proj = await api.getProject(projectId!);
      setProject(proj);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...proposedTimes];
    newTimes[index] = value;
    setProposedTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please add a message to introduce yourself');
      return;
    }

    const validTimes = proposedTimes.filter(t => t);
    if (validTimes.length === 0) {
      toast.error('Please propose at least one meeting time');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.requestMeeting(projectId!, {
        message: message.trim(),
        meeting_type: meetingType,
        duration_minutes: duration,
        proposed_times: validTimes,
      });

      toast.success('Meeting request sent!');
      trackEvent('meeting_requested', { project_id: projectId, meeting_type: meetingType });
      navigate('/investor/meetings');
    } catch (error: any) {
      console.error('Failed to request meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to send meeting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate default time slots (next 7 days, 10am-4pm)
  const getDefaultTimeSlot = (daysFromNow: number, hour: number) => {
    const date = addDays(new Date(), daysFromNow);
    date.setHours(hour, 0, 0, 0);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/projects')}>Browse Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-display font-bold text-navy-900">
            Request a Meeting
          </h1>
          <p className="text-gray-600 mt-1">
            Connect with the founder of {project.title}
          </p>
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  {project.logo_url ? (
                    <img src={project.logo_url} alt={project.title} className="w-12 h-12 object-contain rounded-lg" />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-navy-900">{project.title}</h3>
                  <p className="text-sm text-gray-500">{project.tagline}</p>
                  {project.developer && (
                    <p className="text-sm text-gray-500 mt-1">
                      Founded by {project.developer.first_name} {project.developer.last_name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Meeting Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Introduction Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself and explain what you'd like to discuss..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Help the founder understand your background and interest in their project
                  </p>
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Meeting Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'video', label: 'Video Call', icon: Video },
                      { value: 'phone', label: 'Phone Call', icon: Phone },
                      { value: 'in_person', label: 'In Person', icon: Users },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setMeetingType(type.value as typeof meetingType)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          meetingType === type.value
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <type.icon className={`w-5 h-5 mx-auto mb-2 ${
                          meetingType === type.value ? 'text-primary-600' : 'text-gray-500'
                        }`} />
                        <p className={`text-sm font-medium ${
                          meetingType === type.value ? 'text-primary-600' : 'text-gray-700'
                        }`}>
                          {type.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Duration
                  </label>
                  <div className="flex gap-3">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDuration(mins)}
                        className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                          duration === mins
                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proposed Times */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Proposed Times *
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    Suggest up to 3 times that work for you (the founder will confirm one)
                  </p>
                  <div className="space-y-3">
                    {proposedTimes.map((time, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-16">Option {index + 1}</span>
                        <Input
                          type="datetime-local"
                          value={time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                    size="lg"
                    leftIcon={<Send className="w-4 h-4" />}
                  >
                    Send Meeting Request
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-3">
                    The founder will be notified and can accept or propose alternative times
                  </p>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default MeetingRequestPage;
