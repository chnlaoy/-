
import { PresentationTheme } from '../types';

export const THEMES: PresentationTheme[] = [
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    colors: {
      bg: 'F3F4F6',        // Tailwind gray-100
      primary: '0EA5E9',   // Tailwind sky-500
      text: '374151',       // Tailwind gray-700
      accent: '0284C7',     // Tailwind sky-600
      textOnPrimary: 'FFFFFF',
      subtleText: '6B7280'  // Tailwind gray-500
    }
  },
  {
    id: 'graphite-gray',
    name: 'Graphite Gray',
    colors: {
      bg: '1F2937',        // Tailwind gray-800
      primary: '4B5563',   // Tailwind gray-600
      text: 'E5E7EB',       // Tailwind gray-200
      accent: '9CA3AF',     // Tailwind gray-400
      textOnPrimary: 'FFFFFF',
      subtleText: '9CA3AF'  // Tailwind gray-400
    }
  },
  {
    id: 'minty-fresh',
    name: 'Minty Fresh',
    colors: {
      bg: 'ECFDF5',       // Tailwind green-50
      primary: '34D399',  // Tailwind emerald-400
      text: '065F46',      // Tailwind emerald-800
      accent: '059669',    // Tailwind emerald-600
      textOnPrimary: 'FFFFFF',
      subtleText: '52525B' // Tailwind zinc-600
    }
  }
];
