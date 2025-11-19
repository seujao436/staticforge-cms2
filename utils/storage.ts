import { HtmlPage } from '../types';
import { APP_STORAGE_KEY } from '../constants';

export const getPages = (): HtmlPage[] => {
  try {
    const data = localStorage.getItem(APP_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load pages", e);
    return [];
  }
};

export const savePage = (page: HtmlPage): void => {
  const pages = getPages();
  const index = pages.findIndex(p => p.id === page.id);
  
  if (index >= 0) {
    pages[index] = { ...page, updatedAt: Date.now() };
  } else {
    pages.push({ ...page, createdAt: Date.now(), updatedAt: Date.now() });
  }
  
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(pages));
  } catch (e) {
    alert("Storage quota exceeded! Delete some pages to save new ones.");
  }
};

export const deletePage = (id: string): void => {
  const pages = getPages().filter(p => p.id !== id);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(pages));
};

export const getPageById = (id: string): HtmlPage | undefined => {
  return getPages().find(p => p.id === id);
};

export const exportPageToHtml = (page: HtmlPage) => {
  const blob = new Blob([page.content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${page.slug}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const openPageInNewTab = (page: HtmlPage) => {
  // Create a Blob URL to simulate a hosted file
  const blob = new Blob([page.content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open in new tab
  const win = window.open(url, '_blank');
  
  // Note: We cannot easily revoke the object URL immediately because the new tab needs it.
  // Browsers will clean it up when the document is unloaded.
  if (win) {
    win.focus();
  } else {
    alert("Please allow popups to view the generated page.");
  }
};