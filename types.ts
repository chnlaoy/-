
export interface SlideContent {
  title: string;
  points: string[];
  notes?: string;
  imageData?: string; // Base64 encoded image data
  imageMimeType?: string; // e.g., 'image/png' or 'image/jpeg'
  imageAltText?: string; // AI-generated alt text for accessibility
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  imageData?: string; // Base64 encoded image data
  imageMimeType?: string; // e.g., 'image/png' or 'image/jpeg'
}

export enum ProcessingStage {
  IDLE = "IDLE",
  UPLOADING = "UPLOADING",
  PARSING_PDF = "PARSING_PDF", // This stage will now include image extraction
  GENERATING_SLIDES = "GENERATING_SLIDES",
  AWAITING_PREVIEW = "AWAITING_PREVIEW",
  CREATING_PPTX = "CREATING_PPTX",
  DONE = "DONE",
  ERROR = "ERROR"
}

// New Types for Theme Selection
export interface ThemeColors {
  bg: string;
  primary: string;
  text: string;
  accent: string;
  textOnPrimary: string;
  subtleText: string;
}

export interface PresentationTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}