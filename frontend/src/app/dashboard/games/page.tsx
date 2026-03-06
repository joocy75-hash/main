'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameList, useProviderList, deleteGame } from '@/hooks/use-games';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/toast-provider';
import { AlertCircle, Gamepad2 } from 'lucide-react';

const CATEGORY_TABS = [
  { key: '', label: '전체' },
  { key: 'casino', label: '카지노' },
  { key: 'slot', label: '슬롯' },
  { key: 'mini_game', label: '미니게임' },
  { key: 'virtual_soccer', label: '가상축구' },
  { key: 'sports', label: '스포츠' },
  { key: 'esports', label: 'e스포츠' },
  { key: 'holdem', label: '홀덤' },
];

const CATEGORY_LABELS: Record<string, string> = {
  casino: '카지노',
  slot: '슬롯',
  mini_game: '미니게임',
  virtual_soccer: '가상축구',
  sports: '스포츠',
  esports: 'e스포츠',
  holdem: '홀덤',
};

export default function GamesPage() {
  const toast = useToast();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: providerData } = useProviderList({ page_size: 100 });

  const { data, loading, error, refetch } = useGameList({
    page,
    page_size: 20,
    category: category || undefined,
    provider_id: providerFilter ? Number(providerFilter) : undefined,
    search: search || undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 게임을 비활성화합니다. 계속하시겠습니까?`)) return;
    try {
      await deleteGame(id);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">게임 관리</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/games/rounds">
            <button className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-accent">
              라운드 조회
            </button>
          </Link>
          <Link href="/dashboard/games/providers">
            <button className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-accent">
              프로바이더 관리
            </button>
          </Link>
          <Link href="/dashboard/games/new">
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              + 게임 등록
            </button>
          </Link>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 border-b">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              category === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => { setCategory(tab.key); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="이름 / 코드 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={providerFilter}
          onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">전체 프로바이더</option>
          {providerData?.items.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">데이터를 불러오지 못했습니다</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" className="mt-4" onClick={refetch}>다시 시도</Button>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Gamepad2 className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">등록된 게임이 없습니다</p>
          <p className="text-sm">조건을 변경하거나 새로 등록해주세요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">프로바이더</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">카테고리</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">활성</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">정렬</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">등록일</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data?.items.map((game) => (
                <tr key={game.id} className="hover:bg-accent">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">{game.code}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                    <Link href={`/dashboard/games/${game.id}`} className="text-primary hover:text-primary/80">
                      {game.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {game.provider_name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                      {CATEGORY_LABELS[game.category] || game.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      game.is_active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {game.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-center text-muted-foreground">
                    {game.sort_order}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(game.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/games/${game.id}`}>
                        <button className="text-primary hover:text-primary/80">수정</button>
                      </Link>
                      <button
                        onClick={() => handleDelete(game.id, game.name)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            전체: {data.total}개
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 border-border"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm">
              {data.page} / {Math.ceil(data.total / data.page_size)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 border-border"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
