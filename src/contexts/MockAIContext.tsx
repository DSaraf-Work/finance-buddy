import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MockAIContextType {
  mockAIEnabled: boolean;
  toggleMockAI: () => Promise<void>;
  loading: boolean;
}

const MockAIContext = createContext<MockAIContextType | undefined>(undefined);

export function MockAIProvider({ children }: { children: ReactNode }) {
  const [mockAIEnabled, setMockAIEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial Mock AI status
  useEffect(() => {
    fetchMockAIStatus();
  }, []);

  const fetchMockAIStatus = async () => {
    try {
      const response = await fetch('/api/admin/mock-ai');
      if (response.ok) {
        const data = await response.json();
        setMockAIEnabled(data.mockAI.enabled);
      }
    } catch (error) {
      console.error('Failed to fetch mock AI status:', error);
    }
  };

  const toggleMockAI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/mock-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMockAIEnabled(data.mockAI.enabled);
      } else {
        console.error('Failed to toggle mock AI');
      }
    } catch (error) {
      console.error('Mock AI toggle error:', error);
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

