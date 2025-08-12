import { z } from 'zod';

// Lazy loading of dependencies to avoid bundling issues
let pdf: any;
let mammoth: any;
let pptx: any;

async function loadDependencies() {
  try {
    if (!pdf) {
      // Import pdf-parse with safer approach
      try {
        const pdfModule = await import('pdf-parse');
        pdf = pdfModule.default || pdfModule;
      } catch (pdfError) {
        console.warn('PDF parsing unavailable:', pdfError.message);
        pdf = null;
      }
    }
    if (!mammoth) {
      try {
        mammoth = await import('mammoth');
      } catch (mammothError) {
        console.warn('Word document parsing unavailable:', mammothError.message);
        mammoth = null;
      }
    }
    if (!pptx) {
      try {
        const pptxModule = await import('node-pptx');
        pptx = pptxModule.default || pptxModule;
      } catch (pptxError) {
        console.warn('PowerPoint parsing unavailable:', pptxError.message);
        pptx = null;
      }
    }
  } catch (error) {
    console.error('Error loading file processing dependencies:', error);
  }
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/msword',
  'text/plain'
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
  await loadDependencies();

  let text = '';
  let pages: number | undefined;

  try {
    switch (mimeType) {
      case 'application/pdf':
        // Temporarily disabled due to library issue
        throw new Error('PDF processing is temporarily unavailable. Please try uploading a text file instead.');
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        // Temporarily disabled due to library issue
        throw new Error('Word document processing is temporarily unavailable. Please try uploading a text file instead.');
        break;

      case 'text/plain':
        text = buffer.toString('utf-8');
        break;

      default:
        // For unsupported types, try to read as text
        try {
          text = buffer.toString('utf-8');
          if (text.length < 10) {
            throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, Word, or text files.`);
          }
        } catch {
          throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, Word, or text files.`);
        }
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
