import { GoogleGenAI } from "@google/genai";

// Helper to safely get the API Key in different environments
const getApiKey = () => {
  // 1. Try standard Vite env var (Render, Vercel, Local)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GOOGLE_API_KEY;
  }

  // 2. Try process.env (Google AI Studio internal environment)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  return '';
};

export const generateHtmlContent = async (userPrompt: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("API Key missing. Set VITE_GOOGLE_API_KEY in your environment.");
    throw new Error("API Key is missing. Please configure VITE_GOOGLE_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `You are an expert Frontend Engineer and UI Designer. 
  Your task is to generate a single, complete, self-contained HTML5 file based on the user's request.
  
  Rules:
  1. Use Tailwind CSS via CDN for styling (<script src="https://cdn.tailwindcss.com"></script>).
  2. Ensure the design is responsive, modern, and accessible.
  3. Do NOT use Markdown code blocks (e.g., \`\`\`html). Return ONLY the raw HTML string.
  4. Include meaningful placeholder content and images (use https://picsum.photos/width/height) if necessary.
  5. The output must be valid HTML5.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }, 
      },
    });

    let text = response.text || "";
    
    // Clean up if model accidentally included markdown blocks despite instructions
    text = text.replace(/^```html\s*/i, '').replace(/```$/, '');
    
    return text.trim();
  } catch (error) {
    console.error("Error generating HTML:", error);
    throw new Error("Failed to generate HTML content using Gemini.");
  }
};

export const improveHtmlContent = async (currentHtml: string, improvementInstruction: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
  Current HTML:
  ${currentHtml}

  Instruction:
  ${improvementInstruction}
  
  Return the fully updated HTML file only. No markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    let text = response.text || "";
    text = text.replace(/^```html\s*/i, '').replace(/```$/, '');
    return text.trim();
  } catch (error) {
    console.error("Error improving HTML:", error);
    throw error;
  }
};