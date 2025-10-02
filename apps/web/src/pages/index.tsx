import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: NextPage = () => {
  const { user, loading, signOut } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <>
        <Head>
          <title>Finance Buddy - Loading...</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Finance Buddy...</p>
          </div>
        </div>
      </>
    );
  }

  // Unauthenticated homepage
  if (!user) {
    return (
      <>
        <Head>
          <title>Finance Buddy - Gmail Financial Email Automation</title>
          <meta name="description" content="Automate your financial email collection with Gmail OAuth integration" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Finance Buddy
              </h1>

              <p style={{
                fontSize: '1.25rem',
                color: '#6b7280',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Automate your financial email collection with secure Gmail OAuth integration.<br/>
                Sync, organize, and manage financial emails with advanced filtering and search.
              </p>

              {/* Sign In/Up Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                marginBottom: '3rem'
              }}>
                <a
                  href="/auth"
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.35)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.25)';
                  }}
                >
                  Sign In
                </a>

                <a
                  href="/auth"
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: 'white',
                    color: '#2563eb',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1.1rem',
                    border: '2px solid #2563eb',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Sign Up
                </a>
              </div>
            </div>

            {/* Features Section */}
            <div style={{
              background: '#f8fafc',
              padding: '2rem',
              borderRadius: '1rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ color: '#1f2937', marginBottom: '1.5rem', textAlign: 'center' }}>
                What you'll get with Finance Buddy
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Secure OAuth Integration</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Connect multiple Gmail accounts with industry-standard OAuth security
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Smart Email Sync</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Manual sync with date ranges, sender filters, and intelligent deduplication
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Advanced Search</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Powerful filtering and search capabilities for financial email management
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Admin Tools</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Comprehensive testing dashboard and system health monitoring
                  </p>
                </div>
              </div>
            </div>

            {/* Security & Privacy */}
            <div style={{
              background: '#ecfdf5',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1fae5'
            }}>
              <h3 style={{ color: '#065f46', marginBottom: '0.5rem' }}>🛡️ Security & Privacy</h3>
              <p style={{ color: '#047857', margin: 0, fontSize: '0.9rem' }}>
                Your data is protected with Row Level Security (RLS), secure cookie authentication,
                and OAuth-only access. We never store your Gmail passwords.
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Authenticated homepage
  return (
    <>
      <Head>
        <title>Finance Buddy - Gmail Financial Email Automation</title>
        <meta name="description" content="Finance Buddy connects Gmail accounts to automate financial email collection" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header with user info and sign out */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div>
              <h1 style={{ color: '#1f2937', marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                Finance Buddy
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                Welcome back, {user.email}
              </p>
            </div>
            <button
              onClick={signOut}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            >
              Sign Out
            </button>
          </div>

          <div style={{ 
            background: '#f5f5f5', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#333', marginBottom: '1rem' }}>L1 Features Implemented</h2>
            <ul style={{ color: '#555', lineHeight: '1.6' }}>
              <li>✅ Gmail OAuth integration with PKCE</li>
              <li>✅ Manual sync API with idempotency</li>
              <li>✅ Backfill orchestration with resumable jobs</li>
              <li>✅ Connection management (hard delete per ADR-06)</li>
              <li>✅ Read APIs with RLS enforcement</li>
              <li>✅ Secure cookie authentication (ADR-01)</li>
            </ul>
          </div>

          <div style={{ 
            background: '#e8f4fd', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#333', marginBottom: '1rem' }}>API Endpoints</h2>
            <div style={{ color: '#555', lineHeight: '1.6' }}>
              <p><strong>Gmail OAuth:</strong></p>
              <ul>
                <li><code>GET /api/gmail/connect</code> - Start OAuth flow</li>
                <li><code>GET /api/gmail/callback</code> - OAuth callback</li>
                <li><code>GET /api/gmail/connections</code> - List connections</li>
                <li><code>POST /api/gmail/disconnect</code> - Disconnect account</li>
              </ul>
              
              <p style={{ marginTop: '1rem' }}><strong>Sync & Search:</strong></p>
              <ul>
                <li><code>POST /api/gmail/manual-sync</code> - Manual email sync</li>
                <li><code>POST /api/gmail/backfill</code> - Backfill orchestration</li>
                <li><code>POST /api/emails/search</code> - Search emails</li>
                <li><code>POST /api/transactions/search</code> - Search transactions</li>
              </ul>
            </div>
          </div>

          <div style={{
            background: '#fff3cd',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ffeaa7',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: '#856404', marginBottom: '0.5rem' }}>Development Status</h3>
            <p style={{ color: '#856404', margin: 0 }}>
              Server is running on <strong>http://localhost:3000</strong><br/>
              All L1 APIs are implemented and ready for testing.
            </p>
          </div>

          <div style={{
            background: '#e8f4fd',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h2 style={{ color: '#333', marginBottom: '1rem' }}>User Interfaces</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <a
                href="/test"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#333',
                  border: '1px solid #ddd',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#2563eb' }}>🧪 Testing Dashboard</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Comprehensive testing interface for validating all L1 features
                </p>
              </a>

              <a
                href="/admin"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#333',
                  border: '1px solid #ddd',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>⚙️ Admin Dashboard</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Manage Gmail connections and monitor system health
                </p>
              </a>

              <a
                href="/emails"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#333',
                  border: '1px solid #ddd',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>📧 Email Management</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Review and manage Gmail emails with filtering and search
                </p>
              </a>

              <a
                href="/transactions"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: '#333',
                  border: '1px solid #ddd',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#7c3aed' }}>💰 Transaction Management</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Review extracted financial transactions (L2+ ready)
                </p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default HomePage;
