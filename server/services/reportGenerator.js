import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ReportGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Generate Excel report for bulk analysis
  async generateExcelReport(bulkSession, fileResults) {
    const workbook = new ExcelJS.Workbook();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Analysis Summary');
    this.createSummarySheet(summarySheet, bulkSession);
    
    // Individual Results Sheet
    const resultsSheet = workbook.addWorksheet('Individual Results');
    this.createResultsSheet(resultsSheet, fileResults);
    
    // Statistics Sheet
    const statsSheet = workbook.addWorksheet('Statistics');
    this.createStatsSheet(statsSheet, bulkSession, fileResults);
    
    const fileName = `bulk_analysis_${bulkSession.id}_${Date.now()}.xlsx`;
    const filePath = path.join(this.tempDir, fileName);
    
    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName };
  }

  createSummarySheet(sheet, bulkSession) {
    // Header
    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'BPO Quality Analytics - Bulk Analysis Report';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Session Info
    sheet.addRow([]);
    sheet.addRow(['Session Name:', bulkSession.sessionName]);
    sheet.addRow(['Created:', new Date(bulkSession.createdAt).toLocaleString()]);
    sheet.addRow(['Source Language:', bulkSession.sourceLanguage]);
    sheet.addRow(['Total Files:', bulkSession.totalFiles]);
    sheet.addRow(['Completed Files:', bulkSession.completedFiles]);
    sheet.addRow(['Status:', bulkSession.status]);
    sheet.addRow([]);
    
    // Performance Metrics
    sheet.addRow(['PERFORMANCE METRICS']);
    sheet.getCell('A9').font = { bold: true };
    sheet.addRow(['Overall Average Score:', bulkSession.avgOverallScore || 'N/A']);
    sheet.addRow(['Call Opening Score:', bulkSession.avgCallOpeningScore || 'N/A']);
    sheet.addRow(['Call Closing Score:', bulkSession.avgCallClosingScore || 'N/A']);
    sheet.addRow(['Speaking Quality Score:', bulkSession.avgSpeakingQualityScore || 'N/A']);
    sheet.addRow([]);
    
    // Sentiment Analysis
    sheet.addRow(['SENTIMENT ANALYSIS']);
    sheet.getCell('A14').font = { bold: true };
    sheet.addRow(['Positive Sentiment:', `${bulkSession.positiveSentimentCount || 0} (${bulkSession.positiveSentimentPercentage || 0}%)`]);
    sheet.addRow(['Neutral Sentiment:', bulkSession.neutralSentimentCount || 0]);
    sheet.addRow(['Negative Sentiment:', bulkSession.negativeSentimentCount || 0]);
    sheet.addRow([]);
    
    // Top Keywords
    if (bulkSession.topKeywords && bulkSession.topKeywords.length > 0) {
      sheet.addRow(['TOP KEYWORDS']);
      sheet.getCell('A18').font = { bold: true };
      bulkSession.topKeywords.forEach(keyword => {
        sheet.addRow(['', keyword]);
      });
      sheet.addRow([]);
    }
    
    // Batch Summary
    if (bulkSession.batchSummary) {
      sheet.addRow(['SUMMARY']);
      sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
      const summaryLines = bulkSession.batchSummary.split('\n');
      summaryLines.forEach(line => {
        sheet.addRow(['', line]);
      });
    }
    
    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  createResultsSheet(sheet, fileResults) {
    // Headers
    const headers = [
      'File Name',
      'Status',
      'Overall Score',
      'Customer Sentiment',
      'Processing Time (s)',
      'Call Summary',
      'Keywords',
      'Completed At'
    ];
    
    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
    
    // Data rows
    fileResults.forEach(result => {
      sheet.addRow([
        result.fileName,
        result.status,
        result.overallScore || 'N/A',
        result.customerSentiment || 'N/A',
        result.processingTime || 'N/A',
        result.callSummary || 'N/A',
        Array.isArray(result.keywords) ? result.keywords.join(', ') : 'N/A',
        result.completedAt ? new Date(result.completedAt).toLocaleString() : 'N/A'
      ]);
    });
    
    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Add borders
    const range = sheet.getCell('A1').address + ':' + sheet.getCell(sheet.columnCount, sheet.rowCount).address;
    sheet.getCell(range).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }

  createStatsSheet(sheet, bulkSession, fileResults) {
    sheet.addRow(['ANALYSIS STATISTICS']);
    sheet.getCell('A1').font = { size: 14, bold: true };
    sheet.addRow([]);
    
    // Calculate statistics
    const completedFiles = fileResults.filter(f => f.status === 'completed');
    const scores = completedFiles.map(f => f.overallScore).filter(s => s !== null && s !== undefined);
    
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    
    const sentimentCounts = completedFiles.reduce((acc, f) => {
      if (f.customerSentiment) {
        acc[f.customerSentiment] = (acc[f.customerSentiment] || 0) + 1;
      }
      return acc;
    }, {});
    
    sheet.addRow(['Total Files Processed:', completedFiles.length]);
    sheet.addRow(['Average Score:', avgScore.toFixed(2)]);
    sheet.addRow(['Highest Score:', maxScore]);
    sheet.addRow(['Lowest Score:', minScore]);
    sheet.addRow([]);
    
    sheet.addRow(['SENTIMENT BREAKDOWN']);
    sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
    Object.entries(sentimentCounts).forEach(([sentiment, count]) => {
      const percentage = ((count / completedFiles.length) * 100).toFixed(1);
      sheet.addRow([sentiment, `${count} (${percentage}%)`]);
    });
    
    // Performance distribution
    sheet.addRow([]);
    sheet.addRow(['PERFORMANCE DISTRIBUTION']);
    sheet.getCell(`A${sheet.rowCount}`).font = { bold: true };
    
    const excellent = scores.filter(s => s >= 8).length;
    const good = scores.filter(s => s >= 6 && s < 8).length;
    const fair = scores.filter(s => s >= 4 && s < 6).length;
    const poor = scores.filter(s => s < 4).length;
    
    sheet.addRow(['Excellent (8-10):', `${excellent} (${((excellent/scores.length)*100).toFixed(1)}%)`]);
    sheet.addRow(['Good (6-7.9):', `${good} (${((good/scores.length)*100).toFixed(1)}%)`]);
    sheet.addRow(['Fair (4-5.9):', `${fair} (${((fair/scores.length)*100).toFixed(1)}%)`]);
    sheet.addRow(['Poor (<4):', `${poor} (${((poor/scores.length)*100).toFixed(1)}%)`]);
    
    // Auto-fit columns
    sheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  // Generate PDF report
  async generatePDFReport(bulkSession, fileResults) {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      const html = this.generateHTMLReport(bulkSession, fileResults);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const fileName = `bulk_analysis_${bulkSession.id}_${Date.now()}.pdf`;
      const filePath = path.join(this.tempDir, fileName);
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      return { filePath, fileName };
    } finally {
      await browser.close();
    }
  }

  generateHTMLReport(bulkSession, fileResults) {
    const completedFiles = fileResults.filter(f => f.status === 'completed');
    const scores = completedFiles.map(f => f.overallScore).filter(s => s !== null && s !== undefined);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>BPO Quality Analytics Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                color: #333;
                line-height: 1.6;
            }
            .header { 
                text-align: center; 
                border-bottom: 2px solid #4F46E5; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }
            .header h1 { 
                color: #4F46E5; 
                margin: 0;
                font-size: 28px;
            }
            .section { 
                margin-bottom: 30px; 
                page-break-inside: avoid;
            }
            .section h2 { 
                color: #4F46E5; 
                border-bottom: 1px solid #E5E7EB;
                padding-bottom: 10px;
            }
            .metric-grid { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr); 
                gap: 20px; 
                margin: 20px 0;
            }
            .metric-card { 
                background: #F9FAFB; 
                padding: 15px; 
                border-radius: 8px; 
                border-left: 4px solid #4F46E5;
            }
            .metric-value { 
                font-size: 24px; 
                font-weight: bold; 
                color: #4F46E5;
            }
            .metric-label { 
                color: #6B7280; 
                font-size: 14px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }
            th, td { 
                border: 1px solid #E5E7EB; 
                padding: 12px; 
                text-align: left;
            }
            th { 
                background: #F3F4F6; 
                font-weight: bold;
            }
            .score-excellent { color: #10B981; }
            .score-good { color: #F59E0B; }
            .score-poor { color: #EF4444; }
            .sentiment-positive { color: #10B981; }
            .sentiment-negative { color: #EF4444; }
            .sentiment-neutral { color: #6B7280; }
            .keywords { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 8px;
            }
            .keyword { 
                background: #EEF2FF; 
                color: #4F46E5; 
                padding: 4px 8px; 
                border-radius: 4px; 
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>BPO Quality Analytics Report</h1>
            <p>Bulk Analysis Session: ${bulkSession.sessionName}</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${bulkSession.totalFiles}</div>
                    <div class="metric-label">Total Files Processed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${avgScore.toFixed(1)}/10</div>
                    <div class="metric-label">Average Quality Score</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${bulkSession.positiveSentimentPercentage || 0}%</div>
                    <div class="metric-label">Positive Sentiment</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${bulkSession.completedFiles}</div>
                    <div class="metric-label">Successfully Completed</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Performance Breakdown</h2>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Average Score</th>
                    <th>Performance Rating</th>
                </tr>
                <tr>
                    <td>Overall Quality</td>
                    <td class="${avgScore >= 8 ? 'score-excellent' : avgScore >= 6 ? 'score-good' : 'score-poor'}">${avgScore.toFixed(1)}/10</td>
                    <td>${avgScore >= 8 ? 'Excellent' : avgScore >= 6 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Call Opening</td>
                    <td>${bulkSession.avgCallOpeningScore ? bulkSession.avgCallOpeningScore.toFixed(1) : 'N/A'}/10</td>
                    <td>${bulkSession.avgCallOpeningScore >= 8 ? 'Excellent' : bulkSession.avgCallOpeningScore >= 6 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Call Closing</td>
                    <td>${bulkSession.avgCallClosingScore ? bulkSession.avgCallClosingScore.toFixed(1) : 'N/A'}/10</td>
                    <td>${bulkSession.avgCallClosingScore >= 8 ? 'Excellent' : bulkSession.avgCallClosingScore >= 6 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
                <tr>
                    <td>Speaking Quality</td>
                    <td>${bulkSession.avgSpeakingQualityScore ? bulkSession.avgSpeakingQualityScore.toFixed(1) : 'N/A'}/10</td>
                    <td>${bulkSession.avgSpeakingQualityScore >= 8 ? 'Excellent' : bulkSession.avgSpeakingQualityScore >= 6 ? 'Good' : 'Needs Improvement'}</td>
                </tr>
            </table>
        </div>

        ${bulkSession.topKeywords && bulkSession.topKeywords.length > 0 ? `
        <div class="section">
            <h2>🔑 Top Discussion Topics</h2>
            <div class="keywords">
                ${bulkSession.topKeywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>📋 Individual File Results</h2>
            <table>
                <tr>
                    <th>File Name</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Sentiment</th>
                    <th>Summary</th>
                </tr>
                ${fileResults.map(result => `
                <tr>
                    <td>${result.fileName}</td>
                    <td>${result.status}</td>
                    <td class="${result.overallScore >= 8 ? 'score-excellent' : result.overallScore >= 6 ? 'score-good' : 'score-poor'}">${result.overallScore || 'N/A'}</td>
                    <td class="sentiment-${(result.customerSentiment || '').toLowerCase()}">${result.customerSentiment || 'N/A'}</td>
                    <td>${(result.callSummary || 'N/A').substring(0, 100)}${result.callSummary && result.callSummary.length > 100 ? '...' : ''}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        ${bulkSession.batchSummary ? `
        <div class="section">
            <h2>📝 Analysis Summary</h2>
            <div style="background: #F9FAFB; padding: 20px; border-radius: 8px; border-left: 4px solid #4F46E5;">
                ${bulkSession.batchSummary.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}

        ${bulkSession.recommendations ? `
        <div class="section">
            <h2>💡 Recommendations</h2>
            <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                ${bulkSession.recommendations.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}
    </body>
    </html>
    `;
  }

  // Generate ZIP archive with all files
  async generateZipArchive(bulkSession, fileResults, formats = ['excel', 'pdf']) {
    const zipFileName = `bulk_analysis_${bulkSession.id}_${Date.now()}.zip`;
    const zipFilePath = path.join(this.tempDir, zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Generate and add files based on requested formats
    const generatedFiles = [];
    
    if (formats.includes('excel')) {
      const excelFile = await this.generateExcelReport(bulkSession, fileResults);
      archive.file(excelFile.filePath, { name: excelFile.fileName });
      generatedFiles.push(excelFile.filePath);
    }
    
    if (formats.includes('pdf')) {
      const pdfFile = await this.generatePDFReport(bulkSession, fileResults);
      archive.file(pdfFile.filePath, { name: pdfFile.fileName });
      generatedFiles.push(pdfFile.filePath);
    }
    
    // Add a summary text file
    const summaryContent = this.generateTextSummary(bulkSession, fileResults);
    archive.append(summaryContent, { name: 'summary.txt' });
    
    await archive.finalize();
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Clean up temporary files
        generatedFiles.forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        
        resolve({ filePath: zipFilePath, fileName: zipFileName });
      });
      
      output.on('error', reject);
      archive.on('error', reject);
    });
  }

  generateTextSummary(bulkSession, fileResults) {
    const completedFiles = fileResults.filter(f => f.status === 'completed');
    const scores = completedFiles.map(f => f.overallScore).filter(s => s !== null && s !== undefined);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    return `
BPO QUALITY ANALYTICS - BULK ANALYSIS SUMMARY
=============================================

Session Information:
- Session Name: ${bulkSession.sessionName}
- Created: ${new Date(bulkSession.createdAt).toLocaleString()}
- Source Language: ${bulkSession.sourceLanguage}
- Total Files: ${bulkSession.totalFiles}
- Completed Files: ${bulkSession.completedFiles}
- Status: ${bulkSession.status}

Performance Metrics:
- Average Overall Score: ${avgScore.toFixed(2)}/10
- Average Call Opening Score: ${bulkSession.avgCallOpeningScore || 'N/A'}/10
- Average Call Closing Score: ${bulkSession.avgCallClosingScore || 'N/A'}/10
- Average Speaking Quality Score: ${bulkSession.avgSpeakingQualityScore || 'N/A'}/10

Sentiment Analysis:
- Positive: ${bulkSession.positiveSentimentCount || 0} (${bulkSession.positiveSentimentPercentage || 0}%)
- Neutral: ${bulkSession.neutralSentimentCount || 0}
- Negative: ${bulkSession.negativeSentimentCount || 0}

Top Keywords:
${bulkSession.topKeywords ? bulkSession.topKeywords.map(k => `- ${k}`).join('\n') : 'N/A'}

Individual File Results:
${fileResults.map(result => `
File: ${result.fileName}
Status: ${result.status}
Score: ${result.overallScore || 'N/A'}/10
Sentiment: ${result.customerSentiment || 'N/A'}
Summary: ${result.callSummary || 'N/A'}
---`).join('\n')}

${bulkSession.batchSummary ? `
Batch Summary:
${bulkSession.batchSummary}
` : ''}

${bulkSession.recommendations ? `
Recommendations:
${bulkSession.recommendations}
` : ''}

Generated on: ${new Date().toLocaleString()}
    `.trim();
  }

  // Generate training data export (JSON format for ML)
  async generateTrainingDataExport(bulkSession, fileResults) {
    const trainingData = {
      metadata: {
        sessionId: bulkSession.id,
        sessionName: bulkSession.sessionName,
        sourceLanguage: bulkSession.sourceLanguage,
        totalFiles: bulkSession.totalFiles,
        completedFiles: bulkSession.completedFiles,
        createdAt: bulkSession.createdAt,
        exportedAt: new Date().toISOString()
      },
      aggregateMetrics: {
        avgOverallScore: bulkSession.avgOverallScore,
        avgCallOpeningScore: bulkSession.avgCallOpeningScore,
        avgCallClosingScore: bulkSession.avgCallClosingScore,
        avgSpeakingQualityScore: bulkSession.avgSpeakingQualityScore,
        sentimentDistribution: {
          positive: bulkSession.positiveSentimentCount || 0,
          neutral: bulkSession.neutralSentimentCount || 0,
          negative: bulkSession.negativeSentimentCount || 0,
          positivePercentage: bulkSession.positiveSentimentPercentage || 0
        },
        topKeywords: bulkSession.topKeywords || [],
        batchSummary: bulkSession.batchSummary,
        recommendations: bulkSession.recommendations
      },
      trainingExamples: fileResults.map(result => ({
        // Input features
        fileName: result.fileName,
        fileSize: result.fileSize,
        processingTime: result.processingTime,
        
        // Text data for NLP training
        transcription: result.transcription || '',
        translation: result.translation || '',
        callSummary: result.callSummary || '',
        
        // Labels/targets for supervised learning
        overallScore: result.overallScore,
        callOpeningScore: result.callOpeningScore,
        callClosingScore: result.callClosingScore,
        speakingQualityScore: result.speakingQualityScore,
        
        // Sentiment analysis data
        customerSentiment: result.customerSentiment,
        customerSentimentScore: result.customerSentimentScore,
        customerSentimentJustification: result.customerSentimentJustification,
        agentSentiment: result.agentSentiment,
        agentSentimentScore: result.agentSentimentScore,
        agentSentimentJustification: result.agentSentimentJustification,
        
        // Detailed coaching analysis (structured data)
        callOpeningAnalysis: result.callOpeningAnalysis,
        callClosingAnalysis: result.callClosingAnalysis,
        speakingQualityAnalysis: result.speakingQualityAnalysis,
        
        // Keywords and metadata
        keywords: result.keywords || [],
        agentCoaching: result.agentCoaching || '',
        
        // Timestamps
        completedAt: result.completedAt,
        
        // Status for filtering
        status: result.status
      })).filter(example => example.status === 'completed'), // Only include successful analyses
      
      // Schema information for ML pipeline
      schema: {
        inputFeatures: [
          'transcription', 'translation', 'callSummary', 'keywords', 
          'fileSize', 'processingTime'
        ],
        targetLabels: [
          'overallScore', 'callOpeningScore', 'callClosingScore', 
          'speakingQualityScore', 'customerSentiment', 'agentSentiment'
        ],
        textFields: [
          'transcription', 'translation', 'callSummary', 'agentCoaching',
          'customerSentimentJustification', 'agentSentimentJustification'
        ],
        numericFields: [
          'overallScore', 'callOpeningScore', 'callClosingScore', 
          'speakingQualityScore', 'customerSentimentScore', 'agentSentimentScore',
          'fileSize', 'processingTime'
        ],
        categoricalFields: [
          'customerSentiment', 'agentSentiment', 'status'
        ]
      }
    };

    const fileName = `training_data_${bulkSession.id}_${Date.now()}.json`;
    const filePath = path.join(this.tempDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(trainingData, null, 2));
    return { filePath, fileName };
  }

  // Generate CSV format for training data
  async generateTrainingDataCSV(bulkSession, fileResults) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Training Data');
    
    // Define headers for ML training
    const headers = [
      'file_name', 'file_size', 'processing_time',
      'transcription', 'translation', 'call_summary', 'agent_coaching',
      'overall_score', 'call_opening_score', 'call_closing_score', 'speaking_quality_score',
      'customer_sentiment', 'customer_sentiment_score', 'customer_sentiment_justification',
      'agent_sentiment', 'agent_sentiment_score', 'agent_sentiment_justification',
      'keywords', 'completed_at', 'status'
    ];
    
    worksheet.addRow(headers);
    
    // Add data rows
    fileResults.filter(result => result.status === 'completed').forEach(result => {
      worksheet.addRow([
        result.fileName,
        result.fileSize,
        result.processingTime,
        result.transcription || '',
        result.translation || '',
        result.callSummary || '',
        result.agentCoaching || '',
        result.overallScore,
        result.callOpeningScore,
        result.callClosingScore,
        result.speakingQualityScore,
        result.customerSentiment,
        result.customerSentimentScore,
        result.customerSentimentJustification || '',
        result.agentSentiment,
        result.agentSentimentScore,
        result.agentSentimentJustification || '',
        Array.isArray(result.keywords) ? result.keywords.join(';') : '',
        result.completedAt,
        result.status
      ]);
    });
    
    const fileName = `training_data_${bulkSession.id}_${Date.now()}.csv`;
    const filePath = path.join(this.tempDir, fileName);
    
    await workbook.csv.writeFile(filePath);
    return { filePath, fileName };
  }

  // Generate comprehensive training dataset package
  async generateTrainingPackage(bulkSession, fileResults) {
    const zipFileName = `training_package_${bulkSession.id}_${Date.now()}.zip`;
    const zipFilePath = path.join(this.tempDir, zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.pipe(output);
    
    // Generate all training data formats
    const jsonFile = await this.generateTrainingDataExport(bulkSession, fileResults);
    const csvFile = await this.generateTrainingDataCSV(bulkSession, fileResults);
    
    // Add files to archive
    archive.file(jsonFile.filePath, { name: 'training_data.json' });
    archive.file(csvFile.filePath, { name: 'training_data.csv' });
    
    // Add metadata file
    const metadata = {
      description: 'BPO Call Quality Analysis Training Dataset',
      version: '1.0',
      generatedAt: new Date().toISOString(),
      sessionInfo: {
        id: bulkSession.id,
        name: bulkSession.sessionName,
        sourceLanguage: bulkSession.sourceLanguage,
        totalFiles: bulkSession.totalFiles,
        completedFiles: bulkSession.completedFiles
      },
      datasetStats: {
        totalExamples: fileResults.filter(r => r.status === 'completed').length,
        avgOverallScore: bulkSession.avgOverallScore,
        sentimentDistribution: {
          positive: bulkSession.positiveSentimentCount || 0,
          neutral: bulkSession.neutralSentimentCount || 0,
          negative: bulkSession.negativeSentimentCount || 0
        }
      },
      usage: {
        recommendation: 'Use this dataset for training call quality prediction models',
        inputFeatures: 'transcription, translation, call_summary, keywords',
        targetLabels: 'overall_score, sentiment scores, coaching scores',
        preprocessing: 'Text normalization and tokenization recommended for NLP features'
      }
    };
    
    archive.append(JSON.stringify(metadata, null, 2), { name: 'dataset_metadata.json' });
    
    // Add README for the training data
    const readme = `# BPO Call Quality Analysis Training Dataset

## Overview
This dataset contains analyzed call recordings with quality scores, sentiment analysis, and coaching feedback.

## Files
- \`training_data.json\`: Complete dataset in JSON format with nested structures
- \`training_data.csv\`: Flattened dataset in CSV format for easy ML pipeline integration
- \`dataset_metadata.json\`: Metadata and statistics about the dataset

## Data Schema

### Input Features (X)
- **transcription**: Raw transcribed text from audio
- **translation**: English translation (if source language != English)
- **call_summary**: AI-generated summary of the call
- **keywords**: Extracted key topics and terms
- **file_size**: Audio file size in bytes
- **processing_time**: Time taken to analyze the audio

### Target Labels (y)
- **overall_score**: Overall call quality score (0-10)
- **call_opening_score**: Quality of call opening (0-10)
- **call_closing_score**: Quality of call closing (0-10)
- **speaking_quality_score**: Agent speaking quality (0-10)
- **customer_sentiment**: Customer sentiment (POSITIVE/NEUTRAL/NEGATIVE)
- **agent_sentiment**: Agent sentiment (POSITIVE/NEUTRAL/NEGATIVE)

### Additional Data
- **sentiment_scores**: Numeric sentiment confidence scores
- **sentiment_justifications**: Explanations for sentiment classifications
- **coaching_analysis**: Detailed coaching feedback and recommendations

## Usage Examples

### Python - Load JSON Data
\`\`\`python
import json
import pandas as pd

with open('training_data.json', 'r') as f:
    data = json.load(f)

# Extract training examples
examples = data['trainingExamples']
df = pd.DataFrame(examples)
\`\`\`

### Python - Load CSV Data
\`\`\`python
import pandas as pd

df = pd.read_csv('training_data.csv')
X = df[['transcription', 'translation', 'call_summary']]
y = df['overall_score']
\`\`\`

## Model Training Suggestions
1. **Text Preprocessing**: Clean and tokenize text fields
2. **Feature Engineering**: Extract TF-IDF, word embeddings, or use transformer models
3. **Multi-task Learning**: Train on multiple quality scores simultaneously
4. **Sentiment Analysis**: Use sentiment data for auxiliary tasks
5. **Cross-validation**: Split by session or time to avoid data leakage

Generated on: ${new Date().toISOString()}
`;
    
    archive.append(readme, { name: 'README.md' });
    
    await archive.finalize();
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Clean up temporary files
        [jsonFile.filePath, csvFile.filePath].forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        
        resolve({ filePath: zipFilePath, fileName: zipFileName });
      });
      
      output.on('error', reject);
      archive.on('error', reject);
    });
  }

  // Clean up old temporary files
  cleanupTempFiles(maxAgeHours = 24) {
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();
    
    try {
      const files = fs.readdirSync(this.tempDir);
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

export const reportGenerator = new ReportGenerator();
