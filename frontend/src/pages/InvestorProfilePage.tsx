import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Building2, Globe, Linkedin, DollarSign, Target,
  Save, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import toast from 'react-hot-toast';

interface InvestorProfile {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  title: string;
  website: string;
  linkedin_url: string;
  bio: string;
  investment_focus: string[];
  min_investment: number;
  max_investment: number;
  preferred_stages: string[];
}

const investmentFocusOptions = [
  'Fintech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'AI/ML',
  'CleanTech', 'AgriTech', 'Logistics', 'Consumer', 'B2B', 'Marketplace'
];

const stageOptions = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'pre_seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
];

export function InvestorProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<InvestorProfile>({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    title: '',
    website: '',
    linkedin_url: '',
    bio: '',
    investment_focus: [],
    min_investment: 10000,
    max_investment: 100000,
    preferred_stages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    trackEvent('page_view', { page: 'investor_profile' });
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.getInvestorProfile();
      setProfile({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        company_name: user?.company_name || '',
        title: res.signatory_title || '',
        website: res.website_url || '',
        linkedin_url: res.linkedin_url || '',
        bio: res.bio || '',
        investment_focus: res.focus_areas ? (typeof res.focus_areas === 'string' ? res.focus_areas.split(',') : res.focus_areas) : [],
        min_investment: res.min_check_size || 10000,
        max_investment: res.max_check_size || 100000,
        preferred_stages: res.preferred_stages ? (typeof res.preferred_stages === 'string' ? res.preferred_stages.split(',') : res.preferred_stages) : [],
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Use user data as fallback
      if (user) {
        setProfile(prev => ({
          ...prev,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof InvestorProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleFocusToggle = (focus: string) => {
    setProfile(prev => ({
      ...prev,
      investment_focus: prev.investment_focus.includes(focus)
        ? prev.investment_focus.filter(f => f !== focus)
        : [...prev.investment_focus, focus],
    }));
  };

  const handleStageToggle = (stage: string) => {
    setProfile(prev => ({
      ...prev,
      preferred_stages: prev.preferred_stages.includes(stage)
        ? prev.preferred_stages.filter(s => s !== stage)
        : [...prev.preferred_stages, stage],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.updateInvestorProfile(profile);
      trackEvent('profile_update', { user_type: 'investor' });
      toast.success('Profile updated successfully');
      refreshUser?.();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">
            Investor Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Help founders understand your investment interests and criteria
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={profile.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={profile.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled
                  leftIcon={<Mail className="w-5 h-5" />}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Company / Fund Name"
                    value={profile.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="e.g., Acme Ventures"
                    leftIcon={<Building2 className="w-5 h-5" />}
                  />
                  <Input
                    label="Title"
                    value={profile.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="e.g., Partner, Angel Investor"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Website"
                  type="url"
                  value={profile.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  leftIcon={<Globe className="w-5 h-5" />}
                />
                <Input
                  label="LinkedIn Profile"
                  type="url"
                  value={profile.linkedin_url}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  leftIcon={<Linkedin className="w-5 h-5" />}
                />
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell founders about yourself and your investment philosophy..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Investment Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  Investment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Investment Range */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Minimum Investment
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={profile.min_investment}
                        onChange={(e) => handleChange('min_investment', parseInt(e.target.value))}
                        min={0}
                        step={5000}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-1">
                      Maximum Investment
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={profile.max_investment}
                        onChange={(e) => handleChange('max_investment', parseInt(e.target.value))}
                        min={0}
                        step={10000}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Investment Focus */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Investment Focus (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {investmentFocusOptions.map((focus) => (
                      <button
                        key={focus}
                        type="button"
                        onClick={() => handleFocusToggle(focus)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          profile.investment_focus.includes(focus)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {focus}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Stages */}
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Preferred Investment Stages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {stageOptions.map((stage) => (
                      <button
                        key={stage.value}
                        type="button"
                        onClick={() => handleStageToggle(stage.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          profile.preferred_stages.includes(stage.value)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                size="lg"
                isLoading={isSaving}
                leftIcon={<Save className="w-5 h-5" />}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default InvestorProfilePage;
