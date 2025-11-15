import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MockAIContextType {
  mockAIEnabled: boolean;
  toggleMockAI: () => Promise<void>;
  loading: boolean;
}

const MockAIContext = createContext<MockAIContextType | undefined>(undefined);

export function MockAIProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage to persist across page reloads
  const [mockAIEnabled, setMockAIEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mockAIEnabled');
      return stored === 'true';
    }
    return false;
  });
  const [loading, setLoading] = useState(false);

  // Sync with server on mount and update server if localStorage differs
  useEffect(() => {
    syncWithServer();
  }, []);

  const syncWithServer = async () => {
    try {
      const response = await fetch('/api/admin/mock-ai');
      if (response.ok) {
        const data = await response.json();
        const serverEnabled = data.mockAI.enabled;

        // If localStorage differs from server, update server to match localStorage
        if (serverEnabled !== mockAIEnabled) {
          console.log(`[MockAI] Syncing localStorage (${mockAIEnabled}) to server (was ${serverEnabled})`);
          await fetch('/api/admin/mock-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: mockAIEnabled ? 'enable' : 'disable' }),
          });
        }
      }
    } catch (error) {
      console.error('Failed to sync mock AI status:', error);
    }
  };

  const toggleMockAI = async () => {
    setLoading(true);
    try {
      const newValue = !mockAIEnabled;

      // Update localStorage immediately for instant UI feedback
      localStorage.setItem('mockAIEnabled', String(newValue));
      setMockAIEnabled(newValue);

      // Sync with server in background
      const response = await fetch('/api/admin/mock-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle'
        }),
      });

      if (!response.ok) {
        console.error('Failed to toggle mock AI on server');
        // Revert on failure
        localStorage.setItem('mockAIEnabled', String(mockAIEnabled));
        setMockAIEnabled(mockAIEnabled);
      }
    } catch (error) {
      console.error('Mock AI toggle error:', error);
      // Revert on error
      localStorage.setItem('mockAIEnabled', String(mockAIEnabled));
      setMockAIEnabled(mockAIEnabled);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MockAIContext.Provider value={{ mockAIEnabled, toggleMockAI, loading }}>
      {children}
    </MockAIContext.Provider>
  );
}

export function useMockAI() {
  const context = useContext(MockAIContext);
  if (context === undefined) {
    throw new Error('useMockAI must be used within a MockAIProvider');
  }
  return context;
}

