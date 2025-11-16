
import React from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';

interface FileUploadProps {
  onFileDrop: (acceptedFiles: File[]) => void;
  currentFile: File | null;
  disabled?: boolean;
}

// Simple SVG Icon for Upload
const UploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-8 h-8"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);


export const FileUpload: React.FC<FileUploadProps> = ({ onFileDrop, currentFile, disabled }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: disabled
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-300 ease-in-out
                  ${disabled ? 'border-slate-600 bg-slate-700 opacity-60 cursor-not-allowed' : 
                   isDragActive ? 'border-sky-500 bg-sky-700/30' : 'border-slate-500 hover:border-sky-400 bg-slate-700/50 hover:bg-sky-700/20'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-slate-400">
        <UploadIcon className={`w-12 h-12 mb-3 ${disabled ? 'text-slate-500' : isDragActive ? 'text-sky-400' : 'text-slate-400'}`} />
        {currentFile ? (
          <>
            <p className="font-semibold text-slate-200">{currentFile.name}</p>
            <p className="text-sm text-slate-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</p>
            { !disabled && <p className="mt-2 text-sm">Drag 'n' drop a new PDF here, or click to replace.</p> }
          </>
        ) : isDragActive ? (
          <p className="text-lg font-semibold text-sky-300">Drop the PDF file here...</p>
        ) : (
          <>
            <p className="text-lg font-semibold text-slate-300">Drag 'n' drop a PDF file here, or click to select.</p>
            <p className="text-sm text-slate-500">Max file size: N/A (PDF format only)</p>
          </>
        )}
      </div>
    </div>
  );
};
