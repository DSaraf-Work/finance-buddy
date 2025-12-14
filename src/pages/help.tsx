import { NextPage } from 'next';
import { useState } from 'react';
import { Layout } from '@/components/Layout';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const tabs = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'gmail-setup', name: 'Gmail Setup', icon: '📧' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
    { id: 'api-docs', name: 'API Documentation', icon: '📚' },
    { id: 'faq', name: 'FAQ', icon: '❓' },
  ];

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I connect my Gmail account?',
      answer: 'Go to the Admin Dashboard and click "Connect Gmail Account". You\'ll be redirected to Google\'s OAuth flow where you can authorize Finance Buddy to access your Gmail account.',
      category: 'gmail-setup'
    },
    {
      id: '2',
      question: 'Is my Gmail data secure?',
      answer: 'Yes! Finance Buddy uses OAuth-only access (no passwords stored), Row Level Security (RLS), and secure cookie authentication. We never store your Gmail passwords.',
      category: 'security'
    },
    {
      id: '3',
      question: 'How often does Finance Buddy sync my emails?',
      answer: 'Currently, Finance Buddy uses manual sync only. You can trigger syncs from the Admin Dashboard or via the API. Automatic syncing will be available in future versions.',
      category: 'sync'
    },
    {
      id: '4',
      question: 'What happens if I disconnect my Gmail account?',
      answer: 'When you disconnect, the OAuth tokens are revoked and the connection is deleted. However, your previously synced emails and transactions remain in the database for your reference.',
      category: 'gmail-setup'
    },
    {
      id: '5',
      question: 'Can I connect multiple Gmail accounts?',
      answer: 'Yes! You can connect multiple Gmail accounts to the same Finance Buddy account. Each account will be synced and managed separately.',
      category: 'gmail-setup'
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const renderGettingStarted = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc] mb-4">Welcome to Finance Buddy</h2>
        <p className="text-[#cbd5e1] mb-6">
          Finance Buddy helps you automate the collection and management of financial emails from your Gmail accounts.
          Follow these steps to get started:
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-[#6b4ce6] text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-[#f8fafc]">Create Your Account</h3>
            <p className="text-[#cbd5e1]">
              Sign up with your email address and create a secure password. Your account will be protected with industry-standard security measures.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-[#6b4ce6] text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-[#f8fafc]">Connect Your Gmail Account</h3>
            <p className="text-[#cbd5e1]">
              Navigate to the Admin Dashboard and click "Connect Gmail Account". You'll be securely redirected to Google's authorization page.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-[#6b4ce6] text-white rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-[#f8fafc]">Sync Your Emails</h3>
            <p className="text-[#cbd5e1]">
              Once connected, you can manually sync emails by specifying date ranges and optional sender filters.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-[#6b4ce6] text-white rounded-full flex items-center justify-center text-sm font-medium">
            4
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-[#f8fafc]">Review and Manage</h3>
            <p className="text-[#cbd5e1]">
              Use the Email Management and Transaction pages to review, search, and manage your financial data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGmailSetup = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc] mb-4">Gmail Setup Guide</h2>
        <p className="text-[#cbd5e1] mb-6">
          Learn how to properly connect and configure your Gmail accounts with Finance Buddy.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">🔐 Security First</h3>
        <p className="text-blue-800">
          Finance Buddy uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for maximum security. 
          We never see or store your Gmail password.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[#f8fafc] mb-3">Required Permissions</h3>
          <p className="text-[#cbd5e1] mb-4">
            Finance Buddy requests the following Gmail permissions:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[#cbd5e1]">
            <li><code>gmail.readonly</code> - Read access to your Gmail messages</li>
            <li><code>gmail.metadata</code> - Access to email metadata (headers, labels)</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium text-[#f8fafc] mb-3">Connection Process</h3>
          <ol className="list-decimal list-inside space-y-2 text-[#cbd5e1]">
            <li>Click "Connect Gmail Account" in the Admin Dashboard</li>
            <li>You'll be redirected to Google's authorization page</li>
            <li>Review and accept the requested permissions</li>
            <li>You'll be redirected back to Finance Buddy</li>
            <li>Your account is now connected and ready for syncing</li>
          </ol>
        </div>

        <div>
          <h3 className="text-lg font-medium text-[#f8fafc] mb-3">Managing Multiple Accounts</h3>
          <p className="text-[#cbd5e1]">
            You can connect multiple Gmail accounts to the same Finance Buddy account. Each account will be managed separately with its own sync settings and data.
          </p>
        </div>
      </div>
    </div>
  );

  const renderTroubleshooting = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc] mb-4">Troubleshooting</h2>
        <p className="text-[#cbd5e1] mb-6">
          Common issues and their solutions.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-2">🚨 Connection Failed</h3>
          <p className="text-[#ef4444] mb-3">
            If your Gmail connection fails, try these steps:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#ef4444]">
            <li>Clear your browser cache and cookies</li>
            <li>Try connecting in an incognito/private browser window</li>
            <li>Ensure you're signed into the correct Google account</li>
            <li>Check that you've accepted all required permissions</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">⚠️ Sync Issues</h3>
          <p className="text-yellow-800 mb-3">
            If email syncing isn't working properly:
          </p>
          <ul className="list-disc list-inside space-y-1 text-yellow-800">
            <li>Check your date range - ensure it's not too large</li>
            <li>Verify your Gmail account has emails in the specified date range</li>
            <li>Try syncing a smaller date range first</li>
            <li>Check the Admin Dashboard for any error messages</li>
          </ul>
        </div>

        <div className="bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-lg p-6">
          <h3 className="text-lg font-medium text-[#f8fafc] mb-2">🔍 No Emails Found</h3>
          <p className="text-[#cbd5e1] mb-3">
            If no emails are being synced:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#cbd5e1]">
            <li>Verify the date range includes periods when you received emails</li>
            <li>Check if sender filters are too restrictive</li>
            <li>Ensure your Gmail account has financial emails (bank statements, receipts, etc.)</li>
            <li>Try removing all filters and syncing a recent date range</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderAPIDocumentation = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc] mb-4">API Documentation</h2>
        <p className="text-[#cbd5e1] mb-6">
          Finance Buddy provides RESTful APIs for programmatic access to your data.
        </p>
      </div>

      <div className="bg-[#0f0a1a]/50 border border-[#2d1b4e] rounded-lg p-6">
        <h3 className="text-lg font-medium text-[#f8fafc] mb-3">Authentication</h3>
        <p className="text-[#cbd5e1] mb-3">
          All API requests require authentication via session cookies. Make sure you're signed in to Finance Buddy.
        </p>
        <div className="bg-gray-800 text-gray-100 p-4 rounded font-mono text-sm">
          <div>Cookie: fb-access-token=your-token-here</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-[#f8fafc] mb-3">Gmail Endpoints</h3>
          <div className="space-y-4">
            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-[#10b981]/10 text-[#10b981] px-2 py-1 rounded text-sm font-medium mr-3">GET</span>
                <code className="text-sm">/api/gmail/connections</code>
              </div>
              <p className="text-[#cbd5e1] text-sm">List all connected Gmail accounts</p>
            </div>

            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">POST</span>
                <code className="text-sm">/api/gmail/manual-sync</code>
              </div>
              <p className="text-[#cbd5e1] text-sm">Trigger manual email sync for a specific date range</p>
            </div>

            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-[#ef4444]/10 text-[#ef4444] px-2 py-1 rounded text-sm font-medium mr-3">POST</span>
                <code className="text-sm">/api/gmail/disconnect</code>
              </div>
              <p className="text-[#cbd5e1] text-sm">Disconnect a Gmail account</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-[#f8fafc] mb-3">Search Endpoints</h3>
          <div className="space-y-4">
            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">POST</span>
                <code className="text-sm">/api/emails/search</code>
              </div>
              <p className="text-[#cbd5e1] text-sm">Search and filter emails with pagination</p>
            </div>

            <div className="border border-[#2d1b4e] rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">POST</span>
                <code className="text-sm">/api/transactions/search</code>
              </div>
              <p className="text-[#cbd5e1] text-sm">Search and filter extracted transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#f8fafc] mb-4">Frequently Asked Questions</h2>
        <p className="text-[#cbd5e1] mb-6">
          Find answers to common questions about Finance Buddy.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="border border-[#2d1b4e] rounded-lg">
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
            >
              <span className="font-medium text-[#f8fafc]">{faq.question}</span>
              <span className="text-gray-400">
                {expandedFAQ === faq.id ? '−' : '+'}
              </span>
            </button>
            {expandedFAQ === faq.id && (
              <div className="px-6 pb-4">
                <p className="text-[#cbd5e1]">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'getting-started':
        return renderGettingStarted();
      case 'gmail-setup':
        return renderGmailSetup();
      case 'troubleshooting':
        return renderTroubleshooting();
      case 'api-docs':
        return renderAPIDocumentation();
      case 'faq':
        return renderFAQ();
      default:
        return renderGettingStarted();
    }
  };

  return (
    <Layout title="Help & Documentation - Finance Buddy" description="Help and documentation for Finance Buddy">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#f8fafc]">Help & Documentation</h1>
            <p className="mt-1 text-sm text-gray-500">
              Everything you need to know about using Finance Buddy
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[#1a1625] shadow rounded-lg p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HelpPage;
