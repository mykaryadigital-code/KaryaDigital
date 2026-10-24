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
  createdAt?: number;
  coverGradient: string;
  coverAccent: string;
  coverBadge?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  epubUrl?: string;
  epubFileName?: string;
  epubFileSize?: string;
  isSeries?: boolean;
  seriesName?: string;
  seriesOrder?: number;
  seriesStatus?: 'ongoing' | 'completed';
  seriesUpdateSchedule?: string;
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

export interface BookmarkEntry {
  id: string;
  bookId: string;
  pageNumber: number; // 1-based page / chapter number
  totalSteps: number;
  chapterIndex?: number;
  chapterTitle?: string;
  excerpt?: string;
  savedAt: string; // ISO string
}

export type UserRole = 'reader' | 'author' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  balance: number;
  tier: string;
  isSubscribed?: boolean;
  subscriptionExpiresAt?: string;
  ownedBookIds: string[];
  bookmarks: Record<string, BookmarkEntry[]>;
  role?: UserRole;
  isAuthor?: boolean;
  authorBio?: string;
  isLoggedIn?: boolean;
  photoURL?: string;
  uid?: string;
}

export interface SecurityToastEvent {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'shield';
  timestamp: number;
}
