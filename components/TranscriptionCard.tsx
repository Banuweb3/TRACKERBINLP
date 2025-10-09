import React, { useState } from 'react';
import { CopyIcon } from './icons';

interface TranscriptionCardProps {
  title: string;
  text: string;
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({ title, text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  // Determine styling based on title content
  const isTranscription = title.includes('📝') || title.toLowerCase().includes('transcription');
  const isTranslation = title.includes('🌐') || title.toLowerCase().includes('translation');
  
  const getCardStyling = () => {
    if (isTranscription) {
      return {
        background: 'from-gray-500/10 to-slate-500/10',
        border: 'border-gray-400/20'
      };
    } else if (isTranslation) {
      return {
        background: 'from-blue-500/10 to-cyan-500/10',
        border: 'border-blue-400/20'
      };
    }
    return {
      background: 'from-white/5 to-white/10',
      border: 'border-white/20'
    };
  };
  
  const styling = getCardStyling();

  return (
    <div className={`glass-dark p-6 rounded-2xl shadow-xl border ${styling.border} relative card-hover`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-text-light drop-shadow-lg">{title}</h3>
          <div className="ml-3 flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center px-3 py-2 text-xs font-semibold text-text-light bg-white/15 hover:bg-white/25 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 backdrop-blur-sm border border-white/20"
          disabled={!text}
        >
          <CopyIcon className="h-4 w-4 mr-1.5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className={`bg-gradient-to-br ${styling.background} backdrop-blur-sm p-4 rounded-xl border ${styling.border} max-h-64 overflow-y-auto`}>
        <p className="text-sm text-text-light/95 whitespace-pre-wrap leading-relaxed drop-shadow">
            {text || <span className="text-text-light/60 italic font-sans">(No speech detected or text available)</span>}
        </p>
      </div>
    </div>
  );
};

export default TranscriptionCard;