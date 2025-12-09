import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, User, Calendar, Eye, Edit, Save,
  Loader2, CheckCircle, XCircle, Clock, DollarSign, Globe,
  FileText, AlertCircle, Image, ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import type { Project, SAFENote, NDA, AuditLog } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'primary' },
  live: { label: 'Live', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  archived: { label: 'Archived', variant: 'secondary' },
};

export function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [safeNotes, setSafeNotes] = useState<SAFENote[]>([]);
  const [ndas, setNdas] = useState<NDA[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [status, setStatus] = useState<string>('draft');
  const [featured, setFeatured] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_project_detail', project_id: id });
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const projectData = await api.adminGetProject(id!);
      setProject(projectData);
      setStatus(projectData.status);
      setFeatured(projectData.featured || false);
      setAdminNotes(projectData.admin_notes || '');

      // Load related data
      const [safeNotesData, ndasData, activityData] = await Promise.all([
        api.adminListSAFENotes({ project_id: id }),
        api.adminListNDAs({ project_id: id }),
        api.adminGetProjectActivity(id!),
      ]);

      setSafeNotes(safeNotesData.safe_notes || []);
      setNdas(ndasData.ndas || []);
      setActivity(activityData.activity || []);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
      navigate('/admin/projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.adminUpdateProject(id!, {
        status,
        featured,
        admin_notes: adminNotes,
      });
      toast.success('Project updated successfully');
      setIsEditing(false);
      loadProject();
    } catch (error: any) {
      console.error('Failed to update project:', error);
      toast.error(error.response?.data?.error || 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.adminUpdateProject(id!, { status: 'approved' });
      toast.success('Project approved');
      loadProject();
    } catch (error) {
      toast.error('Failed to approve project');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason === null) return;

    try {
      await api.adminUpdateProject(id!, { status: 'rejected', rejection_reason: reason });
      toast.success('Project rejected');
      loadProject();
    } catch (error) {
      toast.error('Failed to reject project');
    }
  };

  const handlePublish = async () => {
    try {
      await api.adminUpdateProject(id!, { status: 'live' });
      toast.success('Project is now live');
      loadProject();
    } catch (error) {
      toast.error('Failed to publish project');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusInfo = (projectStatus: string) => {
    return statusConfig[projectStatus] || { label: projectStatus, variant: 'secondary' as const };
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
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/admin/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(project.status);
  const totalRaised = safeNotes
    .filter(n => n.status === 'executed')
    .reduce((sum, n) => sum + n.investment_amount, 0);

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
            onClick={() => navigate('/admin/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                {project.logo_url ? (
                  <img src={project.logo_url} alt="" className="w-12 h-12 object-contain rounded-lg" />
                ) : (
                  <Building2 className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-navy-900">
                  {project.title}
                </h1>
                <p className="text-gray-500">{project.tagline}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  {project.featured && <Badge variant="warning">Featured</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {project.status === 'under_review' && (
                <>
                  <Button onClick={handleApprove} leftIcon={<CheckCircle className="w-4 h-4" />}>
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    className="text-red-600"
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                </>
              )}
              {project.status === 'approved' && (
                <Button onClick={handlePublish} leftIcon={<Globe className="w-4 h-4" />}>
                  Publish
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.open(`/projects/${project.id}`, '_blank')}
                leftIcon={<ExternalLink className="w-4 h-4" />}
              >
                View
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Project Details</CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} isLoading={isSaving}>
                        <Save className="w-4 h-4 mr-1" /> Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="live">Live</option>
                          <option value="rejected">Rejected</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={featured}
                          onChange={(e) => setFeatured(e.target.checked)}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                          Featured Project
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Internal notes about this project..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                        <p className="text-navy-900">{project.description || 'No description'}</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                          <p className="text-navy-900">{project.category?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Stage</h4>
                          <p className="text-navy-900">{project.stage || 'N/A'}</p>
                        </div>
                      </div>
                      {project.website_url && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Website</h4>
                          <a
                            href={project.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {project.website_url}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Investment Terms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Investment Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {project.valuation_cap && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Valuation Cap</p>
                        <p className="text-xl font-bold text-navy-900">{formatCurrency(project.valuation_cap)}</p>
                      </div>
                    )}
                    {project.minimum_investment && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Min Investment</p>
                        <p className="text-xl font-bold text-navy-900">{formatCurrency(project.minimum_investment)}</p>
                      </div>
                    )}
                    {project.target_raise && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-500">Target Raise</p>
                        <p className="text-xl font-bold text-navy-900">{formatCurrency(project.target_raise)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* SAFE Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>SAFE Notes ({safeNotes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {safeNotes.length > 0 ? (
                    <div className="space-y-3">
                      {safeNotes.map((note) => (
                        <div key={note.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-navy-900">
                                {note.investor?.first_name} {note.investor?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{formatCurrency(note.investment_amount)}</p>
                            </div>
                          </div>
                          <Badge variant={getStatusInfo(note.status).variant}>
                            {getStatusInfo(note.status).label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No SAFE notes yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Founder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Founder</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    to={`/admin/users/${project.developer_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-navy-900">
                        {project.developer?.first_name} {project.developer?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{project.developer?.email}</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Views</span>
                    <span className="font-semibold text-navy-900">{project.view_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">NDAs Signed</span>
                    <span className="font-semibold text-navy-900">{ndas.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">SAFE Notes</span>
                    <span className="font-semibold text-navy-900">{safeNotes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Total Raised</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalRaised)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="font-semibold text-navy-900">
                      {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activity.slice(0, 5).map((log, index) => (
                      <div key={log.id || index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm text-navy-900">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(log.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && (
                      <p className="text-center text-gray-500 py-2 text-sm">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProjectDetailPage;
