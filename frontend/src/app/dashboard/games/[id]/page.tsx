'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGame, useProviderList, useGameRoundList, updateGame, deleteGame } from '@/hooks/use-games';
import { useToast } from '@/components/toast-provider';

const CATEGORIES = [
  { value: 'casino', label: '카지노' },
  { value: 'slot', label: '슬롯' },
  { value: 'mini_game', label: '미니게임' },
  { value: 'virtual_soccer', label: '가상축구' },
  { value: 'sports', label: '스포츠' },
  { value: 'esports', label: 'e스포츠' },
  { value: 'holdem', label: '홀덤' },
];

const CATEGORY_LABELS: Record<string, string> = {
  casino: '카지노', slot: '슬롯', mini_game: '미니게임',
  virtual_soccer: '가상축구', sports: '스포츠', esports: 'e스포츠', holdem: '홀덤',
};

const RESULT_LABELS: Record<string, string> = {
  win: '승리', lose: '패배', draw: '무승부', push: '푸시',
};

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const gameId = Number(params.id);

  const { data: game, loading } = useGame(gameId);
  const { data: providerData } = useProviderList({ page_size: 100 });

  const [tab, setTab] = useState<'info' | 'rounds'>('info');
  const [editForm, setEditForm] = useState({
    name: '', code: '', category: '', provider_id: '',
    sort_order: '0', thumbnail_url: '', is_active: true,
  });
  const [editInit, setEditInit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [roundPage, setRoundPage] = useState(1);
  const { data: roundData, loading: roundsLoading } = useGameRoundList({
    game_id: gameId,
    page: roundPage,
    page_size: 20,
  });

  if (game && !editInit) {
    setEditForm({
      name: game.name,
      code: game.code,
      category: game.category,
      provider_id: String(game.provider_id),
      sort_order: String(game.sort_order),
      thumbnail_url: game.thumbnail_url || '',
      is_active: game.is_active,
    });
    setEditInit(true);
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: editForm.name.trim(),
        code: editForm.code.trim(),
        category: editForm.category,
        provider_id: Number(editForm.provider_id),
        sort_order: parseInt(editForm.sort_order) || 0,
        thumbnail_url: editForm.thumbnail_url.trim() || null,
        is_active: editForm.is_active,
      };
      await updateGame(gameId, body);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 게임을 비활성화합니다. 계속하시겠습니까?')) return;
    try {
      await deleteGame(gameId);
      router.push('/dashboard/games');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  if (loading || !game) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
        >
          &larr; 뒤로
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              game.is_active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
            }`}>
              {game.is_active ? '활성' : '비활성'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {game.code} &middot; {CATEGORY_LABELS[game.category] || game.category}
            {game.provider_name && ` &middot; ${game.provider_name}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['info', 'rounds'] as const).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {{ info: '게임 정보', rounds: '게임 라운드' }[t]}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="rounded-lg border p-6 border-border space-y-4 max-w-2xl">
          <h2 className="text-lg font-semibold">게임 정보 수정</h2>
          {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">이름</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">코드</label>
              <input
                type="text"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">프로바이더</label>
              <select
                value={editForm.provider_id}
                onChange={(e) => setEditForm({ ...editForm, provider_id: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                {providerData?.items.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">카테고리</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">정렬 순서</label>
              <input
                type="number"
                min="0"
                value={editForm.sort_order}
                onChange={(e) => setEditForm({ ...editForm, sort_order: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <select
                value={editForm.is_active ? 'true' : 'false'}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">썸네일 URL</label>
            <input
              type="text"
              value={editForm.thumbnail_url}
              onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
            >
              비활성화
            </button>
          </div>
        </div>
      )}

      {/* Tab: Rounds */}
      {tab === 'rounds' && (
        <div className="space-y-4">
          {roundsLoading ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">라운드 ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">유저</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">베팅금</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">당첨금</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">결과</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {roundData?.items.map((round) => (
                    <tr key={round.id} className="hover:bg-muted">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">{round.round_id}</td>
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
                          'bg-muted text-muted-foreground'
                        }`}>
                          {RESULT_LABELS[round.result] || round.result}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {round.started_at ? new Date(round.started_at).toLocaleString('ko-KR') : '-'}
                      </td>
                    </tr>
                  ))}
                  {roundData?.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        게임 라운드가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {roundData && roundData.total > roundData.page_size && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">전체: {roundData.total}건</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoundPage(Math.max(1, roundPage - 1))}
                  disabled={roundPage <= 1}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 border-border"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm">
                  {roundData.page} / {Math.ceil(roundData.total / roundData.page_size)}
                </span>
                <button
                  onClick={() => setRoundPage(roundPage + 1)}
                  disabled={roundPage >= Math.ceil(roundData.total / roundData.page_size)}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50 border-border"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
