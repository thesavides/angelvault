import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown, MapPin, DollarSign, TrendingUp, Lock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Project, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

const fundingStages = [
  { value: '', label: 'All Stages' },
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
];

export function ProjectsPage() {
  const { isAuthenticated, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, categoriesRes] = await Promise.all([
        api.listProjects({
          category: selectedCategory || undefined,
          stage: selectedStage || undefined,
        }).catch(() => ({ data: [], total: 0 })),
        api.getCategories().catch(() => []),
      ]);
      setProjects(projectsRes.data || []);
      setCategories(categoriesRes || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageBadge = (stage: string) => {
    const stages: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' }> = {
      pre_seed: { label: 'Pre-Seed', variant: 'primary' },
      seed: { label: 'Seed', variant: 'warning' },
      series_a: { label: 'Series A', variant: 'success' },
    };
    return stages[stage] || { label: stage, variant: 'primary' };
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-dark py-16">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
              Browse Investment Opportunities
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Vetted startups seeking angel investment. Every listing has been reviewed for completeness and quality.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, industry, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-wide py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm mb-4"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Filter className="w-5 h-5" />
                  Filters
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-6`}>
                {/* Category Filter */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-navy-900 mb-4">Category</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === '' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === category.slug ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                        {category.project_count && (
                          <span className="text-sm text-gray-500 ml-2">({category.project_count})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stage Filter */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-navy-900 mb-4">Funding Stage</h3>
                  <div className="space-y-2">
                    {fundingStages.map((stage) => (
                      <button
                        key={stage.value}
                        onClick={() => setSelectedStage(stage.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedStage === stage.value ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Investor CTA */}
                {!isAuthenticated && (
                  <div className="bg-gradient-primary rounded-xl p-6 text-white">
                    <h3 className="font-semibold mb-2">Become an Investor</h3>
                    <p className="text-sm text-white/80 mb-4">
                      Sign up to unlock full project details and connect with founders.
                    </p>
                    <Link to="/signup?type=investor">
                      <Button variant="accent" size="sm" fullWidth>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="flex-1">
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
              </p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-6 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-semibold text-xl text-navy-900 mb-2">No projects found</h3>
                <p className="text-gray-600">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/projects/${project.id}`}>
                      <Card hover className="h-full">
                        {/* Cover Image */}
                        <div className="relative h-40 -mx-6 -mt-6 mb-4 rounded-t-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50">
                          {project.cover_image_url ? (
                            <img
                              src={project.cover_image_url}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {project.logo_url ? (
                                <img
                                  src={project.logo_url}
                                  alt={project.title}
                                  className="w-20 h-20 object-contain"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-xl bg-white/50 flex items-center justify-center text-3xl font-bold text-primary-600">
                                  {project.title[0]}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Stage badge */}
                          <div className="absolute top-3 right-3">
                            <Badge variant={getStageBadge(project.funding_stage).variant}>
                              {getStageBadge(project.funding_stage).label}
                            </Badge>
                          </div>
                          {/* Featured badge */}
                          {project.is_featured && (
                            <div className="absolute top-3 left-3">
                              <Badge variant="gold">Featured</Badge>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-display font-semibold text-lg text-navy-900 group-hover:text-primary-600 transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                              {project.tagline}
                            </p>
                          </div>

                          {/* Category */}
                          {project.category && (
                            <p className="text-xs text-gray-500">{project.category.name}</p>
                          )}

                          {/* Metrics */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(project.funding_goal)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <TrendingUp className="w-4 h-4" />
                              <span>Min {formatCurrency(project.minimum_investment)}</span>
                            </div>
                          </div>

                          {/* Locked indicator for non-authenticated or non-paid */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Eye className="w-4 h-4" />
                              <span>{project.view_count} views</span>
                            </div>
                            {!isAuthenticated || user?.role !== 'investor' ? (
                              <div className="flex items-center gap-1 text-sm text-amber-600">
                                <Lock className="w-4 h-4" />
                                <span>Unlock to view</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;
