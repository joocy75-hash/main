'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnnouncements, deleteAnnouncement } from '@/hooks/use-announcements';
import { useToast } from '@/components/toast-provider';

const TYPE_TABS = [
  { key: '', label: '전체' },
  { key: 'notice', label: '공지' },
  { key: 'popup', label: '팝업' },
  { key: 'banner', label: '배너' },
];

const TYPE_STYLES: Record<string, { label: string; cls: string }> = {
  notice: { label: '공지', cls: 'bg-primary/10 text-primary' },
  popup: { label: '팝업', cls: 'bg-orange-500/10 text-orange-500' },
  banner: { label: '배너', cls: 'bg-green-500/10 text-green-500' },
};

const TARGET_LABELS: Record<string, string> = {
  all: '전체',
  agents: '에이전트',
  users: '회원',
};

export default function AnnouncementsPage() {
  const toast = useToast();
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, loading, refetch } = useAnnouncements({
    page,
    page_size: 20,
    type: typeFilter || undefined,
    search: search || undefined,
  });

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 항목을 삭제합니다. 계속하시겠습니까?`)) return;
    try {
      await deleteAnnouncement(id);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">공지 관리</h1>
        <Link href="/dashboard/announcements/create">
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            + 새 공지
          </button>
        </Link>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 border-b">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              typeFilter === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setTypeFilter(tab.key); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="제목 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">타입</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">제목</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">타겟</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">활성</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">기간</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">작성일</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data?.items.map((item) => {
                const typeStyle = TYPE_STYLES[item.type];
                return (
                  <tr key={item.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{item.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeStyle?.cls || 'bg-muted text-foreground'}`}>
                        {typeStyle?.label || item.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium max-w-xs truncate">
                      <Link href={`/dashboard/announcements/${item.id}`} className="text-primary hover:text-primary/80">
                        {item.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {TARGET_LABELS[item.target] || item.target}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        item.is_active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-foreground'
                      }`}>
                        {item.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {item.start_date && item.end_date
                        ? `${new Date(item.start_date).toLocaleDateString('ko-KR')} ~ ${new Date(item.end_date).toLocaleDateString('ko-KR')}`
                        : item.start_date
                        ? `${new Date(item.start_date).toLocaleDateString('ko-KR')} ~`
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/announcements/${item.id}`}>
                          <button className="text-primary hover:text-primary/80">수정</button>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    등록된 공지가 없습니다
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
