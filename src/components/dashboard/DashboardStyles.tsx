import React from 'react';

export const DashboardStyles = () => (
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

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .dashboard-card {
      animation: slideUp 0.35s ease-out backwards;
    }

    .dashboard-card:nth-child(1) {
      animation-delay: 0.05s;
    }

    .dashboard-card:nth-child(2) {
      animation-delay: 0.1s;
    }

    .dashboard-card:nth-child(3) {
      animation-delay: 0.15s;
    }

    .quick-action-item {
      animation: slideIn 0.35s ease-out backwards;
    }

    .quick-action-item:nth-child(1) {
      animation-delay: 0.2s;
    }

    .quick-action-item:nth-child(2) {
      animation-delay: 0.25s;
    }

    .quick-action-item:nth-child(3) {
      animation-delay: 0.3s;
    }

    .quick-action-item:nth-child(4) {
      animation-delay: 0.35s;
    }

    .quick-action-item:nth-child(5) {
      animation-delay: 0.4s;
    }

    .feature-card {
      animation: slideUp 0.35s ease-out backwards;
    }

    .feature-card:nth-child(1) {
      animation-delay: 0.45s;
    }

    .feature-card:nth-child(2) {
      animation-delay: 0.5s;
    }

    .feature-card:nth-child(3) {
      animation-delay: 0.55s;
    }

    .feature-card:nth-child(4) {
      animation-delay: 0.6s;
    }

    .feature-card:nth-child(5) {
      animation-delay: 0.65s;
    }

    .feature-card:nth-child(6) {
      animation-delay: 0.7s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      transition: all 0.2s ease-out;
    }

    .quick-action-item:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }

    .connection-item:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }
  `}</style>
);