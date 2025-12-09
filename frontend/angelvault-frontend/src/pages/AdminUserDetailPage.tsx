import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Building2, Calendar, Shield,
  Edit, Save, Loader2, CheckCircle, XCircle, Clock,
  Eye, FileSignature, DollarSign, AlertCircle, Ban
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import type { User as UserType, Project, SAFENote, AuditLog } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [safeNotes, setSafeNotes] = useState<SAFENote[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'investor' | 'developer' | 'admin'>('investor');
  const [status, setStatus] = useState<'active' | 'suspended' | 'pending'>('active');

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_user_detail', user_id: id });
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await api.adminGetUser(id!);
      setUser(userData);
      setFirstName(userData.first_name);
      setLastName(userData.last_name);
      setCompanyName(userData.company_name || '');
      setRole(userData.role);
      setStatus(userData.status || 'active');

      // Load related data
      if (userData.role === 'developer') {
        const projectsData = await api.adminListProjects({ developer_id: id });
        setProjects(projectsData.data || []);
      }
      
      const activityData = await api.adminGetUserActivity(id!);
      setActivity(activityData.activity || []);
    } catch (error) {
      console.error('Failed to load user:', error);
      toast.error('Failed to load user');
      navigate('/admin/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.adminUpdateUser(id!, {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName || undefined,
        role,
        status,
      });
      toast.success('User updated successfully');
      setIsEditing(false);
      loadUser();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      await api.adminUpdateUser(id!, { status: 'suspended' });
      toast.success('User suspended');
      loadUser();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleActivate = async () => {
    try {
      await api.adminUpdateUser(id!, { status: 'active' });
      toast.success('User activated');
      loadUser();
    } catch (error) {
      toast.error('Failed to activate user');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'developer': return 'primary';
      case 'investor': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'error';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">User Not Found</h2>
          <Button onClick={() => navigate('/admin/users')}>Back to Users</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                {user.profile_image_url ? (
                  <img src={user.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-navy-900">
                  {user.first_name} {user.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(user.status || 'active')}>
                    {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                  {user.status === 'active' ? (
                    <Button
                      variant="outline"
                      onClick={handleSuspend}
                      className="text-red-600 hover:border-red-300"
                      leftIcon={<Ban className="w-4 h-4" />}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button onClick={handleActivate} leftIcon={<CheckCircle className="w-4 h-4" />}>
                      Activate
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>User Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="investor">Investor</option>
                            <option value="developer">Developer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-navy-900">{user.email}</span>
                      </div>
                      {user.company_name && (
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <span className="text-navy-900">{user.company_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-navy-900">
                          Joined {format(new Date(user.created_at), 'MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <span className="text-navy-900">
                          {user.email_verified ? 'Email verified' : 'Email not verified'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Projects (for developers) */}
            {user.role === 'developer' && projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Projects ({projects.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projects.map((project) => (
                        <Link
                          key={project.id}
                          to={`/admin/projects/${project.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              {project.logo_url ? (
                                <img src={project.logo_url} alt="" className="w-8 h-8 object-contain rounded" />
                              ) : (
                                <Building2 className="w-5 h-5 text-primary-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-navy-900">{project.title}</p>
                              <p className="text-sm text-gray-500">{project.status}</p>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Activity Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activity.slice(0, 10).map((log, index) => (
                      <div key={log.id || index} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-navy-900">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.role === 'investor' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Views Remaining</span>
                        <span className="font-semibold text-navy-900">{user.views_remaining || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Views Used</span>
                        <span className="font-semibold text-navy-900">{user.views_used || 0}</span>
                      </div>
                    </>
                  )}
                  {user.role === 'developer' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Projects</span>
                        <span className="font-semibold text-navy-900">{projects.length}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Last Active</span>
                    <span className="font-semibold text-navy-900">
                      {user.last_login_at ? format(new Date(user.last_login_at), 'MMM d') : 'Never'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:border-red-300"
                    onClick={() => toast.error('Password reset email sent (demo)')}
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:border-red-300"
                    onClick={() => toast.error('Account deletion not available in demo')}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailPage;
