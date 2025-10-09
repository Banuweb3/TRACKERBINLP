import React, { useState } from 'react';
import { bulkAnalysisService } from '../services/bulkAnalysisAPI';
import { DownloadIcon, LoadingSpinner } from './icons';

interface BulkAnalysisExportMenuProps {
  sessionId: number;
  sessionName: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
}

const BulkAnalysisExportMenu: React.FC<BulkAnalysisExportMenuProps> = ({
  sessionId,
  sessionName,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (type: 'excel' | 'pdf' | 'zip' | 'summary' | 'training-json' | 'training-csv' | 'training-package') => {
    setIsExporting(true);
    setExportType(type);
    onExportStart?.();

    try {
      switch (type) {
        case 'excel':
          await bulkAnalysisService.exportExcel(sessionId);
          break;
        case 'pdf':
          await bulkAnalysisService.exportPDF(sessionId);
          break;
        case 'zip':
          await bulkAnalysisService.exportZip(sessionId, ['excel', 'pdf']);
          break;
        case 'summary':
          await bulkAnalysisService.downloadSummary(sessionId);
          break;
        case 'training-json':
          await bulkAnalysisService.exportTrainingJSON(sessionId);
          break;
        case 'training-csv':
          await bulkAnalysisService.exportTrainingCSV(sessionId);
          break;
        case 'training-package':
          await bulkAnalysisService.exportTrainingPackage(sessionId);
          break;
      }
      onExportComplete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
      setExportType('');
      setShowMenu(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="flex items-center space-x-2 px-4 py-2 bg-accent text-text-light rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>Exporting {exportType}...</span>
          </>
        ) : (
          <>
            <DownloadIcon className="h-4 w-4" />
            <span>Export Results</span>
          </>
        )}
      </button>

      {showMenu && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-text-light mb-3">Export Options</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center">
                  <span className="text-green-400 text-xs font-bold">XLS</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Excel Report</div>
                  <div className="text-xs text-text-light/60">Detailed spreadsheet with all data</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center">
                  <span className="text-red-400 text-xs font-bold">PDF</span>
                </div>
                <div>
                  <div className="text-sm font-medium">PDF Report</div>
                  <div className="text-xs text-text-light/60">Professional formatted document</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('summary')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">TXT</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Text Summary</div>
                  <div className="text-xs text-text-light/60">Quick overview in plain text</div>
                </div>
              </button>

              <div className="border-t border-white/10 my-2"></div>

              <button
                onClick={() => handleExport('zip')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                  <span className="text-purple-400 text-xs font-bold">ZIP</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Complete Package</div>
                  <div className="text-xs text-text-light/60">All formats in one archive</div>
                </div>
              </button>

              <div className="border-t border-white/10 my-2"></div>
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-text-light/80 mb-2">🤖 FOR MODEL TRAINING</div>
              </div>

              <button
                onClick={() => handleExport('training-json')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-500/20 rounded flex items-center justify-center">
                  <span className="text-indigo-400 text-xs font-bold">JSON</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Training Data (JSON)</div>
                  <div className="text-xs text-text-light/60">Structured data for ML models</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('training-csv')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500/20 rounded flex items-center justify-center">
                  <span className="text-orange-400 text-xs font-bold">CSV</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Training Data (CSV)</div>
                  <div className="text-xs text-text-light/60">Tabular format for data science</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('training-package')}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-text-light hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded flex items-center justify-center">
                  <span className="text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xs font-bold">ML</span>
                </div>
                <div>
                  <div className="text-sm font-medium">Complete Training Package</div>
                  <div className="text-xs text-text-light/60">JSON + CSV + metadata + README</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default BulkAnalysisExportMenu;

