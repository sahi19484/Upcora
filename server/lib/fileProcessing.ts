import { z } from 'zod';

// Type definitions for libraries
declare module 'node-pptx' {
  class Presentation {
    slides: any[];
    load(buffer: Buffer): Promise<void>;
  }
  export default { Presentation };
}

// Import libraries directly - they're in dependencies so should be available
async function getPdfParser() {
  try {
    const pdfParse = await import('pdf-parse');
    return pdfParse.default || pdfParse;
  } catch (error) {
    console.error('Failed to load pdf-parse:', error);
    throw new Error('PDF library not available. Please try converting your PDF to text format.');
  }
}

async function getMammoth() {
  try {
    return await import('mammoth');
  } catch (error) {
    console.error('Failed to load mammoth:', error);
    throw new Error('Word document processing library not available. Please try uploading a text file.');
  }
}

async function getJSZip() {
  try {
    const jszipModule = await import('jszip');
    return jszipModule.default || jszipModule;
  } catch (error) {
    console.error('Failed to load jszip:', error);
    throw new Error('PowerPoint processing library not available. Please try uploading a text file.');
  }
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/msword',
  'text/plain',
  // Additional PowerPoint MIME types for better compatibility
  'application/powerpoint',
  'application/x-mspowerpoint'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  const JSZip = await getJSZip();

  try {
    const zip = new JSZip();
    const pptxData = await zip.loadAsync(buffer);

    let extractedText = '';
    const slideFiles: string[] = [];

    // Find all slide files
    pptxData.forEach((relativePath: string) => {
      if (relativePath.match(/ppt\/slides\/slide\d+\.xml$/)) {
        slideFiles.push(relativePath);
      }
    });

    // Sort slides by number
    slideFiles.sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0');
      const bNum = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0');
      return aNum - bNum;
    });

    // Extract text from each slide
    for (const slideFile of slideFiles) {
      try {
        const slideXml = await pptxData.file(slideFile)?.async('string');
        if (slideXml) {
          // Extract text from various PowerPoint text elements
          const textMatches = slideXml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
          const paragraphMatches = slideXml.match(/<a:p[^>]*>.*?<\/a:p>/gs) || [];

          // Extract from <a:t> tags (text runs)
          const textFromRuns = textMatches
            .map(match => match.replace(/<[^>]+>/g, '').trim())
            .filter(text => text.length > 0);

          // Extract from paragraph structures and clean
          const textFromParagraphs = paragraphMatches
            .map(match => {
              // Remove all XML tags and get clean text
              return match.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            })
            .filter(text => text.length > 0);

          // Combine all text from this slide
          const slideText = [...textFromRuns, ...textFromParagraphs]
            .filter((text, index, array) => array.indexOf(text) === index) // Remove duplicates
            .join(' ')
            .trim();

          if (slideText) {
            extractedText += slideText + '\n\n';
          }
        }
      } catch (slideError) {
        console.warn(`Error processing slide ${slideFile}:`, slideError);
        // Continue with other slides
      }
    }

    // Also try to extract from slide masters and layouts
    const masterFiles = ['ppt/slideMasters/slideMaster1.xml', 'ppt/slideLayouts/slideLayout1.xml'];
    for (const masterFile of masterFiles) {
      try {
        const masterXml = await pptxData.file(masterFile)?.async('string');
        if (masterXml) {
          const masterTextMatches = masterXml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
          const masterText = masterTextMatches
            .map(match => match.replace(/<[^>]+>/g, '').trim())
            .filter(text => text.length > 0 && !text.match(/^(Click to edit|Add your|Sample)/i))
            .join(' ');

          if (masterText && !extractedText.includes(masterText)) {
            extractedText += masterText + '\n\n';
          }
        }
      } catch (masterError) {
        // Masters are optional, continue without them
      }
    }

    if (!extractedText.trim()) {
      throw new Error('No text content found in PowerPoint file');
    }

    return extractedText.trim();
  } catch (error) {
    if (error instanceof Error && error.message.includes('No text content found')) {
      throw error;
    }
    throw new Error(`Failed to parse PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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
        try {
          const pdfParse = await getPdfParser();
          const pdfData = await pdfParse(buffer);
          text = pdfData.text || '';
          pages = pdfData.numpages;

          if (!text.trim()) {
            throw new Error('No text content found in PDF. The PDF may be image-based or protected. Please try saving as a text file.');
          }
        } catch (pdfError) {
          console.error('PDF processing error:', pdfError);

          // Provide more specific error messages
          if (pdfError.message.includes('ENOENT') || pdfError.message.includes('test/data')) {
            throw new Error('PDF processing library not properly installed. Please try uploading a text file instead.');
          } else if (pdfError.message.includes('Invalid PDF')) {
            throw new Error('Invalid or corrupted PDF file. Please try re-saving the PDF or converting to text format.');
          } else if (pdfError.message.includes('PDF library not available')) {
            throw pdfError;
          } else if (pdfError.message.includes('No text content found')) {
            throw pdfError;
          } else {
            throw new Error(`Failed to process PDF: ${pdfError.message}. Please try saving as a text file or ensure the PDF contains readable text.`);
          }
        }
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        try {
          const mammoth = await getMammoth();
          const docxResult = await mammoth.extractRawText({ buffer });
          text = docxResult.value || '';
        } catch (wordError) {
          throw new Error(`Failed to process Word document: ${wordError.message}. Please try saving as a text file.`);
        }
        break;

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint':
      case 'application/powerpoint':
      case 'application/x-mspowerpoint':
        try {
          // For PPTX files, use proper ZIP-based extraction
          if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            text = await extractTextFromPPTX(buffer);
          } else {
            // For legacy PPT files, inform user to use PPTX
            throw new Error('Legacy PPT format not supported. Please save your PowerPoint as PPTX format for text extraction.');
          }
        } catch (pptError) {
          if (pptError instanceof Error) {
            if (pptError.message.includes('No text content found')) {
              throw new Error('No readable text found in PowerPoint file. Please ensure your slides contain text content, or try saving each slide as a text file.');
            } else if (pptError.message.includes('Legacy PPT format')) {
              throw pptError;
            } else {
              throw new Error(`Failed to process PowerPoint: ${pptError.message}. Please try saving slides as a text file or ensure the file is a valid PPTX format.`);
            }
          } else {
            throw new Error('Failed to process PowerPoint file. Please try saving slides as a text file or convert to PPTX format.');
          }
        }
        break;

      case 'text/plain':
        text = buffer.toString('utf-8');
        break;

      default:
        // For unsupported types, try to read as text
        try {
          text = buffer.toString('utf-8');
          // Check if it looks like readable text
          if (text.length < 10 || text.includes('\x00') || text.includes('\xFF')) {
            throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, Word, PowerPoint, or text files.`);
          }
        } catch {
          throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF, Word, PowerPoint, or text files.`);
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
