import { useState, useEffect } from 'react';
import { requestNotificationPermission, getNotificationPermission } from '@/lib/push-notifications';

export default function NotificationPermissionPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);
    
    // Show prompt if permission is default (not asked yet)
    if (currentPermission === 'default') {
      // Wait 3 seconds before showing prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Don't show if already dismissed in this session
  if (sessionStorage.getItem('notification-prompt-dismissed')) {
    return null;
  }

  // Don't show if permission already granted or denied
  if (permission !== 'default' || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-[#1a1625] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[#2d1b4e] p-6 animate-slide-up">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-[var(--radius-lg)] flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-1">
              Enable Notifications
            </h3>
            <p className="text-sm text-[#cbd5e1] mb-4">
              Get instant alerts when new transactions are detected from your emails.
            </p>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[var(--radius-lg)] hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-[var(--shadow-lg)] shadow-blue-500/30"
              >
                Enable
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-[#cbd5e1] hover:text-[#f8fafc] font-medium"
              >
                Not now
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-[#cbd5e1]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

