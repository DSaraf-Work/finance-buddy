import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useMockAI } from '@/contexts/MockAIContext';
import NotificationBell from './NotificationBell';
import NotificationPermissionPrompt from './NotificationPermissionPrompt';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAInstallButton from './PWAInstallButton';
import { useNotifications } from '@/hooks/useNotifications';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  pageTitle?: string;
  pageIcon?: string;
  headerActions?: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: '🏠', description: 'Overview and quick actions' },
  { name: 'Admin', href: '/admin', icon: '⚙️', description: 'Gmail connections and system health' },
  { name: 'Gmail Pub/Sub', href: '/admin/gmail-pub-sub', icon: '🔔', description: 'Real-time notifications dashboard' },
  { name: 'Emails', href: '/emails', icon: '📧', description: 'Email management and search' },
  { name: 'Rejected', href: '/rejected-emails', icon: '🚫', description: 'Manage rejected emails' },
  { name: 'Transactions', href: '/transactions', icon: '💰', description: 'Transaction review and analysis' },
  { name: 'Review Route', href: '/review_route', icon: '✅', description: 'Review and manage extracted transactions' },
  { name: 'Reports', href: '/reports', icon: '📊', description: 'Analytics and insights' },
  { name: 'Settings', href: '/settings', icon: '⚙️', description: 'User preferences and account' },
];

const dbNavigation: NavItem[] = [
  { name: 'Email Workbench', href: '/db/fb_emails', icon: '🔧', description: 'Advanced email management' },
  { name: 'Transaction Workbench', href: '/db/fb_extracted_transactions', icon: '🔧', description: 'Advanced transaction review' },
];

