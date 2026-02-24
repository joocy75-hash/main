'use client';

import { useEffect, useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useProfileStore, type Message } from '@/stores/profile-store';

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MessagesPage() {
  const {
    messages,
    messagesTotal,
    unreadCount,
    isLoading,
    fetchMessages,
    fetchUnreadCount,
    readMessage,
    deleteMessage,
  } = useProfileStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<Message | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const pageSize = 10;

  useEffect(() => {
    fetchMessages(currentPage);
    fetchUnreadCount();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedMessage(null);
      return;
    }
    setExpandedId(id);
    const msg = await readMessage(id);
    setExpandedMessage(msg);
  };

  const handleDelete = async (id: number) => {
    await deleteMessage(id);
    setDeleteConfirmId(null);
    setExpandedId(null);
    setExpandedMessage(null);
  };

  const totalPages = Math.ceil(messagesTotal / pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>📩</span> 쪽지함
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                안 읽음: {unreadCount}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-muted-foreground">새로운 쪽지가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <button
                    onClick={() => handleExpand(msg.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                      expandedId === msg.id && 'bg-secondary/30'
                    )}
                  >
                    {/* Unread indicator */}
                    <span className={cn(
                      'size-2 shrink-0 rounded-full',
                      msg.isRead ? 'bg-transparent' : 'bg-blue-500'
                    )} />

                    {/* Title and date */}
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <span className={cn(
                        'truncate text-sm',
                        !msg.isRead && 'font-bold'
                      )}>
                        {msg.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {expandedId === msg.id && (
                    <div className="border-t border-border bg-card/50 px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {expandedMessage?.content || msg.title}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(msg.id);
                          }}
                        >
                          <Trash2 className="size-3" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
            이전
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            다음
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>쪽지 삭제</DialogTitle>
            <DialogDescription>
              이 쪽지를 삭제하시겠습니까? 삭제된 쪽지는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
