'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameRoundList, useGameList } from '@/hooks/use-games';

const RESULT_LABELS: Record<string, string> = {
  win: '승리', lose: '패배', draw: '무승부', push: '푸시',
};

export default function GameRoundsPage() {
  const [gameFilter, setGameFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: gamesData } = useGameList({ page_size: 100 });

  const { data, loading } = useGameRoundList({
    page,
    page_size: 20,
    game_id: gameFilter ? Number(gameFilter) : undefined,
    user_id: userFilter ? Number(userFilter) : undefined,
    result: resultFilter || undefined,
  });

  const totalBet = data?.items.reduce((sum, r) => sum + Number(r.bet_amount), 0) || 0;
  const totalWin = data?.items.reduce((sum, r) => sum + Number(r.win_amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">게임 라운드 조회</h1>
          <p className="text-sm text-muted-foreground">전체 게임 라운드 기록을 조회합니다.</p>
        </div>
        <Link href="/dashboard/games">
          <button className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted">
            게임 목록
          </button>
        </Link>
      </div>

      {/* Summary Cards */}
      {data && data.items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">페이지 총 베팅금</p>
            <p className="text-xl font-bold mt-1">{totalBet.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">페이지 총 당첨금</p>
            <p className="text-xl font-bold mt-1">{totalWin.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">수익 (베팅-당첨)</p>
            <p className={`text-xl font-bold mt-1 ${totalBet - totalWin >= 0 ? 'text-green-400' : 'text-destructive'}`}>
              {(totalBet - totalWin).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={gameFilter}
          onChange={(e) => { setGameFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">전체 게임</option>
          {gamesData?.items.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="유저 ID"
          value={userFilter}
          onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm w-32"
        />
        <select
          value={resultFilter}
          onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm"
        >
          <option value="">전체 결과</option>
          <option value="win">승리</option>
          <option value="lose">패배</option>
          <option value="draw">무승부</option>
          <option value="push">푸시</option>
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">라운드 ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">게임</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">유저</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">베팅금</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">당첨금</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">결과</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">시작</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">종료</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data?.items.map((round) => (
                <tr key={round.id} className="hover:bg-muted">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">
                    {round.round_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {round.game_name ? (
                      <Link href={`/dashboard/games/${round.game_id}`} className="text-primary hover:text-primary/80">
                        {round.game_name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">#{round.game_id}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {round.user_username ? (
                      <Link href={`/dashboard/users/${round.user_id}`} className="text-primary hover:text-primary/80">
                        {round.user_username}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">#{round.user_id}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono">
                    {Number(round.bet_amount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono">
                    {Number(round.win_amount).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      round.result === 'win' ? 'bg-green-500/10 text-green-500' :
                      round.result === 'lose' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-foreground'
                    }`}>
                      {RESULT_LABELS[round.result] || round.result}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {round.started_at ? new Date(round.started_at).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {round.ended_at ? new Date(round.ended_at).toLocaleString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    게임 라운드가 없습니다
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
          <p className="text-sm text-muted-foreground">전체: {data.total}건</p>
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
