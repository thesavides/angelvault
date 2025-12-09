import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Rocket, ArrowLeft, Save, Send, Image, Plus, Trash2, Loader2,
  Building2, Target, Users, DollarSign, Globe, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { trackEvent, trackEvents } from '../utils/analytics';
import type { Category } from '../types';
import toast from 'react-hot-toast';

interface TeamMember {
  name: string;
  role: string;
  linkedin: string;
  bio: string;
}

interface ProjectForm {
  title: string;
  tagline: string;
  description: string;
  problem: string;
  solution: string;
  traction: string;
  funding_goal: number;
  minimum_investment: number;
  funding_stage: string;
  category_id: string;
  location: string;
  website: string;
  pitch_deck_url: string;
  logo_url: string;
  cover_image_url: string;
  team_members: TeamMember[];
}

const initialForm: ProjectForm = {
  title: '',
  tagline: '',
  description: '',
  problem: '',
  solution: '',
  traction: '',
  funding_goal: 250000,
  minimum_investment: 10000,
  funding_stage: 'pre_seed',
  category_id: '',
  location: '',
  website: '',
  pitch_deck_url: '',
  logo_url: '',
  cover_image_url: '',
  team_members: [{ name: '', role: '', linkedin: '', bio: '' }],
};

const fundingStages = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
];

