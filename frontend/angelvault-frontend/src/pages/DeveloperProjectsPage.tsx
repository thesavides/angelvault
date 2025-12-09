import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, Plus, Eye, Edit, Send, Trash2, CheckCircle, Clock,
  XCircle, Loader2, Search, Filter, MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { Project } from '../types';
import toast from 'react-hot-toast';

export function DeveloperProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    trackEvent('page_view', { page: 'developer_projects' });
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, statusFilter, searchQuery]);

  const loadProjects = async () => {
    try {
      const res = await api.getDeveloperProjects();
      setProjects(res);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.tagline?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProjects(filtered);
  };

  const handleSubmitProject = async (projectId: string) => {
    try {
      await api.submitProject(projectId);
      trackEvent('submit_project', { project_id: projectId });
      toast.success('Project submitted for review');
      loadProjects();
    } catch (error) {
      console.error('Failed to submit project:', error);
      toast.error('Failed to submit project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteProject(projectId);
      trackEvent('delete_project', { project_id: projectId });
      toast.success('Project deleted');
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary'; icon: any }> = {
      draft: { label: 'Draft', variant: 'secondary', icon: Edit },
      submitted: { label: 'Under Review', variant: 'warning', icon: Clock },
      under_review: { label: 'Under Review', variant: 'warning', icon: Clock },
      approved: { label: 'Approved', variant: 'success', icon: CheckCircle },
      live: { label: 'Live', variant: 'success', icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'error', icon: XCircle },
      funded: { label: 'Funded', variant: 'primary', icon: CheckCircle },
    };
    return config[status] || { label: status, variant: 'secondary', icon: Clock };
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
            <h1 className="font-display text-3xl font-bold text-navy-900">My Projects</h1>
            <p className="text-gray-600 mt-1">
              Manage your startup listings and track investor interest
            </p>
          </div>
          <Link to="/developer/projects/new">
            <Button leftIcon={<Plus className="w-5 h-5" />}>
              Create New Project
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
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
              <option value="draft">Draft</option>
              <option value="submitted">Under Review</option>
              <option value="live">Live</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </motion.div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => {
              const status = getStatusBadge(project.status);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card hover>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Project Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                          {project.logo_url ? (
                            <img src={project.logo_url} alt="" className="w-12 h-12 object-contain" />
                          ) : (
                            <Rocket className="w-8 h-8 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-navy-900 truncate">{project.title}</h3>
                            <Badge variant={status.variant} size="sm">
                              <status.icon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate">{project.tagline}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created {formatDate(project.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-navy-900">{project.view_count || 0}</p>
                          <p className="text-xs text-gray-500">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-navy-900">
                            {formatCurrency(project.funding_goal)}
                          </p>
                          <p className="text-xs text-gray-500">Goal</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {project.status === 'draft' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSubmitProject(project.id)}
                            leftIcon={<Send className="w-4 h-4" />}
                          >
                            Submit
                          </Button>
                        )}
                        {(project.status === 'live' || project.status === 'approved') && (
                          <Link to={`/projects/${project.id}`}>
                            <Button variant="secondary" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                              View Live
                            </Button>
                          </Link>
                        )}
                        <Link to={`/developer/projects/${project.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        {project.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {project.status === 'rejected' && project.rejection_reason && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-red-600">
                          <span className="font-medium">Rejection reason:</span> {project.rejection_reason}
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="text-center py-12">
                  <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-navy-900 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No projects found'
                      : 'No projects yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first project to start attracting investors'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Link to="/developer/projects/new">
                      <Button>Create Project</Button>
                    </Link>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperProjectsPage;
