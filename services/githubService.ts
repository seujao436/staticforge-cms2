import { HtmlPage } from '../types';

const CONFIG = {
  repo: { 
    owner: 'tehewdev', 
    name: 'tehew.space', 
    folder: 'testeHTML', 
    branch: 'main' 
  },
  jsonbin: { 
    binId: '690bda10ae596e708f473581', 
    accessKey: '$2a$10$f9KK7vSowGnJI5elo/dAPurqjZAJ3bJaWnsinl/caDfgIcNt28kNi' 
  },
  cache: { 
    tokenKey: 'gh_token_cache', 
    duration: 1000 * 60 * 15 // 15 minutes
  },
  baseUrl: 'https://tehew.space/testeHTML'
};

// Unicode-safe Base64 encoding
const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const getCachedToken = (): string | null => {
  try {
    const cached = localStorage.getItem(CONFIG.cache.tokenKey);
    if (!cached) return null;
    const { token, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CONFIG.cache.duration) {
      localStorage.removeItem(CONFIG.cache.tokenKey);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

const setCachedToken = (token: string) => {
  try {
    localStorage.setItem(CONFIG.cache.tokenKey, JSON.stringify({
      token, 
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache token', e);
  }
};

const fetchGithubToken = async (): Promise<string> => {
  const cached = getCachedToken();
  if (cached) return cached;

  try {
    const url = `https://api.jsonbin.io/v3/b/${CONFIG.jsonbin.binId}/latest`;
    const response = await fetch(url, {
      headers: { 
        'X-Access-Key': CONFIG.jsonbin.accessKey, 
        'X-Bin-Meta': 'false' 
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching token: ${response.statusText}`);
    }

    const data = await response.json();
    const token = data?.github_token;

    if (!token) {
      throw new Error('GitHub token not found in JSONBin response');
    }

    setCachedToken(token);
    return token;
  } catch (error) {
    console.error('Token retrieval failed:', error);
    throw error;
  }
};

const getFileSha = async (filename: string, token: string): Promise<string | null> => {
  const path = `${CONFIG.repo.folder}/${filename}`;
  const url = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (response.status === 404) return null;
    if (!response.ok) return null; 
    
    const data = await response.json();
    return data.sha;
  } catch {
    return null;
  }
};

export const publishPageToGithub = async (page: HtmlPage): Promise<string> => {
  try {
    const token = await fetchGithubToken();
    const filename = `${page.slug}.html`;
    
    // Check if file exists to get SHA (needed for updates)
    const sha = await getFileSha(filename, token);
    
    const path = `${CONFIG.repo.folder}/${filename}`;
    const url = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents/${path}`;
    
    const body: any = {
      message: `Update ${filename} via StaticForge CMS`,
      content: encodeBase64(page.content),
      branch: CONFIG.repo.branch
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Failed to publish to GitHub');
    }

    return `${CONFIG.baseUrl}/${filename}`;
  } catch (error: any) {
    console.error('Publish error:', error);
    throw new Error(error.message || 'Unknown error during publishing');
  }
};