'use client';

import React, { useState, useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';
import { Plus, Edit, Trash2, FileText, Clock } from 'lucide-react';

const PageManager = () => {
  const {
    pages,
    currentPage,
    setCurrentPage,
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
      setCurrentPage(newPage);
    } catch (error) {
      alert('Fehler beim Erstellen der Seite: ' + error.message);
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
      alert('Fehler beim Aktualisieren der Seite: ' + error.message);
    }
  };

  const handleDeletePage = async (page) => {
    if (window.confirm(`Sind Sie sicher, dass Sie die Seite "${page.title}" löschen möchten?`)) {
      try {
        await deletePage(page.id);
      } catch (error) {
        alert('Fehler beim Löschen der Seite: ' + error.message);
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
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Seiten verwalten</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={16} />
            Neue Seite
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingPage) && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <form onSubmit={editingPage ? handleUpdatePage : handleCreatePage}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seiten-Titel eingeben"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL-Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="url-slug"
                  pattern="[a-z0-9-]+"
                  title="Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  {editingPage ? 'Aktualisieren' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Abbrechen
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
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-2" />
              <p>Noch keine Seiten vorhanden</p>
              <p className="text-sm">Erstellen Sie Ihre erste Seite</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  currentPage && currentPage.id === page.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setCurrentPage(page)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{page.title}</h3>
                    <p className="text-sm text-gray-500">/{page.slug}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
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
                      title="Seite bearbeiten"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(page);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Seite löschen"
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
