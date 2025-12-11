import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, Loader2, Eye, Edit, MoreVertical, Trash2
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { Project } from '../types';

export function AdminProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const perPage = 20;

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_projects' });
    loadProjects();
  }, [page, statusFilter]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await api.listAllProjects({
        page,
        per_page: perPage,
        status: statusFilter || undefined,
      });
      setProjects(response.data || []);
      setTotalProjects(response.total || 0);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
      setTotalProjects(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (projectId: string) => {
    try {
      await api.approveProject(projectId);
      trackEvent('admin_action', { action: 'approve_project', project_id: projectId });
      loadProjects();
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
        loadProjects();
      } catch (error) {
        console.error('Failed to reject project:', error);
      }
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      try {
        await api.deleteProject(projectId);
        trackEvent('admin_action', { action: 'delete_project', project_id: projectId });
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
      draft: { label: 'Draft', variant: 'secondary' },
      submitted: { label: 'Pending Review', variant: 'warning' },
      under_review: { label: 'Under Review', variant: 'warning' },
      approved: { label: 'Approved', variant: 'success' },
      live: { label: 'Live', variant: 'success' },
      rejected: { label: 'Rejected', variant: 'error' },
      funded: { label: 'Funded', variant: 'primary' },
      archived: { label: 'Archived', variant: 'secondary' },
    };
    return statusConfig[status] || { label: status, variant: 'secondary' };
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
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(totalProjects / perPage);
  const statuses = ['', 'draft', 'submitted', 'live', 'rejected', 'funded'];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-wide py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/admin" className="text-sm text-primary-600 hover:underline mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-navy-900">Project Management</h1>
          <p className="text-gray-600 mt-1">{totalProjects} total projects</p>
        </motion.div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                      setSearchParams({ status, page: '1' });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === '' ? 'All' : getStatusBadge(status).label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20">
                <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-navy-900 mb-2">No projects found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-navy-900">Project</th>
                      <th className="text-left py-4 px-6 font-semibold text-navy-900">Founder</th>
                      <th className="text-left py-4 px-6 font-semibold text-navy-900">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-navy-900">Funding Goal</th>
                      <th className="text-left py-4 px-6 font-semibold text-navy-900">Views</th>
                      <th className="text-left py-4 px-6 font-semibold text-navy-900">Created</th>
                      <th className="text-right py-4 px-6 font-semibold text-navy-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                              {project.logo_url ? (
                                <img src={project.logo_url} alt="" className="w-6 h-6 object-contain" />
                              ) : (
                                <Rocket className="w-5 h-5 text-primary-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-navy-900">{project.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{project.tagline}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-navy-900">
                            {project.developer?.first_name} {project.developer?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{project.developer?.email}</p>
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={getStatusBadge(project.status).variant}>
                            {getStatusBadge(project.status).label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-navy-900">
                          {formatCurrency(project.funding_goal)}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {project.view_count}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {formatDate(project.created_at)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/admin/projects/${project.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {project.status === 'submitted' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(project.id)}
                                  className="text-green-600 hover:bg-green-50"
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
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(project.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalProjects)} of {totalProjects}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminProjectsPage;
