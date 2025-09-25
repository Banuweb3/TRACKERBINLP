import React from 'react';

interface KeywordListProps {
  keywords: string[];
}

const KeywordList: React.FC<KeywordListProps> = ({ keywords }) => {
  if (keywords.length === 0) {
    return <p className="text-sm text-text-light/70 drop-shadow">No specific keywords were detected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {keywords.map((keyword, index) => (
        <span key={index} className="px-4 py-2 text-sm font-medium text-text-light bg-gradient-to-r from-primary/40 to-accent/40 backdrop-blur-sm rounded-full border border-white/30 hover:from-primary/50 hover:to-accent/50 transition-all duration-200 shadow-lg drop-shadow">
          {keyword}
        </span>
      ))}
    </div>
  );
};

export default KeywordList;