'use client';

import { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProfileStore } from '@/stores/profile-store';

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function LoginHistoryPage() {
  const {
    loginHistory,
    isLoading,
    fetchLoginHistory,
  } = useProfileStore();

  useEffect(() => {
    fetchLoginHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">접속내역</CardTitle>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : loginHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">🕐</span>
              <p className="text-sm text-muted-foreground">접속내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP 주소</TableHead>
                    <TableHead>기기</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>브라우저</TableHead>
                    <TableHead className="text-right">접속일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.ip}</TableCell>
                      <TableCell className="text-sm">{entry.device}</TableCell>
                      <TableCell className="text-sm">{entry.os}</TableCell>
                      <TableCell className="text-sm">{entry.browser}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
