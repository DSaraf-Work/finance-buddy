import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';

interface ReportData {
  emailStats: {
    totalEmails: number;
    emailsByStatus: { status: string; count: number }[];
    emailsByMonth: { month: string; count: number }[];
    topSenders: { sender: string; count: number }[];
  };
  transactionStats: {
    totalTransactions: number;
    totalAmount: number;
    transactionsByDirection: { direction: string; count: number; amount: number }[];
    transactionsByCategory: { category: string; count: number; amount: number }[];
    transactionsByMonth: { month: string; count: number; amount: number }[];
  };
  syncStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncDate: string;
    avgSyncTime: number;
  };
}

const ReportsPage: NextPage = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call actual analytics APIs
      // For now, we'll simulate the data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      const mockData: ReportData = {
        emailStats: {
          totalEmails: 1247,
          emailsByStatus: [
            { status: 'Processed', count: 892 },
            { status: 'Fetched', count: 234 },
            { status: 'Failed', count: 89 },
            { status: 'Invalid', count: 32 },
          ],
          emailsByMonth: [
            { month: '2024-01', count: 234 },
            { month: '2024-02', count: 312 },
            { month: '2024-03', count: 401 },
            { month: '2024-04', count: 300 },
          ],
          topSenders: [
            { sender: 'noreply@bank.com', count: 156 },
            { sender: 'alerts@creditcard.com', count: 134 },
            { sender: 'statements@investment.com', count: 98 },
            { sender: 'notifications@paypal.com', count: 87 },
          ],
        },
        transactionStats: {
          totalTransactions: 456,
          totalAmount: 45678.90,
          transactionsByDirection: [
            { direction: 'debit', count: 298, amount: 32456.78 },
            { direction: 'credit', count: 158, amount: 13222.12 },
          ],
          transactionsByCategory: [
            { category: 'Groceries', count: 89, amount: 2345.67 },
            { category: 'Gas', count: 67, amount: 1876.54 },
            { category: 'Restaurants', count: 54, amount: 1234.56 },
            { category: 'Shopping', count: 43, amount: 987.65 },
          ],
          transactionsByMonth: [
            { month: '2024-01', count: 89, amount: 8765.43 },
            { month: '2024-02', count: 123, amount: 12345.67 },
            { month: '2024-03', count: 134, amount: 15432.10 },
            { month: '2024-04', count: 110, amount: 9135.70 },
          ],
        },
        syncStats: {
          totalSyncs: 45,
          successfulSyncs: 42,
          failedSyncs: 3,
          lastSyncDate: new Date().toISOString(),
          avgSyncTime: 2.3,
        },
      };

      setReportData(mockData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportReport = (format: 'csv' | 'json' | 'pdf') => {
    // In a real implementation, this would generate and download the report
    alert(`Exporting report as ${format.toUpperCase()}... (This is a demo)`);
  };

  if (loading || !reportData) {
    return (
      <ProtectedRoute>
        <Layout title="Reports - Finance Buddy" description="Analytics and insights for your financial data">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading reports...</p>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Reports - Finance Buddy" description="Analytics and insights for your financial data">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Insights and analytics for your financial email data
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportReport('csv')}
                    className="btn-secondary"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportReport('json')}
                    className="btn-secondary"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => exportReport('pdf')}
                    className="btn-primary"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-bg-secondary shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-text-primary mb-4">Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={loadReportData}
                    className="btn-primary w-full"
                  >
                    Update Report
                  </button>
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📧</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Emails</dt>
                        <dd className="text-lg font-medium text-text-primary">
                          {reportData.emailStats.totalEmails.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                        <dd className="text-lg font-medium text-text-primary">
                          {reportData.transactionStats.totalTransactions.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">💵</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Amount</dt>
                        <dd className="text-lg font-medium text-text-primary">
                          {formatCurrency(reportData.transactionStats.totalAmount)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">🔄</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Sync Success Rate</dt>
                        <dd className="text-lg font-medium text-text-primary">
                          {Math.round((reportData.syncStats.successfulSyncs / reportData.syncStats.totalSyncs) * 100)}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Email Status Distribution */}
              <div className="bg-bg-secondary shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Email Status Distribution</h3>
                <div className="space-y-3">
                  {reportData.emailStats.emailsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{item.status}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className="bg-brand-primary h-2 rounded-full"
                            style={{
                              width: `${(item.count / reportData.emailStats.totalEmails) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text-primary">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Direction */}
              <div className="bg-bg-secondary shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Transaction Direction</h3>
                <div className="space-y-3">
                  {reportData.transactionStats.transactionsByDirection.map((item) => (
                    <div key={item.direction} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary capitalize">{item.direction}</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${item.direction === 'debit' ? 'bg-red-600' : 'bg-green-600'}`}
                            style={{
                              width: `${(item.count / reportData.transactionStats.totalTransactions) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {item.count} ({formatCurrency(item.amount)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Senders */}
            <div className="bg-bg-secondary shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-text-primary mb-4">Top Email Senders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-secondary divide-y divide-gray-200">
                    {reportData.emailStats.topSenders.map((sender, index) => (
                      <tr key={sender.sender}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {sender.sender}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {sender.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {Math.round((sender.count / reportData.emailStats.totalEmails) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction Categories */}
            <div className="bg-bg-secondary shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-text-primary mb-4">Top Transaction Categories</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-bg-secondary divide-y divide-gray-200">
                    {reportData.transactionStats.transactionsByCategory.map((category) => (
                      <tr key={category.category}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {category.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {category.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {formatCurrency(category.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {formatCurrency(category.amount / category.count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ReportsPage;
