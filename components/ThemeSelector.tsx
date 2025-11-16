
import React from 'react';
import { PresentationTheme } from '../types';

interface ThemeSelectorProps {
  themes: PresentationTheme[];
  selectedTheme: PresentationTheme;
  onSelectTheme: (theme: PresentationTheme) => void;
  disabled?: boolean;
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.052-.143Z" clipRule="evenodd" />
    </svg>
);


export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, selectedTheme, onSelectTheme, disabled }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-300 mb-3">Choose a Theme</h3>
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${disabled ? 'opacity-50' : ''}`}>
        {themes.map((theme) => {
          const isSelected = theme.id === selectedTheme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              disabled={disabled}
              className={`relative block p-4 rounded-lg border-2 transition-all duration-200 text-left
                          ${isSelected ? 'border-sky-400 bg-sky-900/50' : 'border-slate-600 bg-slate-700/50 hover:border-slate-400'}
                          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              aria-pressed={isSelected}
              aria-label={`Select ${theme.name} theme`}
            >
              <p className={`font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{theme.name}</p>
              <div className="flex space-x-2 mt-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.colors.bg}` }} title={`Background: #${theme.colors.bg}`}></div>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.colors.primary}` }} title={`Primary: #${theme.colors.primary}`}></div>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.colors.text}` }} title={`Text: #${theme.colors.text}`}></div>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `#${theme.colors.accent}` }} title={`Accent: #${theme.colors.accent}`}></div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 bg-sky-500 text-white rounded-full p-1">
                    <CheckIcon className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
