import React, { useState } from 'react';
import { FiDownload, FiFileText, FiFile, FiImage } from 'react-icons/fi';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ExportControls = ({ data, chartRefs = [] }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Convert data to CSV format
      const csvData = convertToCSV(data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Export to CSV failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;

      // Add title
      pdf.setFontSize(20);
      pdf.text('Analytics Dashboard Report', 20, yPosition);
      yPosition += 20;

      // Add date
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 20;

      // Convert charts to images and add to PDF
      for (let i = 0; i < chartRefs.length; i++) {
        const ref = chartRefs[i];
        if (ref && ref.current) {
          try {
            const canvas = await html2canvas(ref.current, {
              backgroundColor: '#ffffff',
              scale: 2,
            });
            const imgData = canvas.toDataURL('image/png');

            // Check if we need a new page
            if (yPosition + 100 > 280) {
              pdf.addPage();
              yPosition = 20;
            }

            // Add chart title
            pdf.setFontSize(14);
            pdf.text(`Chart ${i + 1}`, 20, yPosition);
            yPosition += 10;

            // Add image
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 20;
          } catch (error) {
            console.error(`Failed to capture chart ${i}:`, error);
          }
        }
      }

      // Add summary data
      if (yPosition + 60 > 280) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Summary Data', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      const summaryData = generateSummaryData(data);
      summaryData.forEach(line => {
        pdf.text(line, 20, yPosition);
        yPosition += 8;
      });

      pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Export to PDF failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    setIsExporting(true);
    try {
      // Create a container for all charts
      const container = document.createElement('div');
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '20px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '20px';

      // Clone and append all chart elements
      chartRefs.forEach((ref, index) => {
        if (ref && ref.current) {
          const clone = ref.current.cloneNode(true);
          const title = document.createElement('h3');
          title.textContent = `Chart ${index + 1}`;
          title.style.color = '#000000';
          title.style.marginBottom = '10px';
          title.style.fontSize = '16px';
          title.style.fontWeight = 'bold';

          const chartContainer = document.createElement('div');
          chartContainer.appendChild(title);
          chartContainer.appendChild(clone);
          container.appendChild(chartContainer);
        }
      });

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 1200,
        height: container.scrollHeight,
      });

      document.body.removeChild(container);

      const link = document.createElement('a');
      link.download = `analytics-dashboard-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export to image failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data) => {
    if (!data) return '';

    const rows = [];

    // Add headers
    if (data.flowMetrics) {
      rows.push(['Flow Metrics']);
      rows.push(['Metric', 'Value']);
      rows.push(['Throughput', data.flowMetrics.throughput?.reduce((acc, t) => acc + t.count, 0) || 0]);
      rows.push(['Average Cycle Time', data.flowMetrics.cycleTime?.average || 0]);
      rows.push(['Average Lead Time', data.flowMetrics.leadTime?.average || 0]);
      rows.push([]);
    }

    if (data.wipAnalysis) {
      rows.push(['WIP Analysis']);
      rows.push(['Task', 'Age (days)']);
      data.wipAnalysis.wipAging?.forEach(item => {
        rows.push([item.name, item.age]);
      });
      rows.push([]);
    }

    if (data.blockerAnalysis) {
      rows.push(['Blocker Analysis']);
      rows.push(['Keyword', 'Frequency']);
      data.blockerAnalysis.blockerKeywords?.forEach(item => {
        rows.push([item.text, item.value]);
      });
      rows.push([]);
    }

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const generateSummaryData = (data) => {
    const summary = [];

    if (data.flowMetrics) {
      summary.push(`Total Throughput: ${data.flowMetrics.throughput?.reduce((acc, t) => acc + t.count, 0) || 0} tasks`);
      summary.push(`Average Cycle Time: ${data.flowMetrics.cycleTime?.average || 0} days`);
      summary.push(`Average Lead Time: ${data.flowMetrics.leadTime?.average || 0} days`);
    }

    if (data.wipAnalysis) {
      summary.push(`Tasks in Progress: ${data.wipAnalysis.wipAging?.length || 0}`);
      const oldestTask = data.wipAnalysis.wipAging?.[0];
      if (oldestTask) {
        summary.push(`Oldest WIP Task: ${oldestTask.name} (${oldestTask.age} days)`);
      }
    }

    if (data.blockerAnalysis) {
      summary.push(`Total Blockers: ${data.blockerAnalysis.blockerTrend?.reduce((acc, t) => acc + t.count, 0) || 0}`);
      const topKeyword = data.blockerAnalysis.blockerKeywords?.[0];
      if (topKeyword) {
        summary.push(`Top Blocker Theme: ${topKeyword.text} (${topKeyword.value} mentions)`);
      }
    }

    return summary;
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Export:</span>

      <motion.button
        onClick={exportToCSV}
        disabled={isExporting}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={!isExporting ? { scale: 1.05 } : {}}
        whileTap={!isExporting ? { scale: 0.95 } : {}}
      >
        <FiFile className="mr-2" />
        CSV
      </motion.button>

      <motion.button
        onClick={exportToPDF}
        disabled={isExporting}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={!isExporting ? { scale: 1.05 } : {}}
        whileTap={!isExporting ? { scale: 0.95 } : {}}
      >
        <FiFileText className="mr-2" />
        PDF
      </motion.button>

      <motion.button
        onClick={exportToImage}
        disabled={isExporting}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={!isExporting ? { scale: 1.05 } : {}}
        whileTap={!isExporting ? { scale: 0.95 } : {}}
      >
        <FiImage className="mr-2" />
        PNG
      </motion.button>

      {isExporting && (
        <div className="flex items-center text-sm text-blue-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          Exporting...
        </div>
      )}
    </div>
  );
};

export default ExportControls;