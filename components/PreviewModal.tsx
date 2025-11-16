
import React from 'react';
import { SlideContent } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  slides: SlideContent[];
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const CancelIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, slides, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-slate-800 border border-slate-600 shadow-2xl rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 id="preview-modal-title" className="text-2xl font-bold text-sky-400">Presentation Preview</h2>
          <button onClick={onCancel} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" aria-label="Close preview">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-6 overflow-y-auto flex-grow bg-slate-900/50">
          <div className="space-y-6">
            {slides.map((slide, index) => (
              <div key={index} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">SLIDE {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text Content */}
                  <div>
                    <h4 className="font-bold text-lg text-white mb-2">{slide.title}</h4>
                    {slide.points.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {slide.points.map((point, pIndex) => (
                          <li key={pIndex}>{point}</li>
                        ))}
                      </ul>
                    ) : (
                        <p className="text-slate-400 italic">No bullet points for this slide.</p>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {slide.imageData && (
                    <div className="flex items-center justify-center bg-slate-800 rounded p-2">
                        <img 
                            src={slide.imageData} 
                            alt={slide.imageAltText || `Preview for slide ${index + 1}`} 
                            className="max-h-40 w-auto object-contain rounded"
                        />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="p-4 border-t border-slate-700 flex justify-end items-center space-x-4 flex-shrink-0">
          <button
            onClick={onCancel}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex items-center"
          >
            <CancelIcon className="w-5 h-5 mr-2" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex items-center"
          >
             <ConfirmIcon className="w-5 h-5 mr-2" />
            Confirm & Download
          </button>
        </footer>
      </div>
    </div>
  );
};