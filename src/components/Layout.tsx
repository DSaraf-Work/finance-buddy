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

      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header - Sticky */}
        <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              {/* Logo and primary navigation */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className="flex-shrink-0 flex items-center">
                  <Link
                    href="/"
                    className="text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-1"
                    aria-label="Finance Buddy Home"
                  >
                    <span className="hidden sm:inline">Finance Buddy</span>
                    <span className="sm:hidden">FB</span>
                  </Link>
                </div>

                {/* Desktop navigation dropdown */}
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 min-h-[44px]"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="Navigation menu"
                  >
                    <span className="mr-2 text-base" aria-hidden="true">
                      {navigation.find(item => isActive(item.href))?.icon || '📍'}
                    </span>
                    <span className="hidden xl:inline">
                      {navigation.find(item => isActive(item.href))?.name || 'Navigate'}
                    </span>
                    <svg
                      className={`ml-2 h-5 w-5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
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

                      {/* Dropdown content */}
                      <div
                        className="absolute left-0 mt-2 w-80 rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-20 animate-fade-in-down"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <div className="py-1">
                          {navigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`block px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-gray-100 ${
                                isActive(item.href)
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700'
                              }`}
                              onClick={() => setDropdownOpen(false)}
                              role="menuitem"
                            >
                              <div className="flex items-start">
                                <span className="text-xl mr-3 flex-shrink-0" aria-hidden="true">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
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

              {/* User menu */}
              <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
                {user && (
                  <>
                    {/* Mock AI Toggle - Hidden on small mobile */}
                    <button
                      onClick={toggleMockAI}
                      disabled={loading}
                      className={`hidden sm:inline-flex items-center px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 min-h-[44px] ${
                        mockAIEnabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500'
                          : 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      title={mockAIEnabled ? 'Mock AI: ON (Click to use Real AI)' : 'Mock AI: OFF (Click to use Mock AI)'}
                      aria-label={mockAIEnabled ? 'Switch to Real AI' : 'Switch to Mock AI'}
                    >
                      <span className="mr-1" aria-hidden="true">{mockAIEnabled ? '🤖' : '🧠'}</span>
                      <span className="hidden lg:inline">{mockAIEnabled ? 'Mock' : 'Real'}</span>
                    </button>

                    {/* Notification Bell */}
                    <div className="flex-shrink-0">
                      <NotificationBell />
                    </div>

                    {/* User email - Hidden on mobile, truncated on tablet */}
                    <span className="hidden md:inline-block text-sm text-gray-700 max-w-[120px] lg:max-w-[200px] truncate" title={user.email}>
                      {user.email}
                    </span>

                    {/* Sign Out - Hidden on mobile */}
                    <button
                      onClick={signOut}
                      className="hidden md:inline-flex items-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                      aria-label="Sign out"
                    >
                      Sign Out
                    </button>
                  </>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200 min-h-[44px] min-w-[44px]"
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                  <span className="text-2xl" aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 bg-white animate-fade-in-down">
              {/* User info section - Mobile only */}
              {user && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={signOut}
                      className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 min-h-[44px]"
                      aria-label="Sign out"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Mock AI Toggle - Mobile */}
                  <div className="mt-3 sm:hidden">
                    <button
                      onClick={toggleMockAI}
                      disabled={loading}
                      className={`w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[44px] ${
                        mockAIEnabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500'
                          : 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      aria-label={mockAIEnabled ? 'Switch to Real AI' : 'Switch to Mock AI'}
                    >
                      <span className="mr-2" aria-hidden="true">{mockAIEnabled ? '🤖' : '🧠'}</span>
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
                    className={`block px-4 py-3 text-base transition-colors duration-150 focus:outline-none focus:bg-gray-100 min-h-[44px] ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3 flex-shrink-0" aria-hidden="true">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Breadcrumbs */}
        {router.pathname !== '/' && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-2 py-3 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 && <span className="text-gray-400">/</span>}
                    <Link
                      href={crumb.href}
                      className={`${
                        index === getBreadcrumbs().length - 1
                          ? 'text-gray-900 font-medium'
                          : 'text-gray-500 hover:text-gray-700'
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
