import { TableScreen, formatDate, getString, type PartnerRecord } from '@/src/features/partner/screens';

export default function AdminAuditLogsScreen() {
  return (
    <TableScreen
      portalName="Audit Logs"
      subtitle="Full audit trail with action, user, and date filters."
      endpoint="/api/admin/audit-logs"
      listKeys={['logs', 'auditLogs']}
      headers={['Action', 'User', 'Date', 'Details']}
      row={(record: PartnerRecord) => [
        getString(record, 'action'),
        getString(record, 'userEmail', getString(record, 'user')),
        formatDate(record.createdAt ?? record.timestamp),
        getString(record, 'details', getString(record, 'description'))
      ]}
    />
  );
}
