import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MockAIContextType {
  mockAIEnabled: boolean;
  toggleMockAI: () => Promise<void>;
  loading: boolean;
}

const MockAIContext = createContext<MockAIContextType | undefined>(undefined);

export function MockAIProvider({ children }: { children: ReactNode }) {
  // Initialize from server (database) - no localStorage needed
  const [mockAIEnabled, setMockAIEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user's mock AI preference from server on mount
  useEffect(() => {
    fetchMockAIStatus();
  }, []);

  const fetchMockAIStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mock-ai');

      // Handle unauthenticated state (401)
      if (response.status === 401) {
        // User not logged in - default to false (real AI)
        setMockAIEnabled(false);
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const serverEnabled = data.mockAI.enabled;
        setMockAIEnabled(serverEnabled);
        console.log(`[MockAI] Loaded user preference from database: ${serverEnabled}`);
      } else {
        // Other errors - default to false (real AI)
        console.error(`[MockAI] Failed to fetch status: ${response.status}`);
        setMockAIEnabled(false);
      }
    } catch (error) {
      console.error('[MockAI] Failed to fetch mock AI status:', error);
      // Default to false (real AI) on error
      setMockAIEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleMockAI = async () => {
    setLoading(true);
    try {
      // Optimistic update for instant UI feedback
      const newValue = !mockAIEnabled;
      setMockAIEnabled(newValue);

      // Update server (database)
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
        setMockAIEnabled(mockAIEnabled);
        throw new Error('Failed to update mock AI preference');
      }

      const data = await response.json();
      // Update with server's confirmed state
      setMockAIEnabled(data.mockAI.enabled);
      console.log(`[MockAI] Toggled to: ${data.mockAI.enabled}`);
    } catch (error) {
      console.error('Mock AI toggle error:', error);
      // Revert on error
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

