import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      if (segment === 'fb_emails') name = 'Email Workbench';
      if (segment === 'fb_extracted_transactions') name = 'Transaction Workbench';
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
        <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Logo and primary navigation */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    Finance Buddy
                  </Link>
                </div>

                {/* Desktop navigation dropdown */}
                <div className="hidden md:block relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="mr-2">
                      {navigation.find(item => isActive(item.href))?.icon || '📍'}
                    </span>
                    <span>
                      {navigation.find(item => isActive(item.href))?.name || 'Navigate'}
                    </span>
                    <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      ></div>

                      {/* Dropdown content */}
                      <div className="absolute left-0 mt-2 w-72 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1" role="menu">
                          {navigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`block px-4 py-3 text-sm hover:bg-gray-50 ${
                                isActive(item.href)
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700'
                              }`}
                              onClick={() => setDropdownOpen(false)}
                            >
                              <div className="flex items-start">
                                <span className="text-xl mr-3">{item.icon}</span>
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-xs text-gray-500 mt-0.5">
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
              <div className="flex items-center space-x-4">
                {user && (
                  <>
                    <span className="text-sm text-gray-700">
                      {user.email}
                    </span>
                    <button
                      onClick={signOut}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Sign Out
                    </button>
                  </>
                )}
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? '✕' : '☰'}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="py-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-3 text-sm ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-start">
                      <span className="text-xl mr-3">{item.icon}</span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-0.5">
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
