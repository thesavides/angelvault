import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Eye, Users, Calendar, TrendingUp, ArrowUpRight,
  ArrowDownRight, Loader2, Clock, DollarSign, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { Project, AuditLog } from '../types';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AnalyticsData {
  totalViews: number;
  viewsThisWeek: number;
  viewsChange: number;
  totalMeetings: number;
  meetingsThisWeek: number;
  ndaSignatures: number;
  projectPerformance: ProjectPerformance[];
  dailyViews: DailyView[];
  recentActivity: AuditLog[];
}

interface ProjectPerformance {
  project: Project;
  views: number;
  meetings: number;
  ndas: number;
}

interface DailyView {
  date: string;
  views: number;
}

export function DeveloperAnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    trackEvent('page_view', { page: 'developer_analytics' });
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const dashboard = await api.getDeveloperDashboard();
      
      // Calculate analytics from dashboard data
      const totalViews = dashboard.total_views || 0;
      const viewsThisWeek = Math.round(totalViews * 0.15); // Simulated
      const viewsChange = 12.5; // Simulated percentage change
      
      // Generate daily views data (simulated for demo)
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const dailyViews: DailyView[] = [];
      for (let i = days - 1; i >= 0; i--) {
        dailyViews.push({
          date: format(subDays(new Date(), i), 'MMM d'),
          views: Math.floor(Math.random() * 10) + 1,
        });
      }

      // Project performance
      const projectPerformance: ProjectPerformance[] = (dashboard.projects || []).map(project => ({
        project,
        views: project.view_count || 0,
        meetings: Math.floor(Math.random() * 5),
        ndas: Math.floor(Math.random() * 3),
      }));

      setAnalyticsData({
        totalViews,
        viewsThisWeek,
        viewsChange,
        totalMeetings: dashboard.total_meetings || 0,
        meetingsThisWeek: dashboard.pending_meetings || 0,
        ndaSignatures: dashboard.nda_signatures || 0,
        projectPerformance,
        dailyViews,
        recentActivity: dashboard.recent_activity || [],
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaxViews = () => {
    if (!analyticsData) return 10;
    return Math.max(...analyticsData.dailyViews.map(d => d.views), 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-navy-900">
                Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                Track your project performance and investor engagement
              </p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  (analyticsData?.viewsChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(analyticsData?.viewsChange || 0) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(analyticsData?.viewsChange || 0)}%
                </div>
              </div>
              <p className="text-3xl font-bold text-navy-900">{analyticsData?.totalViews || 0}</p>
              <p className="text-sm text-gray-500">Total Views</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-navy-900">{analyticsData?.ndaSignatures || 0}</p>
              <p className="text-sm text-gray-500">NDA Signatures</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-navy-900">{analyticsData?.totalMeetings || 0}</p>
              <p className="text-sm text-gray-500">Meetings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-navy-900">
                {analyticsData?.totalViews && analyticsData?.ndaSignatures
                  ? ((analyticsData.ndaSignatures / analyticsData.totalViews) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-gray-500">Conversion Rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Views Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Daily Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-1">
                  {analyticsData?.dailyViews.map((day, index) => {
                    const height = (day.views / getMaxViews()) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div
                          className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.date}: ${day.views} views`}
                        />
                        {index % (dateRange === '7d' ? 1 : dateRange === '30d' ? 5 : 15) === 0 && (
                          <span className="text-xs text-gray-400 transform -rotate-45">
                            {day.date}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {activity.action === 'project_viewed' && <Eye className="w-4 h-4 text-blue-500" />}
                        {activity.action === 'nda_signed' && <FileText className="w-4 h-4 text-green-500" />}
                        {activity.action === 'meeting_requested' && <Calendar className="w-4 h-4 text-purple-500" />}
                        {!['project_viewed', 'nda_signed', 'meeting_requested'].includes(activity.action) && (
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy-900 truncate">
                          {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!analyticsData?.recentActivity || analyticsData.recentActivity.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Project Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Project Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Project</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Views</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">NDAs</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Meetings</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.projectPerformance.map((item) => (
                      <tr key={item.project.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              {item.project.logo_url ? (
                                <img src={item.project.logo_url} alt="" className="w-8 h-8 object-contain rounded" />
                              ) : (
                                <span className="text-sm font-bold text-primary-600">
                                  {item.project.title.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-navy-900">{item.project.title}</p>
                              <p className="text-sm text-gray-500">{item.project.category?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium text-navy-900">{item.views}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium text-navy-900">{item.ndas}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium text-navy-900">{item.meetings}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge
                            variant={
                              item.project.status === 'live' ? 'success' :
                              item.project.status === 'approved' ? 'primary' :
                              item.project.status === 'under_review' ? 'warning' :
                              'secondary'
                            }
                          >
                            {item.project.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!analyticsData?.projectPerformance || analyticsData.projectPerformance.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          No projects to display
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default DeveloperAnalyticsPage;