export function DeveloperProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<ProjectForm>(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = Boolean(id);

  useEffect(() => {
    trackEvent('page_view', { 
      page: isEditMode ? 'developer_project_edit' : 'developer_project_create',
      project_id: id 
    });
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const categoriesRes = await api.getCategories();
      setCategories(categoriesRes);

      if (isEditMode && id) {
        const projectRes = await api.getProject(id);
        setForm({
          title: projectRes.title || '',
          tagline: projectRes.tagline || '',
          description: projectRes.description || '',
          problem: projectRes.problem_statement || '',
          solution: projectRes.solution || '',
          traction: projectRes.traction || '',
          funding_goal: projectRes.funding_goal || 250000,
          minimum_investment: projectRes.minimum_investment || 10000,
          funding_stage: projectRes.funding_stage || 'pre_seed',
          category_id: projectRes.category_id || '',
          location: projectRes.target_market || '',
          website: projectRes.website_url || '',
          pitch_deck_url: projectRes.pitch_deck_url || '',
          logo_url: projectRes.logo_url || '',
          cover_image_url: projectRes.cover_image_url || '',
          team_members: projectRes.team_members?.length 
            ? projectRes.team_members.map(m => ({
                name: m.name,
                role: m.role,
                linkedin: m.linkedin_url || '',
                bio: m.bio || '',
              }))
            : [{ name: '', role: '', linkedin: '', bio: '' }],
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProjectForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newTeamMembers = [...form.team_members];
    newTeamMembers[index] = { ...newTeamMembers[index], [field]: value };
    setForm(prev => ({ ...prev, team_members: newTeamMembers }));
  };

  const addTeamMember = () => {
    setForm(prev => ({
      ...prev,
      team_members: [...prev.team_members, { name: '', role: '', linkedin: '', bio: '' }],
    }));
  };

  const removeTeamMember = (index: number) => {
    if (form.team_members.length === 1) return;
    setForm(prev => ({
      ...prev,
      team_members: prev.team_members.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.tagline.trim()) newErrors.tagline = 'Tagline is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.category_id) newErrors.category_id = 'Category is required';
    if (form.funding_goal < 10000) newErrors.funding_goal = 'Minimum funding goal is $10,000';
    if (form.minimum_investment < 1000) newErrors.minimum_investment = 'Minimum investment is $1,000';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (andSubmit = false) => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    if (andSubmit) {
      setIsSubmitting(true);
    } else {
      setIsSaving(true);
    }

    try {
      // Filter out empty team members and transform to API format
      const teamMembers = form.team_members
        .filter(m => m.name.trim())
        .map(m => ({
          name: m.name,
          role: m.role,
          linkedin_url: m.linkedin,
          bio: m.bio,
          is_founder: false,
        }));
      
      // Transform form data to API format
      const payload = {
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        problem_statement: form.problem,
        solution: form.solution,
        traction: form.traction,
        funding_goal: form.funding_goal,
        minimum_investment: form.minimum_investment,
        funding_stage: form.funding_stage as 'pre_seed' | 'seed' | 'series_a',
        category_id: form.category_id,
        target_market: form.location,
        website_url: form.website,
        pitch_deck_url: form.pitch_deck_url,
        logo_url: form.logo_url,
        cover_image_url: form.cover_image_url,
      };

      let projectId: string;
      if (isEditMode && id) {
        await api.updateProject(id, payload);
        projectId = id;
        // Add team members separately
        for (const member of teamMembers) {
          await api.addTeamMember(projectId, member);
        }
        toast.success('Project saved');
      } else {
        const res = await api.createProject(payload);
        projectId = res.id;
        // Add team members separately
        for (const member of teamMembers) {
          await api.addTeamMember(projectId, member);
        }
        trackEvent('project_created', { project_id: projectId });
        toast.success('Project created');
      }

      if (andSubmit) {
        await api.submitProject(projectId);
        trackEvent('project_submitted', { project_id: projectId });
        toast.success('Project submitted for review');
      }

      navigate('/developer/projects');
    } catch (error: any) {
      console.error('Failed to save project:', error);
      toast.error(error.response?.data?.error || 'Failed to save project');
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
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
      <div className="container-narrow py-8">
        <button
          onClick={() => navigate('/developer/projects')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-navy-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isEditMode 
              ? 'Update your project details to attract investors'
              : 'Fill in the details below to list your startup on AngelVault'}
          </p>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Project Title"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., TechPay"
                  error={errors.title}
                  required
                />
                <Input
                  label="Tagline"
                  value={form.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="One line description of what you do"
                  error={errors.tagline}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Detailed description of your startup..."
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.category_id}
                      onChange={(e) => handleChange('category_id', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white ${
                        errors.category_id ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
                    )}
                  </div>
                  <Input
                    label="Location"
                    value={form.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="e.g., Lagos, Nigeria"
                    leftIcon={<Building2 className="w-5 h-5" />}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Problem & Solution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  Problem & Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    The Problem
                  </label>
                  <textarea
                    value={form.problem}
                    onChange={(e) => handleChange('problem', e.target.value)}
                    placeholder="What problem are you solving?"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Your Solution
                  </label>
                  <textarea
                    value={form.solution}
                    onChange={(e) => handleChange('solution', e.target.value)}
                    placeholder="How does your product solve this problem?"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Traction & Metrics
                  </label>
                  <textarea
                    value={form.traction}
                    onChange={(e) => handleChange('traction', e.target.value)}
                    placeholder="Share your key metrics, revenue, users, growth rate..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Funding Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  Funding Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Funding Goal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={form.funding_goal}
                        onChange={(e) => handleChange('funding_goal', parseInt(e.target.value) || 0)}
                        min={10000}
                        step={10000}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.funding_goal ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {errors.funding_goal && (
                      <p className="mt-1 text-sm text-red-500">{errors.funding_goal}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Minimum Investment <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={form.minimum_investment}
                        onChange={(e) => handleChange('minimum_investment', parseInt(e.target.value) || 0)}
                        min={1000}
                        step={1000}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.minimum_investment ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                    </div>
                    {errors.minimum_investment && (
                      <p className="mt-1 text-sm text-red-500">{errors.minimum_investment}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Funding Stage
                  </label>
                  <select
                    value={form.funding_stage}
                    onChange={(e) => handleChange('funding_stage', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {fundingStages.map((stage) => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Team */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    Team Members
                  </CardTitle>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addTeamMember}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {form.team_members.map((member, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-navy-900">Team Member {index + 1}</span>
                      {form.team_members.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Name"
                        value={member.name}
                        onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                        placeholder="Full name"
                      />
                      <Input
                        label="Role"
                        value={member.role}
                        onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                        placeholder="e.g., CEO, CTO"
                      />
                    </div>
                    <Input
                      label="LinkedIn URL"
                      value={member.linkedin}
                      onChange={(e) => handleTeamMemberChange(index, 'linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Media & Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  Media & Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Website"
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://yourcompany.com"
                  leftIcon={<Globe className="w-5 h-5" />}
                />
                <Input
                  label="Pitch Deck URL"
                  type="url"
                  value={form.pitch_deck_url}
                  onChange={(e) => handleChange('pitch_deck_url', e.target.value)}
                  placeholder="Link to your pitch deck (Google Drive, Notion, etc.)"
                />
                <Input
                  label="Logo URL"
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="Direct link to your logo image"
                  leftIcon={<Image className="w-5 h-5" />}
                />
                <Input
                  label="Cover Image URL"
                  type="url"
                  value={form.cover_image_url}
                  onChange={(e) => handleChange('cover_image_url', e.target.value)}
                  placeholder="Direct link to a cover/hero image"
                  leftIcon={<Image className="w-5 h-5" />}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSave(false)}
                isLoading={isSaving}
                leftIcon={<Save className="w-5 h-5" />}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSave(true)}
                isLoading={isSubmitting}
                leftIcon={<Send className="w-5 h-5" />}
              >
                Save & Submit for Review
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DeveloperProjectFormPage;
