/**
 * Transaction Styles Component
 * Contains CSS animations and styles matching /txn design
 */
export const TxnStyles = () => (
  <style>{`
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-16px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .transaction-item {
      animation: slideIn 0.35s ease-out backwards;
    }
    .transaction-item:hover {
      background: rgba(255,255,255,0.02) !important;
    }
  `}</style>
);
