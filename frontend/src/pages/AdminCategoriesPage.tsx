import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderTree, Plus, Edit, Trash2, Loader2, Search,
  GripVertical, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import type { Category } from '../types';
import toast from 'react-hot-toast';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#40E0D0');

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_categories' });
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.adminListCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setIcon(category.icon || '');
      setColor(category.color || '#40E0D0');
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
      setIcon('');
      setColor('#40E0D0');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIcon('');
    setColor('#40E0D0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: icon.trim() || undefined,
        color: color,
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.id, data);
        toast.success('Category updated');
        trackEvent('category_updated', { category_id: editingCategory.id });
      } else {
        await api.createCategory(data);
        toast.success('Category created');
        trackEvent('category_created');
      }

      loadCategories();
      closeModal();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      toast.error(error.response?.data?.error || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if ((category.project_count || 0) > 0) {
      toast.error('Cannot delete category with existing projects');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      await api.deleteCategory(category.id);
      toast.success('Category deleted');
      trackEvent('category_deleted', { category_id: category.id });
      loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      await api.updateCategory(category.id, { is_active: !category.is_active });
      toast.success(category.is_active ? 'Category deactivated' : 'Category activated');
      loadCategories();
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
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
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-navy-900">
                Categories
              </h1>
              <p className="text-gray-600 mt-1">
                Manage project categories and industries
              </p>
            </div>
            <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>
              Add Category
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredCategories.map((category) => (
            <Card key={category.id} className={`${!category.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <FolderTree className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    {category.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-navy-900 mb-1">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {category.project_count || 0} projects
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={category.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {category.is_active ? (
                        <XCircle className="w-4 h-4 text-gray-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                    <button
                      onClick={() => openModal(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                      disabled={(category.project_count || 0) > 0}
                    >
                      <Trash2 className={`w-4 h-4 ${(category.project_count || 0) > 0 ? 'text-gray-300' : 'text-red-500'}`} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-navy-900 mb-2">No categories found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first category'}
              </p>
              {!searchQuery && (
                <Button onClick={() => openModal()}>Add Category</Button>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-navy-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., FinTech"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (emoji or icon name)
                </label>
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g., 💰 or fintech"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#40E0D0"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving} className="flex-1">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminCategoriesPage;
