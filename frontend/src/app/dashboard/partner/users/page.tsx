'use client';

import { useState } from 'react';
import { usePartnerUsers } from '@/hooks/use-partner';
import { formatAmount } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  suspended: '정지',
  banned: '차단',
};

export default function PartnerUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading } = usePartnerUsers({
    page,
    page_size: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">하위 유저</h1>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="유저명 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="suspended">정지</option>
          <option value="banned">차단</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">유저명</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">잔액</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">총 베팅</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">총 당첨</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data?.items.map((user) => (
                <tr key={user.id} className="hover:bg-accent">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{user.username}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : user.status === 'suspended'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {STATUS_LABELS[user.status] || user.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono">{formatAmount(user.balance)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono">{formatAmount(user.total_bet)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono">{formatAmount(user.total_win)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    하위 유저가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            전체: {data.total}명
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 "
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm">
              {data.page} / {Math.ceil(data.total / data.page_size)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 "
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
