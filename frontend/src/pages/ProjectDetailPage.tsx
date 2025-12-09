import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, Unlock, Calendar, DollarSign, Users, Globe, MapPin, Clock,
  ChevronRight, FileSignature, CheckCircle, AlertCircle, Loader2,
  ArrowLeft, ExternalLink, Building2, Target, TrendingUp, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent, trackEvents } from '../utils/analytics';
import type { Project } from '../types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasSignedNDA, setHasSignedNDA] = useState(false);
  const [viewsRemaining, setViewsRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    if (id) {
      trackEvent('page_view', { page: 'project_detail', project_id: id });
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const projectRes = await api.getProject(id!);
      setProject(projectRes);
      
      if (user?.role === 'investor') {
        try {
          const accessRes = await api.checkProjectAccess(id!);
          setIsUnlocked(accessRes.has_access);
        } catch {
          // If access check fails, assume not unlocked
          setIsUnlocked(false);
        }
        
        const dashboardRes = await api.getInvestorDashboard();
        setViewsRemaining(dashboardRes.views_remaining);
        const ndaRes = await api.getMasterNDAStatus();
        setHasSignedNDA(ndaRes.has_signed || ndaRes.has_signed_master_nda || false);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!hasSignedNDA) {
      navigate('/investor/nda', { state: { returnTo: `/projects/${id}` } });
      return;
    }
    
    if (viewsRemaining <= 0) {
      navigate('/investor/purchase', { state: { returnTo: `/projects/${id}` } });
      return;
    }

    setIsUnlocking(true);
    try {
      await api.unlockProject(id!);
      trackEvents.unlockProject(id!, project?.title || '');
      setIsUnlocked(true);
      setViewsRemaining(prev => prev - 1);
      loadProject(); // Reload to get full details
    } catch (error) {
      console.error('Failed to unlock project:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRequestMeeting = async () => {
    trackEvents.requestMeeting(id!);
    navigate(`/investor/meetings/request/${id}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">This project may have been removed or doesn't exist.</p>
          <Link to="/projects">
            <Button>Browse Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stageBadgeVariant: Record<string, 'primary' | 'secondary' | 'warning' | 'success'> = {
    idea: 'secondary',
    pre_seed: 'warning',
    seed: 'primary',
    series_a: 'success',
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white">
        <div className="container-wide py-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Project Info */}
            <div className="flex-1">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                  {project.logo_url ? (
                    <img src={project.logo_url} alt="" className="w-14 h-14 object-contain" />
                  ) : (
                    <span className="text-3xl font-bold text-primary-400">
                      {project.title[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-display text-3xl font-bold">{project.title}</h1>
                    <Badge variant={stageBadgeVariant[project.funding_stage] || 'secondary'}>
                      {project.funding_stage.replace('_', ' ')}
                    </Badge>
                    {project.is_featured && (
                      <Badge variant="gold">Featured</Badge>
                    )}
                  </div>
                  <p className="text-xl text-gray-300 mb-4">{project.tagline}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    {project.category && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {project.category.name}
                      </span>
                    )}
                    {project.target_market && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {project.target_market}
                      </span>
                    )}
                    {project.website_url && (
                      <a
                        href={project.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary-400 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-400">
                  {formatCurrency(project.funding_goal)}
                </p>
                <p className="text-sm text-gray-400">Funding Goal</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(project.minimum_investment)}
                </p>
                <p className="text-sm text-gray-400">Min Investment</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{project.view_count}</p>
                <p className="text-sm text-gray-400">Views</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-wide py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unlock Notice */}
            {!isUnlocked && user?.role === 'investor' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-primary-200 bg-primary-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy-900 mb-1">
                        Unlock Full Project Details
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Use 1 view to access the full pitch deck, team details, financials, and request meetings.
                      </p>
                      <div className="flex items-center gap-4">
                        <Button onClick={handleUnlock} isLoading={isUnlocking}>
                          <Unlock className="w-4 h-4 mr-2" />
                          Unlock Project
                        </Button>
                        <span className="text-sm text-gray-500">
                          {viewsRemaining} views remaining
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {isUnlocked || !user || user.role !== 'investor' ? (
                    <div className="prose prose-navy max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {project.description || 'No description available.'}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <p className="text-gray-400 blur-sm select-none">
                        {project.tagline} This is a preview of the project description. 
                        The full pitch deck and detailed information including team backgrounds, 
                        financial projections, market analysis, and investment terms are available 
                        after unlocking. Get access to comprehensive due diligence materials...
                      </p>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Problem & Solution */}
            {isUnlocked && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>The Problem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{project.problem_statement || 'Not specified'}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>The Solution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{project.solution || 'Not specified'}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Team */}
                {project.team_members && project.team_members.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Team</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {project.team_members.map((member, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50"
                            >
                              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-navy-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.role}</p>
                                {member.linkedin_url && (
                                  <a
                                    href={member.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 hover:underline"
                                  >
                                    LinkedIn
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Traction */}
                {project.traction && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Traction & Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{project.traction}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Actions & Info */}
          <div className="space-y-6">
            {/* Action Card */}
            {user?.role === 'investor' && isUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-2 border-primary-200">
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Project Unlocked</span>
                    </div>
                    <Button fullWidth onClick={handleRequestMeeting}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Request Meeting
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Connect directly with the founders
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Investment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Investment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Funding Goal</span>
                    <span className="font-semibold text-navy-900">
                      {formatCurrency(project.funding_goal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Minimum Investment</span>
                    <span className="font-semibold text-navy-900">
                      {formatCurrency(project.minimum_investment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Stage</span>
                    <Badge variant={stageBadgeVariant[project.funding_stage] || 'secondary'}>
                      {project.funding_stage.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Listed</span>
                    <span className="text-navy-900">{formatDate(project.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* NDA Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-navy-900 text-white">
                <CardContent>
                  <div className="flex items-start gap-3">
                    <FileSignature className="w-5 h-5 text-primary-400 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">NDA Protected</p>
                      <p className="text-sm text-gray-300">
                        All project information is protected by NDA. Unauthorized sharing is prohibited.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Not Logged In */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-2 border-primary-200 bg-primary-50">
                  <CardContent className="text-center">
                    <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-navy-900 mb-2">
                      Sign Up to Invest
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Create an investor account to unlock projects and connect with founders.
                    </p>
                    <Link to="/signup?role=investor">
                      <Button fullWidth>Get Started</Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
