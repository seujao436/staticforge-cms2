export interface HtmlPage {
  id: string;
  slug: string; // used for the filename e.g., 'about-us' -> 'about-us.html'
  title: string;
  content: string; // The full HTML content
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface GeneratePageRequest {
  prompt: string;
}

export enum EditorMode {
  CODE = 'CODE',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}