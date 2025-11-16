
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { Loader } from './components/Loader';
import { PreviewModal } from './components/PreviewModal'; // Import the new modal
import { ProgressBar } from './components/ProgressBar';
import { ThemeSelector } from './components/ThemeSelector';
import { THEMES } from './styles/themes';
import { extractTextAndImagesFromPdf } from './services/pdfParserService';
import { generateSlideContent } from './services/geminiService';
import { createPptx } from './services/pptGeneratorService';
import { SlideContent, ExtractedPdfPage, ProcessingStage, PresentationTheme } from './types';

// Icons (same as before)
const DocumentArrowUpIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const ArrowDownTrayIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>
);
const InformationCircleIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);


const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processingStage, setProcessingStage] = useState<ProcessingStage>(ProcessingStage.IDLE);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState<string>('');
  const [slidePreviewData, setSlidePreviewData] = useState<SlideContent[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [selectedTheme, setSelectedTheme] = useState<PresentationTheme>(THEMES[0]);

  const handleFileDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setError(null);
        setProcessingStage(ProcessingStage.IDLE);
        setGeneratedFileName(`${file.name.replace(/\.pdf$/i, '')}_presentation.pptx`);
      } else {
        setError("Invalid file type. Please upload a PDF.");
        setPdfFile(null);
      }
    }
  }, []);

  const resetState = () => {
    setPdfFile(null);
    setProcessingStage(ProcessingStage.IDLE);
    setProgressMessage('');
    setError(null);
    setGeneratedFileName('');
    setSlidePreviewData([]);
    setIsPreviewModalOpen(false);
    setGenerationProgress(0);
  }

  const handleCancelPreview = () => {
    setIsPreviewModalOpen(false);
    setProcessingStage(ProcessingStage.IDLE); // Or DONE, depending on desired flow
    setProgressMessage('PPTX generation cancelled.');
  };

  const handleConfirmDownload = async () => {
    setIsPreviewModalOpen(false);
    if (slidePreviewData.length === 0) {
        setError("No slide data available to generate a presentation.");
        setProcessingStage(ProcessingStage.ERROR);
        return;
    }
    try {
        setProcessingStage(ProcessingStage.CREATING_PPTX);
        setProgressMessage("Creating PowerPoint presentation...");
        await createPptx(slidePreviewData, generatedFileName, selectedTheme);
        setProcessingStage(ProcessingStage.DONE);
        setProgressMessage(`Presentation "${generatedFileName}" generated successfully!`);
    } catch(err) {
        console.error("Error creating PPTX file:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred during PPTX creation.");
        setProcessingStage(ProcessingStage.ERROR);
    }
  };

  const processAndGeneratePpt = async () => {
    if (!pdfFile) {
      setError("Please upload a PDF file first.");
      return;
    }
    
    if (!process.env.API_KEY) {
        setError("Gemini API Key (process.env.API_KEY) is not configured. Cannot proceed.");
        setProcessingStage(ProcessingStage.ERROR);
        return;
    }

    setProcessingStage(ProcessingStage.PARSING_PDF);
    setProgressMessage("Parsing PDF (text and images)...");
    setError(null);
    setGenerationProgress(0);

    try {
      const extractedPages: ExtractedPdfPage[] = await extractTextAndImagesFromPdf(pdfFile);
      if (extractedPages.length === 0) {
        setError("Could not extract any content (text or images) from the PDF.");
        setProcessingStage(ProcessingStage.ERROR);
        return;
      }

      setProcessingStage(ProcessingStage.GENERATING_SLIDES);
      const allSlideContents: SlideContent[] = [];
      
      for (let i = 0; i < extractedPages.length; i++) {
        const page = extractedPages[i];
        setProgressMessage(`AI: Analyzing page ${page.pageNumber}/${extractedPages.length}...`);
        const currentProgress = Math.round(((i + 1) / extractedPages.length) * 100);
        setGenerationProgress(currentProgress);
        
        if (page.text.trim().length < 30 && !page.imageData) { 
            console.log(`Skipping page ${page.pageNumber} due to insufficient content.`);
            continue;
        }

        try {
            const slideContent = await generateSlideContent(page); 
            if (slideContent.title !== "Error: Invalid AI Response" && 
                slideContent.title !== "Error Processing Content" &&
                slideContent.title !== "Empty Page" &&
                (slideContent.title || slideContent.points.length > 0 || slideContent.imageData)) {
                 allSlideContents.push(slideContent);
            } else {
                console.warn(`Skipping slide generation for page ${page.pageNumber}: ${slideContent.title}`);
            }
        } catch (geminiError) {
            console.error(`Error generating slide for page ${page.pageNumber}:`, geminiError);
        }
      }

      if (allSlideContents.length === 0) {
        setError("No suitable slides could be generated from the PDF content.");
        setProcessingStage(ProcessingStage.ERROR);
        return;
      }

      setSlidePreviewData(allSlideContents);
      setProcessingStage(ProcessingStage.AWAITING_PREVIEW);
      setProgressMessage("Slide content generated. Ready for your review.");
      setIsPreviewModalOpen(true);
      
    } catch (err) {
      console.error("Error processing PDF and generating slides:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during processing.");
      setProcessingStage(ProcessingStage.ERROR);
    }
  };

  const getStageHelpText = () => {
    switch(processingStage) {
        case ProcessingStage.IDLE: return "Upload a PDF to begin.";
        case ProcessingStage.PARSING_PDF: return "Extracting text and images from your PDF...";
        case ProcessingStage.GENERATING_SLIDES: return "AI is analyzing content and crafting your slides...";
        case ProcessingStage.AWAITING_PREVIEW: return "Content is ready. Check the preview to continue.";
        case ProcessingStage.CREATING_PPTX: return "Assembling your PowerPoint file...";
        case ProcessingStage.DONE: return `Your presentation is ready!`;
        case ProcessingStage.ERROR: return "An error occurred. Please review the message and try again.";
        default: return "";
    }
  }
  
  const isProcessing = ![ProcessingStage.IDLE, ProcessingStage.DONE, ProcessingStage.ERROR, ProcessingStage.AWAITING_PREVIEW].includes(processingStage);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white">
        <div className="w-full max-w-2xl bg-slate-800 shadow-2xl rounded-xl p-6 md:p-10">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-400">
              PDF to PPT AI Generator
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Transform PDFs (text & images) into engaging PowerPoint presentations.</p>
          </header>

          <main>
            <FileUpload onFileDrop={handleFileDrop} currentFile={pdfFile} disabled={isProcessing} />
            
            <div className="my-6">
              <ThemeSelector
                themes={THEMES}
                selectedTheme={selectedTheme}
                onSelectTheme={setSelectedTheme}
                disabled={isProcessing}
              />
            </div>

            {pdfFile && !isProcessing && (
              <button
                onClick={processAndGeneratePpt}
                disabled={!pdfFile || isProcessing}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center text-lg"
                aria-label="Generate Presentation from selected PDF"
              >
                <DocumentArrowUpIcon className="w-6 h-6 mr-3" />
                {processingStage === ProcessingStage.DONE || processingStage === ProcessingStage.AWAITING_PREVIEW ? 'Generate Again' : 'Generate Presentation'}
              </button>
            )}

            {isProcessing && (
              <div className="mt-8 text-center" role="status" aria-live="polite">
                <Loader />
                <p className="text-slate-300 text-lg mt-4">{progressMessage || getStageHelpText()}</p>
                {processingStage === ProcessingStage.GENERATING_SLIDES && (
                  <ProgressBar progress={generationProgress} />
                )}
              </div>
            )}
            
            {processingStage === ProcessingStage.DONE && progressMessage && (
               <div className="mt-6 p-4 bg-green-600/20 border border-green-500 text-green-300 rounded-lg text-center" role="alert">
                  <p className="flex items-center justify-center"><ArrowDownTrayIcon className="w-5 h-5 mr-2"/> {progressMessage}</p>
               </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-center" role="alert">
                <p className="flex items-center justify-center"><InformationCircleIcon className="w-5 h-5 mr-2"/> Error: {error}</p>
              </div>
            )}
          </main>
          
          <footer className="text-center mt-10 text-sm text-slate-500">
              <p>Powered by Gemini API & React. For educational purposes.</p>
               <p className="mt-1">Ensure your <code className="bg-slate-700 px-1 rounded">process.env.API_KEY</code> is set for Gemini.</p>
          </footer>
        </div>
      </div>
      <PreviewModal
        isOpen={isPreviewModalOpen}
        slides={slidePreviewData}
        onConfirm={handleConfirmDownload}
        onCancel={handleCancelPreview}
      />
    </>
  );
};

export default App;