export function Layout({ children, title, description, pageTitle: pageTitleProp, pageIcon, headerActions }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { mockAIEnabled, toggleMockAI, loading } = useMockAI();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Initialize push notifications
  const { permissionGranted } = useNotifications();

  useEffect(() => {
    console.log('[Layout] Push notifications initialized. Permission:', permissionGranted);
  }, [permissionGranted]);

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  const getBreadcrumbs = () => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', href: '/' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable name
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === TABLE_EMAILS_FETCHED) name = 'Email Workbench';
      if (segment === TABLE_EMAILS_PROCESSED) name = 'Transaction Workbench';
      if (segment === 'rejected-emails') name = 'Rejected Emails';
      if (segment === 'db') name = 'Database';
      
      breadcrumbs.push({ name, href: currentPath });
    });

    return breadcrumbs;
  };

  const pageTitle = title || 'Finance Buddy';
  const pageDescription = description || 'Gmail Financial Email Automation';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#09090B]">
        {/* Navigation Header - Matte Dark Theme (matching /txn) */}
        <nav className="sticky top-0 z-50 bg-[#111113]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="flex justify-between items-center h-[72px]">
              {/* Logo and primary navigation */}
              <div className="flex items-center gap-3 lg:gap-6 min-w-0 flex-1">
                <div className="flex-shrink-0 flex items-center">
                  <Link
                    href="/"
                    className="group flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113] rounded-xl transition-all duration-200"
                    aria-label="Finance Buddy Home"
                  >
                    {/* Logo Icon - 40x40, borderRadius 12px, gradient with glow */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)] transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      <span className="text-xl font-bold text-[#FAFAFA]">₹</span>
                    </div>
                    {/* App Name - hidden on mobile when on an inner page (title takes its place) */}
                    <span
                      className={`text-lg font-bold text-[#FAFAFA] group-hover:text-[#A5B4FC] transition-colors duration-200 ${pageTitleProp && router.pathname !== '/' ? 'hidden' : 'hidden sm:inline'}`}
                      style={{ letterSpacing: '-0.3px' }}
                    >
                      Finance Buddy
                    </span>
                  </Link>
                </div>

                {/* Page title in nav — mobile only, non-home pages */}
                {pageTitleProp && router.pathname !== '/' && (
                  <span
                    className="lg:hidden text-[15px] font-semibold text-foreground truncate"
                    style={{ letterSpacing: '-0.1px' }}
                  >
                    {pageTitleProp}
                  </span>
                )}

                {/* Desktop navigation dropdown */}
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113]"
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'rgba(255,255,255,0.6)'
                    }}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="Navigation menu"
                  >
                    <span className="mr-2 text-lg" aria-hidden="true">
                      {navigation.find(item => isActive(item.href))?.icon || '📍'}
                    </span>
                    <span className="hidden xl:inline font-medium">
                      {navigation.find(item => isActive(item.href))?.name || 'Navigate'}
                    </span>
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDropdownOpen(false)}
                        aria-hidden="true"
                      ></div>

                      {/* Dropdown content - Matte Dark */}
                      <div
                        className="absolute left-0 mt-3 w-80 rounded-2xl shadow-xl z-20 animate-fade-in-down overflow-hidden"
                        style={{
                          background: '#1A1A1C',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="py-2">
                          {navigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`block px-4 py-3 text-sm transition-all duration-200 focus:outline-none border-l-4 ${
                                isActive(item.href)
                                  ? 'border-[#6366F1] text-[#A5B4FC]'
                                  : 'border-transparent text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.9)]'
                              }`}
                              style={{
                                background: isActive(item.href) ? 'rgba(99,102,241,0.1)' : 'transparent'
                              }}
                              onClick={() => setDropdownOpen(false)}
                              role="menuitem"
                            >
                              <div className="flex items-start">
                                <span className="text-xl mr-3 flex-shrink-0" aria-hidden="true">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* User menu - Matte Dark (matching /txn) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {user && (
                  <>
                    {/* Mock AI Toggle - Hidden on small mobile */}
                    <button
                      onClick={toggleMockAI}
                      disabled={loading}
                      className={`hidden sm:inline-flex items-center px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 min-h-[40px] border ${
                        mockAIEnabled
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/20'
                          : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30 hover:bg-[#22C55E]/20'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113]`}
                      title={mockAIEnabled ? 'Mock AI: ON (Click to use Real AI)' : 'Mock AI: OFF (Click to use Mock AI)'}
                      aria-label={mockAIEnabled ? 'Switch to Real AI' : 'Switch to Mock AI'}
                    >
                      <span className="mr-1.5" aria-hidden="true">{mockAIEnabled ? '🤖' : '🧠'}</span>
                      <span className="hidden lg:inline font-medium">{mockAIEnabled ? 'Mock' : 'Real'}</span>
                    </button>

                    {/* Notification Bell - 40x40, borderRadius 12px (matching /txn) */}
                    <button
                      className="notif-btn w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.6)',
                        border: 'none'
                      }}
                      aria-label="Notifications"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Sync Button - height 32px, px 12px, borderRadius 16px (matching /txn) */}
                    <button
                      className="sync-btn hidden sm:flex items-center justify-center transition-all duration-200"
                      style={{
                        height: '32px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#A5B4FC'
                      }}
                      aria-label="Sync"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 01-9 9m0 0a9 9 0 01-9-9m9 9V3m0 0l3 3m-3-3l-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* PWA Install Button */}
                    <div className="flex-shrink-0 hidden md:block">
                      <PWAInstallButton />
                    </div>

                    {/* User email - Hidden on mobile */}
                    <div
                      className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <svg className="w-4 h-4 text-[#22C55E] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm max-w-[150px] truncate font-medium" style={{ color: 'rgba(255,255,255,0.6)' }} title={user.email}>
                        {user.email}
                      </span>
                    </div>

                    {/* Sign Out - Hidden on mobile */}
                    <button
                      onClick={signOut}
                      className="hidden lg:inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113] min-h-[40px] font-medium"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                      aria-label="Sign out"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </>
                )}

                {/* Page-level actions — shown in nav on mobile */}
                {headerActions && (
                  <div className="lg:hidden flex items-center gap-2">
                    {headerActions}
                  </div>
                )}

                {/* Menu Button - 44x44, borderRadius 14px, gap 4px (matching /txn) */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="menu-btn lg:hidden flex flex-col items-start justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113]"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    gap: '4px',
                    padding: '12px'
                  }}
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                  {mobileMenuOpen ? (
                    <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <>
                      {/* Menu lines - 18px, 18px, 14px width, 2px height */}
                      <span style={{ width: '18px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }} />
                      <span style={{ width: '18px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }} />
                      <span style={{ width: '14px', height: '2px', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu - Matte Dark (matching /txn) */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#111113] animate-fade-in-down shadow-xl" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* User info section - Mobile only */}
              {user && (
                <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
                        <span className="text-lg">👤</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Account</p>
                        <p className="text-sm font-medium text-[#FAFAFA] truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={signOut}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113]"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.6)'
                      }}
                      aria-label="Sign out"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>

                  {/* Mock AI Toggle - Mobile */}
                  <div className="mt-3 sm:hidden">
                    <button
                      onClick={toggleMockAI}
                      disabled={loading}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] border ${
                        mockAIEnabled
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/20'
                          : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30 hover:bg-[#22C55E]/20'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-offset-2 focus:ring-offset-[#111113]`}
                      aria-label={mockAIEnabled ? 'Switch to Real AI' : 'Switch to Mock AI'}
                    >
                      <span className="text-lg" aria-hidden="true">{mockAIEnabled ? '🤖' : '🧠'}</span>
                      <span>{mockAIEnabled ? 'Using Mock AI' : 'Using Real AI'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation items */}
              <div className="py-3 px-3 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-3.5 rounded-xl text-base transition-all duration-200 focus:outline-none min-h-[44px]"
                    style={{
                      background: isActive(item.href) ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: isActive(item.href) ? '#A5B4FC' : 'rgba(255,255,255,0.6)'
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <span className="text-xl mr-3 flex-shrink-0 w-6 text-center" aria-hidden="true">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isActive(item.href) && (
                        <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: '#6366F1' }}></div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Page Header - desktop only (mobile shows title + actions in nav) */}
        {router.pathname !== '/' && (
          <div className="hidden lg:block bg-[#0D0D0F]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                {/* Page Icon */}
                {pageIcon && (
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.08) 100%)',
                      boxShadow: '0 0 20px rgba(99,102,241,0.15)'
                    }}
                  >
                    <span className="text-xl sm:text-2xl">{pageIcon}</span>
                  </div>
                )}

                {/* Title and Breadcrumbs */}
                <div className="flex-1 min-w-0">
                  {pageTitleProp && (
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                      {pageTitleProp}
                    </h1>
                  )}
                  {/* Breadcrumb navigation */}
                  <div className="flex items-center gap-1.5 text-xs mt-1">
                    {getBreadcrumbs().map((crumb, index) => (
                      <React.Fragment key={crumb.href}>
                        {index > 0 && (
                          <svg className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <Link
                          href={crumb.href}
                          className="transition-colors duration-200 hover:text-primary"
                          style={{
                            color: index === getBreadcrumbs().length - 1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)'
                          }}
                        >
                          {crumb.name}
                        </Link>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Page-level actions (e.g. filter, add) */}
                {headerActions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Notification Permission Prompt */}
        {user && <NotificationPermissionPrompt />}

        {/* PWA Install Prompt - Show on app launch if not installed */}
        <PWAInstallPrompt />
      </div>
    </>
  );
}

// Higher-order component for pages that need layout
export function withLayout<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  layoutProps?: Partial<LayoutProps>
) {
  const LayoutComponent = (props: P) => {
    return (
      <Layout {...layoutProps}>
        <WrappedComponent {...props} />
      </Layout>
    );
  };

  LayoutComponent.displayName = `withLayout(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return LayoutComponent;
}
