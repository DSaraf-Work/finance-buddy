import React from 'react';

export const ReportStyles = () => (
  <style jsx global>{`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-16px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .report-card {
      animation: slideUp 0.35s ease-out backwards;
    }

    .report-card:nth-child(1) {
      animation-delay: 0.05s;
    }

    .report-card:nth-child(2) {
      animation-delay: 0.1s;
    }

    .report-card:nth-child(3) {
      animation-delay: 0.15s;
    }

    .report-card:nth-child(4) {
      animation-delay: 0.2s;
    }

    .chart-section {
      animation: fadeIn 0.5s ease-out backwards;
      animation-delay: 0.3s;
    }

    .table-section {
      animation: fadeIn 0.5s ease-out backwards;
      animation-delay: 0.4s;
    }

    .filter-chip {
      animation: slideIn 0.25s ease-out backwards;
    }

    .export-button {
      transition: all 0.2s ease-out;
    }

    .export-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    /* Custom scrollbar for tables */
    .data-table-wrapper::-webkit-scrollbar {
      height: 8px;
      width: 8px;
    }

    .data-table-wrapper::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 4px;
    }

    .data-table-wrapper::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .data-table-wrapper::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    /* Date input styling */
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.7);
      cursor: pointer;
    }

    input[type="date"]::-webkit-calendar-picker-indicator:hover {
      filter: invert(0.8);
    }
  `}</style>
);