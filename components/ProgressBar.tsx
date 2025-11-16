
import React from 'react';

interface ProgressBarProps {
  progress: number; // A value from 0 to 100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const progressPercent = Math.max(0, Math.min(100, progress)); // Clamp between 0 and 100

  return (
    <div className="w-full bg-slate-700 rounded-full h-2.5 my-4" title={`Progress: ${progressPercent}%`}>
      <div
        className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progressPercent}%` }}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Generation progress"
      ></div>
    </div>
  );
};
