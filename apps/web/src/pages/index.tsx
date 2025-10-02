import { NextPage } from 'next';
import Head from 'next/head';

const HomePage: NextPage = () => {
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
          <h1 style={{ color: '#333', marginBottom: '1rem' }}>
            Finance Buddy
          </h1>
          
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
            Gmail financial email automation system with OAuth integration and manual sync capabilities.
          </p>

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
