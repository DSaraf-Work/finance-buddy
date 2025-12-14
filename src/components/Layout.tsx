import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useMockAI } from '@/contexts/MockAIContext';
import NotificationBell from './NotificationBell';
import NotificationPermissionPrompt from './NotificationPermissionPrompt';
import { useNotifications } from '@/hooks/useNotifications';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED
} from '@/lib/constants/database';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
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

export function Layout({ children, title, description }: LayoutProps) {
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation Header - Sticky with Airbnb Design */}
        <nav className="sticky top-0 z-50 bg-white shadow-airbnb-md border-b border-airbnb-border-light" role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16 lg:h-[72px]">
              {/* Logo and primary navigation */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 min-w-0 flex-1">
                <div className="flex-shrink-0 flex items-center">
                  <Link
                    href="/"
                    className="group flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white rounded-airbnb-md px-2 py-1 transition-all duration-200"
                    aria-label="Finance Buddy Home"
                  >
                    {/* Logo Icon */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-airbnb-red rounded-airbnb-md flex items-center justify-center shadow-airbnb-md group-hover:shadow-airbnb-lg transition-all duration-300">
                      <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">₹</span>
                    </div>
                    {/* Logo Text */}
                    <div className="hidden sm:block">
                      <div className="text-base sm:text-lg lg:text-xl font-semibold text-airbnb-text-primary group-hover:text-airbnb-red transition-colors duration-200">
                        Finance Buddy
                      </div>
                      <div className="text-[10px] sm:text-xs text-airbnb-text-secondary font-light tracking-wide hidden lg:block">
                        Smart Finance Tracking
                      </div>
                    </div>
                    {/* Mobile abbreviated logo */}
                    <span className="sm:hidden text-base font-semibold text-airbnb-text-primary group-hover:text-airbnb-red transition-colors duration-200">FB</span>
                  </Link>
                </div>

                {/* Desktop navigation dropdown */}
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center px-4 py-2.5 border border-airbnb-border-light rounded-airbnb-md text-sm font-medium text-airbnb-text-secondary bg-white hover:bg-airbnb-gray-light hover:border-airbnb-red hover:text-airbnb-text-primary focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 min-h-[44px] shadow-airbnb-sm"
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

                      {/* Dropdown content - Airbnb Design */}
                      <div
                        className="absolute left-0 mt-3 w-80 rounded-airbnb-lg shadow-airbnb-xl bg-white border border-airbnb-border-light z-20 animate-fade-in-down overflow-hidden"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="py-2">
                          {navigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`block px-4 py-3 text-sm transition-all duration-200 focus:outline-none ${
                                isActive(item.href)
                                  ? 'bg-blue-50 text-airbnb-red border-l-4 border-airbnb-red'
                                  : 'text-airbnb-text-secondary hover:bg-airbnb-gray-light hover:text-airbnb-text-primary border-l-4 border-transparent'
                              }`}
                              onClick={() => setDropdownOpen(false)}
                              role="menuitem"
                            >
                              <div className="flex items-start">
                                <span className="text-xl mr-3 flex-shrink-0" aria-hidden="true">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-xs text-airbnb-text-tertiary mt-0.5 line-clamp-2">
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

              {/* User menu - Purple + Slate Gray */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
                {user && (
                  <>
                    {/* Mock AI Toggle - Hidden on small mobile */}
                    <button
                      onClick={toggleMockAI}
                      disabled={loading}
                      className={`hidden sm:inline-flex items-center px-2.5 sm:px-3 lg:px-4 py-2 rounded-airbnb-md text-xs lg:text-sm font-medium transition-all duration-200 min-h-[44px] border ${
                        mockAIEnabled
                          ? 'bg-airbnb-warning/10 text-airbnb-warning border-airbnb-warning/30 hover:bg-airbnb-warning/20 hover:border-airbnb-warning/50'
                          : 'bg-airbnb-teal/10 text-airbnb-teal border-airbnb-teal/30 hover:bg-airbnb-teal/20 hover:border-airbnb-teal/50'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white`}
                      title={mockAIEnabled ? 'Mock AI: ON (Click to use Real AI)' : 'Mock AI: OFF (Click to use Mock AI)'}
                      aria-label={mockAIEnabled ? 'Switch to Real AI' : 'Switch to Mock AI'}
                    >
                      <span className="mr-1.5" aria-hidden="true">{mockAIEnabled ? '🤖' : '🧠'}</span>
                      <span className="hidden lg:inline font-medium">{mockAIEnabled ? 'Mock' : 'Real'}</span>
                    </button>

                    {/* Notification Bell */}
                    <div className="flex-shrink-0">
                      <NotificationBell />
                    </div>

                    {/* User email - Hidden on mobile, truncated on tablet */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-airbnb-gray-light rounded-airbnb-md border border-airbnb-border-light">
                      <svg className="w-4 h-4 text-airbnb-teal flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs lg:text-sm text-airbnb-text-secondary max-w-[100px] lg:max-w-[180px] truncate font-medium" title={user.email}>
                        {user.email}
                      </span>
                    </div>

                    {/* Sign Out - Hidden on mobile */}
                    <button
                      onClick={signOut}
                      className="hidden md:inline-flex items-center gap-2 text-xs lg:text-sm text-airbnb-text-secondary hover:text-airbnb-text-primary hover:bg-airbnb-gray-light px-3 lg:px-4 py-2 rounded-airbnb-md border border-transparent hover:border-airbnb-border-light transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white min-h-[44px] font-medium"
                      aria-label="Sign out"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden lg:inline">Sign Out</span>
                    </button>
                  </>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-2.5 rounded-airbnb-md text-airbnb-text-secondary hover:text-airbnb-text-primary hover:bg-airbnb-gray-light border border-transparent hover:border-airbnb-border-light focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 min-h-[44px] min-w-[44px]"
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu - Airbnb Design */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-airbnb-border-light bg-white animate-fade-in-down shadow-airbnb-lg">
              {/* User info section - Mobile only */}
              {user && (
                <div className="px-4 py-4 border-b border-airbnb-border-light bg-airbnb-gray-light">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-airbnb-red rounded-airbnb-md flex items-center justify-center shadow-airbnb-md flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-airbnb-text-tertiary font-medium uppercase tracking-wide mb-0.5">Account</p>
                        <p className="text-sm font-medium text-airbnb-text-primary truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={signOut}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-airbnb-border-light rounded-airbnb-md text-sm font-medium text-airbnb-text-secondary bg-white hover:bg-airbnb-gray-light hover:text-airbnb-text-primary hover:border-airbnb-red focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 min-h-[44px] flex-shrink-0"
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
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-airbnb-md text-sm font-medium transition-all duration-200 min-h-[44px] border ${
                        mockAIEnabled
                          ? 'bg-airbnb-warning/10 text-airbnb-warning border-airbnb-warning/30 hover:bg-airbnb-warning/20'
                          : 'bg-airbnb-teal/10 text-airbnb-teal border-airbnb-teal/30 hover:bg-airbnb-teal/20'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-airbnb-red focus:ring-offset-2 focus:ring-offset-white`}
                      aria-label={mockAIEnabled ? 'Switch to Real AI' : 'Switch to Mock AI'}
                    >
                      <span className="text-lg" aria-hidden="true">{mockAIEnabled ? '🤖' : '🧠'}</span>
                      <span>{mockAIEnabled ? 'Using Mock AI' : 'Using Real AI'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation items */}
              <div className="py-2 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3.5 text-base transition-all duration-200 focus:outline-none min-h-[44px] ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-airbnb-red border-l-4 border-airbnb-red'
                        : 'text-airbnb-text-secondary hover:bg-airbnb-gray-light hover:text-airbnb-text-primary border-l-4 border-transparent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3 flex-shrink-0" aria-hidden="true">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-airbnb-text-tertiary mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isActive(item.href) && (
                        <svg className="w-5 h-5 text-airbnb-red flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Breadcrumbs - Airbnb Design */}
        {router.pathname !== '/' && (
          <div className="bg-white border-b border-airbnb-border-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 py-3 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 && (
                      <svg className="w-4 h-4 text-airbnb-border-medium" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <Link
                      href={crumb.href}
                      className={`transition-colors duration-200 ${
                        index === getBreadcrumbs().length - 1
                          ? 'text-airbnb-red font-medium'
                          : 'text-airbnb-text-tertiary hover:text-airbnb-text-secondary'
                      }`}
                    >
                      {crumb.name}
                    </Link>
                  </React.Fragment>
                ))}
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
