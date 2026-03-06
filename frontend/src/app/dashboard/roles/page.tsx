'use client';

import Link from 'next/link';
import { useRoles, deleteRole } from '@/hooks/use-roles';
import { useToast } from '@/components/toast-provider';

export default function RolesPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useRoles();

  const handleDelete = async (id: number, name: string, isSystem: boolean) => {
    if (isSystem) {
      toast.warning('시스템 역할은 삭제할 수 없습니다.');
      return;
    }
    if (!confirm(`"${name}" 역할을 삭제합니다. 계속하시겠습니까?`)) return;
    try {
      await deleteRole(id);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">역할/권한 관리</h1>
          <p className="text-sm text-muted-foreground">역할을 생성하고 권한을 할당합니다.</p>
        </div>
        <Link href="/dashboard/roles/create">
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            + 역할 생성
          </button>
        </Link>
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">역할명</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">설명</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">시스템</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">권한 수</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">생성일</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data?.items.map((role) => (
                <tr key={role.id} className="hover:bg-muted">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{role.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                    <Link href={`/dashboard/roles/${role.id}`} className="text-primary hover:text-primary/80">
                      {role.display_name || role.name}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground font-mono">{role.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                    {role.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                    {role.is_system ? (
                      <span className="inline-flex rounded-full bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-500">
                        시스템
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-center font-medium">
                    {role.permission_count}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(role.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/roles/${role.id}`}>
                        <button className="text-primary hover:text-primary/80">수정</button>
                      </Link>
                      {!role.is_system && (
                        <button
                          onClick={() => handleDelete(role.id, role.name, role.is_system)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    등록된 역할이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
