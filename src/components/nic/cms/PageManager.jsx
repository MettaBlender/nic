'use client';

import React, { useState, useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';
import { Plus, Edit, Trash2, FileText, Clock } from 'lucide-react';

const PageManager = () => {
  const {
    pages,
    currentPage,
    selectPage,
    createPage,
    updatePage,
    deletePage,
    isLoading
  } = useCMS();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [formData, setFormData] = useState({ title: '', slug: '' });

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) return;

    try {
      const newPage = await createPage(formData.title, formData.slug);
      setShowCreateForm(false);
      setFormData({ title: '', slug: '' });
      selectPage(newPage);
    } catch (error) {
      alert('Error creating page: ' + error.message);
    }
  };

  const handleUpdatePage = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !editingPage) return;

    try {
      await updatePage(editingPage.id, formData.title, formData.slug);
      setEditingPage(null);
      setFormData({ title: '', slug: '' });
    } catch (error) {
      alert('Error updating page: ' + error.message);
    }
  };

  const handleDeletePage = async (page) => {
    if (window.confirm(`Are you sure you want to delete the page "${page.title}"?`)) {
      try {
        await deletePage(page.id);
      } catch (error) {
        alert('Error deleting page: ' + error.message);
      }
    }
  };

  const startEdit = (page) => {
    setEditingPage(page);
    setFormData({ title: page.title, slug: page.slug });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setShowCreateForm(false);
    setFormData({ title: '', slug: '' });
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title) => {
    setFormData({
      title,
      slug: formData.slug || generateSlug(title)
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-accent p-4">
        <div className="flex flex-col gap-2 items-center justify-between">
          <h2 className="text-xl font-semibold text">Manage Pages</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-accent/10 ring ring-accent text-white px-4 py-2 rounded-md hover:bg-background flex items-center gap-2 transition-colors duration-200 ease-in-out"
          >
            <Plus size={16} />
            New Page
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingPage) && (
        <div className="border-b border-accent p-4 bg-background">
          <form onSubmit={editingPage ? handleUpdatePage : handleCreatePage}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter page title"
                  required
                />
              </div>

              <div className='relative'>
                <label className="block text-sm font-medium text-foreground mb-1">
                  URL-Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 pl-4 py-2 border border-accent rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="url-slug"
                  pattern="[a-z0-9-]+"
                  title="Only lowercase letters, numbers and hyphens allowed"
                  required
                />
                <div className="absolute top-[1.92rem] left-2 text-xl text-foreground">/</div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  {editingPage ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-foreground">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-2" />
              <p>No pages available yet</p>
              <p className="text-sm">Create your first page</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  currentPage && currentPage.id === page.id
                    ? 'border-accent bg-accent/10'
                    : 'border-accent/10 hover:border-2 hover:border-accent'
                }`}
                onClick={() => selectPage(page)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{page.title}</h3>
                    <p className="text-sm text-foreground/50">/{page.slug}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-foreground/50">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Erstellt: {formatDate(page.created_at)}
                      </span>
                      {page.updated_at !== page.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Aktualisiert: {formatDate(page.updated_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentPage && currentPage.id === page.id && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Aktiv
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(page);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                      title="Edit page"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            title="Edit page"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageManager;
