import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, Eye, Users, Calendar, ChevronRight, Plus, Edit, Send,
  CheckCircle, Clock, AlertCircle, Loader2, BarChart3, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { Project, MeetingRequest } from '../types';

export function DeveloperDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trackEvent('page_view', { page: 'developer_dashboard' });
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [projectsRes, meetingsRes] = await Promise.all([
        api.getDeveloperProjects().catch(() => []),
        api.getDeveloperMeetings().catch(() => ({ meetings: [] })),
      ]);
      setProjects(projectsRes || []);
      setMeetings(meetingsRes?.meetings || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
      draft: { label: 'Draft', variant: 'secondary' },
      submitted: { label: 'Under Review', variant: 'warning' },
      under_review: { label: 'Under Review', variant: 'warning' },
      approved: { label: 'Approved', variant: 'success' },
      live: { label: 'Live', variant: 'success' },
      rejected: { label: 'Rejected', variant: 'error' },
      funded: { label: 'Funded', variant: 'primary' },
    };
    return statusConfig[status] || { label: status, variant: 'secondary' };
  };

  const totalViews = projects.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const liveProjects = projects.filter(p => p.status === 'live').length;
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length;

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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-900">
              Welcome back, {user?.first_name}
            </h1>
            <p className="text-gray-600 mt-1">Manage your startup listings and investor connections</p>
          </div>
          <Link to="/developer/projects/new">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              New Project
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Projects', value: projects.length, icon: Rocket, color: 'primary' },
            { label: 'Live Projects', value: liveProjects, icon: CheckCircle, color: 'green' },
            { label: 'Total Views', value: totalViews, icon: Eye, color: 'blue' },
            { label: 'Pending Meetings', value: pendingMeetings, icon: Calendar, color: 'amber' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Projects & Meetings */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Projects</CardTitle>
                  <Link to="/developer/projects" className="text-sm text-primary-600 hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                          {project.logo_url ? (
                            <img src={project.logo_url} alt="" className="w-8 h-8 object-contain" />
                          ) : (
                            <Rocket className="w-6 h-6 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-navy-900 truncate">{project.title}</h4>
                            <Badge variant={getStatusBadge(project.status).variant} size="sm">
                              {getStatusBadge(project.status).label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{project.tagline}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Eye className="w-4 h-4" />
                          <span>{project.view_count}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/developer/projects/${project.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {project.status === 'draft' && (
                            <Button variant="secondary" size="sm" leftIcon={<Send className="w-4 h-4" />}>
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-navy-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-4">Create your first project to start attracting investors</p>
                    <Link to="/developer/projects/new">
                      <Button>Create Project</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Meetings & Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Pending Meetings */}
            <Card>
              <CardHeader>
                <CardTitle>Meeting Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {meetings.filter(m => m.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {meetings.filter(m => m.status === 'pending').slice(0, 3).map((meeting) => (
                      <Link
                        key={meeting.id}
                        to={`/developer/meetings/${meeting.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-navy-900 truncate">
                            {meeting.investor?.first_name} {meeting.investor?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">Pending response</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}
                    <Link to="/developer/meetings" className="block text-center text-sm text-primary-600 hover:underline pt-2">
                      View all meetings
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No pending meetings</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  to="/developer/projects/new"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">New Project</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/developer/analytics"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Analytics</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/developer/messages"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Messages</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default DeveloperDashboard;
