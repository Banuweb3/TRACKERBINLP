import React from 'react';

interface AnalysisCardProps {
  title: string;
  children: React.ReactNode;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, children }) => {
  return (
    <div className="glass-dark p-6 rounded-2xl shadow-xl border border-white/20 h-full card-hover">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-text-light drop-shadow-lg">{title}</h3>
        <div className="ml-3 flex-1 h-px bg-gradient-to-r from-white/30 to-transparent"></div>
      </div>
      {children}
    </div>
  );
};

export default AnalysisCard;