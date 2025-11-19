import React, { useState, useEffect } from 'react';
import { HtmlPage, EditorMode } from '../types';
import { Button } from './Button';
import { generateHtmlContent, improveHtmlContent } from '../services/geminiService';
import { publishPageToGithub } from '../services/githubService';
import { 
  Save, 
  Download, 
  Code, 
  Eye, 
  Columns, 
  Wand2, 
  ChevronLeft, 
  ExternalLink,
  CloudUpload
} from 'lucide-react';
import { savePage, exportPageToHtml, openPageInNewTab } from '../utils/storage';

interface PageEditorProps {
  page: HtmlPage;
  onBack: () => void;
  onSaveSuccess: () => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({ page, onBack, onSaveSuccess }) => {
  const [content, setContent] = useState(page.content);
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [mode, setMode] = useState<EditorMode>(EditorMode.SPLIT);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(page.updatedAt);

  // Auto-save effect (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== page.content || title !== page.title || slug !== page.slug) {
        handleSave(true);
      }
    }, 5000); // Auto-save every 5 seconds if changed
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title, slug]);

  const handleSave = (silent = false) => {
    // Ensure slug is URL safe
    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setSlug(safeSlug);

    const updatedPage: HtmlPage = {
      ...page,
      title,
      slug: safeSlug || 'untitled-page',
      content,
      updatedAt: Date.now()
    };
    savePage(updatedPage);
    setLastSaved(Date.now());
    if (!silent) onSaveSuccess();
    return updatedPage;
  };

  const handleSaveAndOpen = () => {
    const updatedPage = handleSave(false);
    openPageInNewTab(updatedPage);
  };

  const handleExport = () => {
    const tempPage = { ...page, title, slug, content };
    exportPageToHtml(tempPage);
  };

  const handlePublish = async () => {
    if (!confirm(`Publish "${slug}.html" to GitHub (tehew.space)?\nThis will make it publicly accessible.`)) return;
    
    const updatedPage = handleSave(false);
    setIsPublishing(true);
    try {
      const url = await publishPageToGithub(updatedPage);
      alert(`Successfully published!\n\nLive URL: ${url}`);
      window.open(url, '_blank');
    } catch (error: any) {
      alert(`Failed to publish: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newHtml = await generateHtmlContent(aiPrompt);
      setContent(newHtml);
      setIsAiOpen(false);
      setAiPrompt('');
    } catch (error) {
      alert("Failed to generate content. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiImprove = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const improved = await improveHtmlContent(content, aiPrompt);
      setContent(improved);
      setIsAiOpen(false);
      setAiPrompt('');
    } catch (error) {
      alert("Failed to improve content.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header - Responsive Wrapper */}
      <header className="min-h-[64px] border-b border-gray-800 flex flex-wrap items-center justify-between p-2 md:px-4 bg-gray-900 gap-2">
        
        {/* Left Group: Back + Title Info */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <Button variant="ghost" onClick={onBack} size="sm" className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col w-full">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent font-bold text-base md:text-lg focus:outline-none border-none p-0 text-white placeholder-gray-500 w-full"
              placeholder="Page Title"
            />
            <div className="flex items-center text-xs text-gray-400 group w-full">
              <span className="opacity-50">/</span>
              <input 
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="bg-transparent focus:outline-none border-b border-transparent hover:border-gray-600 focus:border-indigo-500 p-0 text-gray-400 ml-1 w-full max-w-[150px] md:max-w-[200px] transition-colors truncate"
                placeholder="filename"
                title="Click to rename file"
              />
              <span className="opacity-50 ml-0.5 shrink-0">.html</span>
              <span className="ml-4 text-gray-600 hidden lg:inline-block whitespace-nowrap">
                {lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Right Group: Controls */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* View Mode Switcher */}
          <div className="flex bg-gray-800 rounded-lg p-1 mr-2">
            <button 
              onClick={() => setMode(EditorMode.CODE)}
              className={`p-1.5 rounded ${mode === EditorMode.CODE ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Code Only"
            >
              <Code className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMode(EditorMode.SPLIT)}
              className={`p-1.5 rounded ${mode === EditorMode.SPLIT ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Split View"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setMode(EditorMode.PREVIEW)}
              className={`p-1.5 rounded ${mode === EditorMode.PREVIEW ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Preview Only"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setIsAiOpen(!isAiOpen)} className="md:flex">
            <Wand2 className="w-4 h-4 md:mr-2 text-purple-400" />
            <span className="hidden md:inline">AI</span>
          </Button>
          
          <div className="h-6 w-px bg-gray-800 mx-1 hidden md:block"></div>

          <Button 
            variant="primary" 
            size="sm" 
            onClick={handlePublish} 
            title="Publish to GitHub" 
            isLoading={isPublishing}
            className="bg-green-700 hover:bg-green-800 focus:ring-green-500"
          >
            <CloudUpload className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Publish</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExport} title="Download .html file" className="hidden sm:flex">
            <Download className="w-5 h-5" />
          </Button>
          
          <Button variant="secondary" size="sm" onClick={handleSaveAndOpen} title="Save and open in new tab">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* AI Panel */}
      {isAiOpen && (
        <div className="bg-gray-900 border-b border-gray-800 p-4 animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto">
            <label className="block text-sm font-medium text-purple-300 mb-2">
              AI Copilot (Gemini 2.5)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'Create a modern landing page...'"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleAiGenerate} 
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
                >
                  {isGenerating ? 'Thinking...' : 'Generate'}
                </Button>
                <Button 
                  onClick={handleAiImprove} 
                  disabled={isGenerating}
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                >
                  {isGenerating ? 'Thinking...' : 'Refine'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace: Flex Col on Mobile (Stacking), Flex Row on Desktop */}
      <div className={`flex-1 flex overflow-hidden ${mode === EditorMode.SPLIT ? 'flex-col md:flex-row' : ''}`}>
        
        {/* Code Editor */}
        {(mode === EditorMode.CODE || mode === EditorMode.SPLIT) && (
          <div className={`bg-[#0d1117] flex flex-col border-b md:border-b-0 md:border-r border-gray-800 
            ${mode === EditorMode.SPLIT ? 'h-1/2 w-full md:h-full md:w-1/2' : 'h-full w-full'}`}>
            <textarea
              className="flex-1 bg-transparent text-gray-300 font-mono text-xs md:text-sm p-4 resize-none focus:outline-none leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              placeholder="<html>...</html>"
            />
          </div>
        )}

        {/* Live Preview */}
        {(mode === EditorMode.PREVIEW || mode === EditorMode.SPLIT) && (
          <div className={`bg-white flex flex-col 
            ${mode === EditorMode.SPLIT ? 'h-1/2 w-full md:h-full md:w-1/2' : 'h-full w-full'}`}>
            <iframe
              title="preview"
              srcDoc={content}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-forms" 
            />
          </div>
        )}
      </div>
    </div>
  );
};