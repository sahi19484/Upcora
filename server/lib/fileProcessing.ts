import { z } from 'zod';

// Dynamic imports to avoid bundling server-only dependencies in client
let pdf: any;
let mammoth: any;

async function loadDependencies() {
  if (!pdf) {
    pdf = (await import('pdf-parse')).default;
  }
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/msword'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ExtractedContent {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    pages?: number;
    wordCount: number;
    extractedAt: Date;
  };
}

export async function extractTextFromFile(buffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedContent> {
  let text = '';
  let pages: number | undefined;

  try {
    switch (mimeType) {
      case 'application/pdf':
        const pdfData = await pdf(buffer);
        text = pdfData.text;
        pages = pdfData.numpages;
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docxResult = await mammoth.extractRawText({ buffer });
        text = docxResult.value;
        break;
        
      case 'text/plain':
        text = buffer.toString('utf-8');
        break;
        
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Clean up the extracted text
    text = text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up excessive line breaks
      .trim();

    if (!text || text.length < 100) {
      throw new Error('File appears to be empty or too short for processing');
    }

    const wordCount = text.split(/\s+/).length;

    return {
      text,
      metadata: {
        fileName,
        fileType: mimeType,
        pages,
        wordCount,
        extractedAt: new Date()
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateFile(file: any): void {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error(`File type not supported. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
}

export function truncateTextForAI(text: string, maxTokens = 8000): string {
  // Rough approximation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return text;
  }

  // Try to truncate at a sentence boundary
  const truncated = text.substring(0, maxChars);
  const lastSentence = truncated.lastIndexOf('.');
  
  if (lastSentence > maxChars * 0.8) {
    return truncated.substring(0, lastSentence + 1);
  }

  // Fallback to character limit with ellipsis
  return truncated + '...';
}

export const urlSchema = z.object({
  url: z.string().url()
});

export async function extractTextFromUrl(url: string): Promise<ExtractedContent> {
  try {
    // Basic URL text extraction (you might want to use a more sophisticated scraper)
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    let text = await response.text();
    
    // Basic HTML tag removal (you might want to use a proper HTML parser)
    text = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length < 100) {
      throw new Error('URL content appears to be empty or too short for processing');
    }

    const wordCount = text.split(/\s+/).length;

    return {
      text,
      metadata: {
        fileName: url,
        fileType: 'text/html',
        wordCount,
        extractedAt: new Date()
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract text from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
