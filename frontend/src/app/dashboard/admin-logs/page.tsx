'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminLogs,
  type AdminLoginLog,
} from '@/hooks/use-reward-settings';

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, total, loading, error, refetch } = useAdminLogs(page, pageSize);
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">관리자 로그인 로그</h1>
        <p className="text-sm text-muted-foreground">관리자 로그인 이력을 조회합니다.</p>
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
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            로그인 기록이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">관리자</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">IP 주소</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">디바이스</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">OS</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">브라우저</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">로그인 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data.map((log) => (
                <tr key={log.id} className="hover:bg-muted">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                    {log.admin_username}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">
                    {log.ip_address}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {log.device || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {log.os || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {log.browser || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(log.logged_in_at).toLocaleString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p className="text-sm text-muted-foreground">
            {total}건 중 {(page - 1) * pageSize + 1}~{Math.min(page * pageSize, total)}건
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              이전
            </Button>
            <span className="text-sm py-1">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
