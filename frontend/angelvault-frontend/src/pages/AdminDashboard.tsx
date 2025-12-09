import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Rocket, DollarSign, TrendingUp, CheckCircle, Clock, XCircle,
  ChevronRight, Eye, AlertTriangle, Loader2, BarChart3, Shield, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { Project, User, DashboardStats, AuditLog } from '../types';

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    trackEvent('page_view', { page: 'admin_dashboard' });
    loadDashboard();
  }, [user, navigate]);

  const loadDashboard = async () => {
    try {
      const [statsRes, pendingRes, activityRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getPendingProjects(),
        api.getRecentActivity(),
        api.listUsers({ per_page: 5 }),
      ]);
      setStats(statsRes);
      setPendingProjects(pendingRes.projects);
      setRecentActivity(activityRes.activity);
      setRecentUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (projectId: string) => {
    try {
      await api.approveProject(projectId);
      trackEvent('admin_action', { action: 'approve_project', project_id: projectId });
      loadDashboard();
    } catch (error) {
      console.error('Failed to approve project:', error);
    }
  };

  const handleReject = async (projectId: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (reason) {
      try {
        await api.rejectProject(projectId, reason);
        trackEvent('admin_action', { action: 'reject_project', project_id: projectId });
        loadDashboard();
      } catch (error) {
        console.error('Failed to reject project:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'blue', link: '/admin/users' },
    { label: 'Investors', value: stats?.total_investors || 0, icon: TrendingUp, color: 'green', link: '/admin/users?role=investor' },
    { label: 'Founders', value: stats?.total_developers || 0, icon: Rocket, color: 'purple', link: '/admin/users?role=developer' },
    { label: 'Live Projects', value: stats?.live_projects || 0, icon: CheckCircle, color: 'primary', link: '/admin/projects?status=live' },
    { label: 'Pending Review', value: stats?.pending_projects || 0, icon: Clock, color: 'amber', link: '/admin/projects?status=submitted' },
    { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue || 0), icon: DollarSign, color: 'green', link: '/admin/payments' },
    { label: 'Monthly Revenue', value: formatCurrency(stats?.monthly_revenue || 0), icon: BarChart3, color: 'blue', link: '/admin/payments' },
    { label: 'Total Projects', value: stats?.total_projects || 0, icon: Rocket, color: 'gray', link: '/admin/projects' },
  ];

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
            <h1 className="font-display text-3xl font-bold text-navy-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage users, projects, and platform activity</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="gold" size="lg">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </Badge>
          </div>
        </motion.div>

        {/* Alert for Pending Projects */}
        {pendingProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-l-4 border-l-amber-500 bg-amber-50">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-navy-900">
                    {pendingProjects.length} Project{pendingProjects.length > 1 ? 's' : ''} Awaiting Review
                  </h3>
                  <p className="text-sm text-gray-600">Review and approve or reject submitted projects</p>
                </div>
                <Link to="/admin/projects?status=submitted">
                  <Button size="sm">Review Now</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Link to={stat.link}>
                <Card hover className="h-full">
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
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Pending Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Projects Pending Review</CardTitle>
                  <Link to="/admin/projects?status=submitted" className="text-sm text-primary-600 hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {pendingProjects.length > 0 ? (
                  <div className="space-y-4">
                    {pendingProjects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100"
                      >
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                          {project.logo_url ? (
                            <img src={project.logo_url} alt="" className="w-8 h-8 object-contain" />
                          ) : (
                            <Rocket className="w-6 h-6 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-navy-900 truncate">{project.title}</h4>
                          <p className="text-sm text-gray-500">
                            by {project.developer?.first_name} {project.developer?.last_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Submitted {formatDate(project.submitted_at || project.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/admin/projects/${project.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleApprove(project.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(project.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-navy-900 mb-2">All caught up!</h3>
                    <p className="text-gray-500">No projects pending review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity & Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Manage Users</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/admin/projects"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Rocket className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">All Projects</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/admin/payments"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Payments</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/admin/categories"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Categories</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/admin/audit"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Audit Logs</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Users</CardTitle>
                  <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.map((u) => (
                    <Link
                      key={u.id}
                      to={`/admin/users/${u.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-medium">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy-900 text-sm truncate">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <Badge variant={u.role === 'investor' ? 'gold' : 'primary'} size="sm">
                        {u.role}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Link to="/admin/audit" className="text-sm text-primary-600 hover:underline">
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-400 mt-2" />
                      <div>
                        <p className="text-navy-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
