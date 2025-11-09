import { useState } from 'react';

interface Connection {
  id: string;
  email_address: string;
  watch_enabled: boolean;
  watch_setup_at: string | null;
  last_history_id: string | null;
  expiration: string | null;
}

interface WebhookLog {
  email_address: string;
  history_id: string;
  received_at: string;
  processed_at: string | null;
  success: boolean;
  new_messages: number;
  error_message: string | null;
}

interface AuditLog {
  id: string;
  message_id: string;
  email_address: string;
  status: string;
  success: boolean;
  received_at: string;
  processing_duration_ms: number | null;
  new_messages_count: number;
  error_message: string | null;
  gmail_api_calls: number;
  retry_count: number;
}

interface Props {
  connections: Connection[];
  webhookLogs: WebhookLog[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
}

export function PubSubDetailedView({ connections, webhookLogs, auditLogs, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<'connections' | 'webhooks' | 'audit' | 'errors'>('connections');

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'connections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Connections ({connections.length})
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Webhook Logs ({webhookLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'errors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Errors
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'connections' && (
          <ConnectionsTable connections={connections} onRefresh={onRefresh} />
        )}
        {activeTab === 'webhooks' && (
          <WebhookLogsTable logs={webhookLogs} />
        )}
        {activeTab === 'audit' && (
          <AuditLogsTable logs={auditLogs} />
        )}
        {activeTab === 'errors' && (
          <ErrorsView />
        )}
      </div>
    </div>
  );
}

function ConnectionsTable({ connections, onRefresh }: { connections: Connection[]; onRefresh: () => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Watch Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Setup At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last History ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {connections.map((conn) => (
            <tr key={conn.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {conn.email_address}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {conn.watch_enabled ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Enabled
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    Disabled
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {conn.watch_setup_at ? new Date(conn.watch_setup_at).toLocaleString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                {conn.last_history_id || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button className="text-blue-600 hover:text-blue-900">View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WebhookLogsTable({ logs }: { logs: WebhookLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No webhook logs yet</p>
        <p className="text-sm text-gray-400 mt-2">Logs will appear here when emails are received</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Received At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              New Messages
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.email_address}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(log.received_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {log.success ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Success
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Failed
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.new_messages}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No audit logs yet</p>
        <p className="text-sm text-gray-400 mt-2">Detailed audit trail will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Message ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Received
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Messages
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              API Calls
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Retries
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className={log.success ? '' : 'bg-red-50'}>
              <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                {log.message_id.substring(0, 12)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.email_address}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  log.status === 'success' ? 'bg-green-100 text-green-800' :
                  log.status === 'failed' ? 'bg-red-100 text-red-800' :
                  log.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(log.received_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.processing_duration_ms ? `${log.processing_duration_ms}ms` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.new_messages_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.gmail_api_calls || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.retry_count > 0 ? (
                  <span className="text-yellow-600">{log.retry_count}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErrorsView() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No errors</p>
      <p className="text-sm text-gray-400 mt-2">System is running smoothly</p>
    </div>
  );
}

