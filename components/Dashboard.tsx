import React, { useEffect, useState } from 'react';
import { HtmlPage } from '../types';
import { getPages, deletePage, savePage, exportPageToHtml, openPageInNewTab } from '../utils/storage';
import { publishPageToGithub } from '../services/githubService';
import { Button } from './Button';
import { Plus, FileCode, Trash2, Download, Edit, Search, ExternalLink, CloudUpload } from 'lucide-react';
import { DEFAULT_TEMPLATE } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
  onEdit: (page: HtmlPage) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onEdit }) => {
  const [pages, setPages] = useState<HtmlPage[]>([]);
  const [search, setSearch] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const loadPages = () => {
    setPages(getPages().sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleCreate = () => {
    const id = uuidv4();
    const newPage: HtmlPage = {
      id,
      title: 'Untitled Page',
      slug: `page-${id.slice(0, 8)}`,
      content: DEFAULT_TEMPLATE,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    };
    savePage(newPage);
    onEdit(newPage);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this page? This cannot be undone.')) {
      deletePage(id);
      loadPages();
    }
  };

  const handleExport = (page: HtmlPage, e: React.MouseEvent) => {
    e.stopPropagation();
    exportPageToHtml(page);
  };

  const handleOpenLive = (page: HtmlPage, e: React.MouseEvent) => {
    e.stopPropagation();
    openPageInNewTab(page);
  };

  const handlePublish = async (page: HtmlPage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Publish "${page.slug}.html" to GitHub (tehew.space)?`)) return;

    setPublishingId(page.id);
    try {
      const url = await publishPageToGithub(page);
      alert(`Published Successfully!\nIt may take 30-60 seconds to appear live.\n\nURL: ${url}`);
    } catch (error: any) {
      alert(`Publishing failed: ${error.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">StaticForge</h1>
            <p className="text-sm md:text-base text-gray-400 mt-1">Manage your static HTML sites locally.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search pages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 bg-gray-900 border border-gray-800 rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </div>
        </div>

        {filteredPages.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl mx-4 md:mx-0">
            <FileCode className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl font-medium text-gray-300">No pages found</h3>
            <p className="text-gray-500 mt-2 mb-6">Get started by creating your first static HTML page.</p>
            <Button onClick={handleCreate}>Create Page</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPages.map(page => (
              <div 
                key={page.id} 
                onClick={() => onEdit(page)}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <FileCode className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                      onClick={(e) => handleOpenLive(page, e)}
                      className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-indigo-400 transition-colors"
                      title="View Local Preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handlePublish(page, e)}
                      className={`p-2 hover:bg-gray-800 rounded-full transition-colors ${publishingId === page.id ? 'text-green-500 animate-pulse' : 'text-gray-400 hover:text-green-400'}`}
                      title="Publish to GitHub"
                      disabled={publishingId === page.id}
                    >
                      <CloudUpload className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleExport(page, e)}
                      className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                      title="Download HTML"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(page.id, e)}
                      className="p-2 hover:bg-red-900/30 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 truncate">{page.title}</h3>
                <div className="flex items-center text-xs text-gray-500 bg-gray-950 px-2 py-1 rounded w-fit mb-4 max-w-full">
                   <span className="opacity-50 mr-1">/</span>
                   <span className="text-gray-400 truncate max-w-[150px]">{page.slug}</span>
                   <span className="opacity-50 ml-0.5">.html</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-4">
                  <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                  <span className="text-indigo-400 sm:text-gray-500 sm:group-hover:text-indigo-400 transition-colors flex items-center">
                    Edit <Edit className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-10 text-center text-gray-600 text-xs">
          <p>Storage: {filteredPages.length} / 1000 pages used (Local Browser Storage)</p>
        </div>
      </div>
    </div>
  );
};