export type BookCategory = 'novel' | 'komik';

export interface Chapter {
  id: number;
  title: string;
  subtitle?: string;
  paragraphs: string[];
}

export interface ComicDialogue {
  speaker: string;
  text: string;
  side: 'left' | 'right' | 'center';
  mood?: 'shout' | 'whisper' | 'normal' | 'thinking';
}

export interface ComicPanel {
  id: number;
  pageNumber: number;
  title: string;
  sceneDescription: string;
  dialogue: ComicDialogue[];
  visualTheme: string;
  svgArtworkType: 'action' | 'campus' | 'scifi' | 'cyberpunk' | 'village' | 'cooking';
  ambientCaption?: string;
}

export interface EBook {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  genre: string;
  coverImage?: string;
  synopsis: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice?: number;
  pages: number;
  readTime: string;
  publisher: string;
  publicationYear: number;
  isbn: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isFree?: boolean;
  coverGradient: string;
  coverAccent: string;
  coverBadge?: string;
  sampleContent?: {
    chapters: Chapter[];
  };
  comicSample?: {
    panels: ComicPanel[];
  };
}

export interface CartItem {
  book: EBook;
  addedAt: number;
}

export interface ReaderSettings {
  fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  theme: 'light' | 'sepia' | 'dark';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineSpacing: 'normal' | 'relaxed' | 'loose';
}

export interface UserProfile {
  name: string;
  email: string;
  balance: number;
  tier: string;
  ownedBookIds: string[];
  bookmarks: Record<string, { chapterId?: number; pageNumber?: number; savedAt: string; note?: string }>;
}

export interface SecurityToastEvent {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'shield';
  timestamp: number;
}
