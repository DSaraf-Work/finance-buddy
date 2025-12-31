import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FilterChip,
  DateRangePicker,
  ProgressBar,
  ReportCard,
  DataTable,
  ReportLoadingSkeleton,
} from '@/components/reports';

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
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

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
            { sender: 'transactions@stripe.com', count: 76 },
          ],
        },
        transactionStats: {
          totalTransactions: 456,
          totalAmount: 4567890,
          transactionsByDirection: [
            { direction: 'Debit', count: 298, amount: 3245678 },
            { direction: 'Credit', count: 158, amount: 1322212 },
          ],
          transactionsByCategory: [
            { category: 'Food & Dining', count: 89, amount: 234567 },
            { category: 'Transport', count: 67, amount: 187654 },
            { category: 'Shopping', count: 54, amount: 456789 },
            { category: 'Utilities', count: 43, amount: 98765 },
            { category: 'Entertainment', count: 38, amount: 65432 },
          ],
          transactionsByMonth: [
            { month: '2024-01', count: 89, amount: 876543 },
            { month: '2024-02', count: 123, amount: 1234567 },
            { month: '2024-03', count: 134, amount: 1543210 },
            { month: '2024-04', count: 110, amount: 913570 },
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
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const exportReport = (format: 'csv' | 'json' | 'pdf') => {
    alert(`Exporting report as ${format.toUpperCase()}... (This is a demo)`);
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  if (loading || !reportData) {
    return (
      <ProtectedRoute>
        <Layout title="Reports - Finance Buddy" description="Analytics and insights for your financial data">
          <ReportLoadingSkeleton />
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Reports - Finance Buddy" description="Analytics and insights for your financial data">
        <div className="min-h-[calc(100vh-72px)] bg-background py-8 px-5">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between pb-5 border-b border-border/50">
                <div>
                  <h1 className="text-3xl font-semibold text-foreground mb-1">
                    Reports & Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Insights and analytics for your financial data
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => exportReport('csv')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => exportReport('json')}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Export JSON
                  </Button>
                  <Button
                    onClick={() => exportReport('pdf')}
                    size="sm"
                    className="text-xs shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <FilterChip
                label="All Time"
                active={activeFilters.includes('all-time')}
                onClick={() => toggleFilter('all-time')}
              />
              <FilterChip
                label="Processed"
                value={reportData.emailStats.emailsByStatus[0].count}
                active={activeFilters.includes('processed')}
                onClick={() => toggleFilter('processed')}
                color="#22C55E"
              />
              <FilterChip
                label="Failed"
                value={reportData.emailStats.emailsByStatus[2].count}
                active={activeFilters.includes('failed')}
                onClick={() => toggleFilter('failed')}
                color="#F87171"
              />
              <FilterChip
                label="Sync Rate"
                value={`${Math.round((reportData.syncStats.successfulSyncs / reportData.syncStats.totalSyncs) * 100)}%`}
                active={activeFilters.includes('sync-rate')}
                onClick={() => toggleFilter('sync-rate')}
                color="#4285F4"
              />
            </div>

            {/* Date Range Filter */}
            <div className="mb-8">
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onFromChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                onToChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                onApply={loadReportData}
              />
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <ReportCard
                icon="📧"
                label="Total Emails"
                value={reportData.emailStats.totalEmails}
                iconBg="rgba(99, 102, 241, 0.12)"
                trend={{ value: 12, isPositive: true }}
              />
              <ReportCard
                icon="💳"
                label="Transactions"
                value={reportData.transactionStats.totalTransactions}
                iconBg="rgba(34, 197, 94, 0.12)"
                trend={{ value: 8, isPositive: true }}
              />
              <ReportCard
                icon="💰"
                label="Total Amount"
                value={formatCurrency(reportData.transactionStats.totalAmount)}
                iconBg="rgba(245, 158, 11, 0.12)"
                trend={{ value: 15, isPositive: true }}
              />
              <ReportCard
                icon="🔄"
                label="Sync Success"
                value={`${Math.round((reportData.syncStats.successfulSyncs / reportData.syncStats.totalSyncs) * 100)}%`}
                iconBg="rgba(66, 133, 244, 0.12)"
                trend={{ value: 2, isPositive: true }}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
              {/* Email Status Distribution */}
              <Card className="bg-card/50 border-border/50 p-6">
                <h3 className="text-[15px] font-semibold text-foreground mb-6">
                  Email Status Distribution
                </h3>
                <div>
                  {reportData.emailStats.emailsByStatus.map((item) => (
                    <ProgressBar
                      key={item.status}
                      label={item.status}
                      value={item.count}
                      total={reportData.emailStats.totalEmails}
                      color={
                        item.status === 'Processed' ? '#22C55E' :
                        item.status === 'Failed' ? '#F87171' :
                        item.status === 'Fetched' ? '#4285F4' :
                        '#F59E0B'
                      }
                    />
                  ))}
                </div>
              </Card>

              {/* Transaction Direction */}
              <Card className="bg-card/50 border-border/50 p-6">
                <h3 className="text-[15px] font-semibold text-foreground mb-6">
                  Transaction Flow
                </h3>
                <div>
                  {reportData.transactionStats.transactionsByDirection.map((item) => (
                    <ProgressBar
                      key={item.direction}
                      label={item.direction}
                      value={item.count}
                      total={reportData.transactionStats.totalTransactions}
                      color={item.direction === 'Debit' ? '#F87171' : '#22C55E'}
                      suffix={formatCurrency(item.amount)}
                    />
                  ))}
                </div>
              </Card>

              {/* Transaction Categories */}
              <Card className="bg-card/50 border-border/50 p-6 col-span-2">
                <h3 className="text-[15px] font-semibold text-foreground mb-6">
                  Top Transaction Categories
                </h3>
                <div>
                  {reportData.transactionStats.transactionsByCategory.map((item, index) => {
                    const colors = ['#6366F1', '#22C55E', '#F59E0B', '#4285F4', '#8B5CF6'];
                    return (
                      <ProgressBar
                        key={item.category}
                        label={item.category}
                        value={item.amount}
                        total={reportData.transactionStats.totalAmount}
                        color={colors[index % colors.length]}
                        suffix={`${item.count} txns`}
                      />
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Data Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Top Email Senders */}
              <div className="table-section">
                <DataTable
                  title="Top Email Senders"
                  columns={[
                    { key: 'sender', label: 'Sender', align: 'left' },
                    { key: 'count', label: 'Count', align: 'right' },
                    {
                      key: 'percentage',
                      label: 'Share',
                      align: 'right',
                      format: (value: number) => `${value}%`,
                    },
                  ]}
                  data={reportData.emailStats.topSenders.map((sender) => ({
                    sender: sender.sender,
                    count: sender.count,
                    percentage: Math.round((sender.count / reportData.emailStats.totalEmails) * 100),
                  }))}
                />
              </div>

              {/* Transaction Categories Detail */}
              <div className="table-section">
                <DataTable
                  title="Category Analysis"
                  columns={[
                    { key: 'category', label: 'Category', align: 'left' },
                    { key: 'count', label: 'Count', align: 'right' },
                    {
                      key: 'amount',
                      label: 'Amount',
                      align: 'right',
                      format: formatCurrency,
                    },
                    {
                      key: 'average',
                      label: 'Average',
                      align: 'right',
                      format: formatCurrency,
                    },
                  ]}
                  data={reportData.transactionStats.transactionsByCategory.map((category) => ({
                    category: category.category,
                    count: category.count,
                    amount: category.amount,
                    average: Math.round(category.amount / category.count),
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ReportsPage;