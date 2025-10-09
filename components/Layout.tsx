import React from 'react';
import { AnalyticsIcon } from './icons';

interface HeaderProps {
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ children }) => (
  <header className="glass-effect sticky top-0 z-50 border-b border-white/20 shadow-lg">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
          <div className="pulse-animation">
            <AnalyticsIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white ml-3 gradient-text">
            TRACKERBI
          </h1>
        </div>
        {children && (
          <div className="flex items-center">
            {children}
          </div>
        )}
      </div>
    </div>
  </header>
);

export const Footer: React.FC = () => (
  <footer className="bg-transparent mt-8">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-white/70 text-sm">
      <p>&copy; {new Date().getFullYear()} TRACKERBI. All rights reserved.</p>
    </div>
  </footer>
);