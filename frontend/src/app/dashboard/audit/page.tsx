'use client';

import { useState } from 'react';
import { useAuditLogs, exportAuditCSV, type AuditLogItem } from '@/hooks/use-audit';
import { useToast } from '@/components/toast-provider';

const ACTION_OPTIONS = [
  { value: '', label: '전체 액션' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
];

const MODULE_OPTIONS = [
  { value: '', label: '전체 모듈' },
  { value: 'auth', label: '인증' },
  { value: 'agents', label: '에이전트' },
  { value: 'users', label: '회원' },
  { value: 'commissions', label: '커미션' },
  { value: 'settlements', label: '정산' },
  { value: 'transactions', label: '입출금' },
  { value: 'games', label: '게임' },
  { value: 'content', label: '컨텐츠' },
  { value: 'settings', label: '설정' },
  { value: 'roles', label: '역할' },
];

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-green-500/10 text-green-500',
  update: 'bg-primary/10 text-primary',
  delete: 'bg-destructive/10 text-destructive',
  login: 'bg-purple-500/10 text-purple-500',
  logout: 'bg-muted text-foreground',
  approve: 'bg-emerald-500/10 text-emerald-500',
  reject: 'bg-orange-500/10 text-orange-500',
};

export default function AuditPage() {
  const toast = useToast();
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, loading, error } = useAuditLogs({
    page,
    page_size: 20,
    action: action || undefined,
    module: module || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAuditCSV({
        action: action || undefined,
        module: module || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '내보내기 실패');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">감사 로그</h1>
          <p className="text-sm text-muted-foreground">시스템 관리 행위를 조회합니다.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {exporting ? '내보내는 중...' : 'CSV 내보내기'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={module}
          onChange={(e) => { setModule(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          {MODULE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">관리자</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">모듈</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">리소스</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">설명</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data?.items.map((log) => (
                <tr key={log.id} className="hover:bg-muted">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{log.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                    {log.admin_username || <span className="text-muted-foreground">시스템</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${ACTION_STYLES[log.action] || 'bg-muted text-foreground'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {log.module}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">
                    {log.resource_id || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {log.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {(log.before_data || log.after_data) && (
                      <button
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        className="text-primary hover:text-primary/80"
                      >
                        {selectedLog?.id === log.id ? '닫기' : '보기'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    감사 로그가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      {selectedLog && (
        <div className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">감사 로그 상세 (ID: {selectedLog.id})</h3>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              닫기
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">관리자:</span>{' '}
              {selectedLog.admin_username || '시스템'}
            </div>
            <div>
              <span className="font-medium text-muted-foreground">IP:</span>{' '}
              {selectedLog.ip_address || '-'}
            </div>
            <div>
              <span className="font-medium text-muted-foreground">액션:</span>{' '}
              {selectedLog.action}
            </div>
            <div>
              <span className="font-medium text-muted-foreground">모듈:</span>{' '}
              {selectedLog.module}
            </div>
          </div>
          {selectedLog.before_data && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">변경 전 (Before)</h4>
              <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-48 font-mono">
                {JSON.stringify(selectedLog.before_data, null, 2)}
              </pre>
            </div>
          )}
          {selectedLog.after_data && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">변경 후 (After)</h4>
              <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-48 font-mono">
                {JSON.stringify(selectedLog.after_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">전체: {data.total}개</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm">
              {data.page} / {Math.ceil(data.total / data.page_size)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
