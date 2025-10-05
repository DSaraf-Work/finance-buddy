import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { MockAIProvider } from '@/contexts/MockAIContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <MockAIProvider>
        <Component {...pageProps} />
      </MockAIProvider>
    </AuthProvider>
  );
}
