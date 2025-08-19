import { truncateTextForAI } from "./fileProcessing";

export interface MediaContent {
  id: string;
  type: "image" | "video";
  url: string;
  altText: string;
  width?: number;
  height?: number;
  avgColor?: string;
  source: string;
  relevanceScore: number;
}

export interface MediaSearchResult {
  images: MediaContent[];
  videos: MediaContent[];
  totalFound: number;
}

// Function to extract key concepts from text for media search
export function extractKeyConceptsFromText(text: string): string[] {
  // Simple keyword extraction (in production, use NLP libraries like compromise.js)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // Common stop words to filter out
  const stopWords = new Set([
    "this",
    "that",
    "with",
    "have",
    "will",
    "from",
    "they",
    "been",
    "were",
    "their",
    "said",
    "each",
    "which",
    "more",
    "very",
    "what",
    "know",
    "just",
    "first",
    "also",
    "after",
    "back",
    "other",
    "many",
    "than",
    "then",
    "them",
    "these",
    "some",
    "her",
    "would",
    "make",
    "like",
    "into",
    "him",
    "has",
    "two",
    "more",
    "go",
    "no",
    "way",
    "could",
    "my",
    "than",
    "first",
    "water",
    "been",
    "call",
    "who",
    "its",
    "now",
    "find",
    "long",
    "down",
    "day",
    "did",
    "get",
    "come",
    "made",
    "may",
    "part",
  ]);

  // Count word frequency
  const wordCount = words.reduce(
    (acc, word) => {
      if (!stopWords.has(word)) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  // Get top keywords by frequency
  const sortedWords = Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return sortedWords;
}

// Enhanced search query generation based on content analysis
export function generateMediaSearchQueries(
  text: string,
  maxQueries: number = 3,
): string[] {
  const keywords = extractKeyConceptsFromText(text);

  // Try to identify the subject/topic from the beginning of the text
  const firstSentences = text.split(".").slice(0, 3).join(".").toLowerCase();

  const queries: string[] = [];

  // Primary query: main topic + key concept
  if (keywords.length >= 2) {
    queries.push(`${keywords[0]} ${keywords[1]}`);
  }

  // Secondary query: educational/learning context
  if (keywords.length >= 1) {
    queries.push(`${keywords[0]} education learning`);
  }

  // Tertiary query: concept illustration
  if (keywords.length >= 3) {
    queries.push(`${keywords[2]} diagram illustration`);
  }

  return queries.slice(0, maxQueries);
}

// Mock search function (replace with actual media search API)
export async function searchMediaContent(
  text: string,
): Promise<MediaSearchResult> {
  const queries = generateMediaSearchQueries(text, 3);
  const allMedia: MediaContent[] = [];

  // For now, return empty results since we don't have real API integration
  // This prevents showing irrelevant stock images
  console.log("Media search queries generated:", queries);
  console.log(
    "Note: Real media API integration not configured. Skipping image search.",
  );

  // In production, implement real API calls here:
  // - Unsplash API for educational images
  // - YouTube/Vimeo API for educational videos
  // - Custom educational content database

  // Sort by relevance score and separate by type
  const images = allMedia
    .filter((item) => item.type === "image")
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 4);

  const videos = allMedia
    .filter((item) => item.type === "video")
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 2);

  return {
    images,
    videos,
    totalFound: allMedia.length,
  };
}

// Function to integrate with external media APIs
export async function searchImagesFromAPI(
  query: string,
): Promise<MediaContent[]> {
  // Example integration with Unsplash API
  // const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  // if (!UNSPLASH_ACCESS_KEY) return [];

  // try {
  //   const response = await fetch(
  //     `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5`,
  //     {
  //       headers: {
  //         'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
  //       }
  //     }
  //   );
  //
  //   const data = await response.json();
  //   return data.results.map((photo: any) => ({
  //     id: photo.id,
  //     type: 'image',
  //     url: photo.urls.regular,
  //     altText: photo.alt_description || query,
  //     width: photo.width,
  //     height: photo.height,
  //     avgColor: photo.color,
  //     source: 'Unsplash',
  //     relevanceScore: 0.9
  //   }));
  // } catch (error) {
  //   console.error('Unsplash API error:', error);
  //   return [];
  // }

  // Return mock data for now
  return [];
}

export async function searchVideosFromAPI(
  query: string,
): Promise<MediaContent[]> {
  // Example integration with YouTube API or Vimeo
  // Similar implementation as above for video content
  return [];
}

// Function to generate educational animations/diagrams
export async function generateEducationalVisuals(
  concept: string,
): Promise<MediaContent[]> {
  // This could integrate with services like:
  // - Figma API for generating diagrams
  // - D3.js for data visualizations
  // - Lottie animations
  // - AI image generation (DALL-E, Midjourney)

  return [
    {
      id: `anim_${Date.now()}`,
      type: "image",
      url: "/api/generate-diagram", // Could be a dynamic diagram generator
      altText: `Interactive diagram for ${concept}`,
      width: 600,
      height: 400,
      source: "Generated",
      relevanceScore: 1.0,
    },
  ];
}
