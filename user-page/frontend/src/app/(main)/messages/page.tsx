'use client';

import { useEffect, useState } from 'react';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="bg-white rounded-lg border border-[#e8e8e8] px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[#252531] font-bold text-lg">
            <span>📩</span> 쪽지함
          </h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              안 읽음: {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="bg-white rounded-lg border border-[#e8e8e8]">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#e8e8e8] rounded h-14 w-full" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-4xl">📭</span>
            <p className="text-sm text-[#6b7280]">새로운 쪽지가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#e8e8e8]">
            {messages.map((msg) => (
              <div key={msg.id}>
                <button
                  onClick={() => handleExpand(msg.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8f8fa]',
                    expandedId === msg.id && 'bg-[#f8f8fa]'
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
                      'truncate text-sm text-[#252531]',
                      !msg.isRead && 'font-bold'
                    )}>
                      {msg.title}
                    </span>
                    <span className="shrink-0 text-xs text-[#6b7280]">
                      {formatDateTime(msg.createdAt)}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {expandedId === msg.id && (
                  <div className="border-t border-[#e8e8e8] bg-[#f8f8fa] px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm text-[#6b7280]">
                      {expandedMessage?.content || msg.title}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(msg.id);
                        }}
                      >
                        <Trash2 className="size-3" />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[#e8e8e8] text-[#6b7280] hover:bg-[#f8f8fa] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  currentPage === page
                    ? 'bg-[#feb614] text-white font-bold'
                    : 'border border-[#e8e8e8] text-[#6b7280] hover:bg-[#f8f8fa]'
                )}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            );
          })}
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[#e8e8e8] text-[#6b7280] hover:bg-[#f8f8fa] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            다음
            <ChevronRight className="size-4" />
          </button>
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
            <button
              className="px-4 py-2 text-sm text-[#6b7280] hover:bg-[#f8f8fa] rounded-lg"
              onClick={() => setDeleteConfirmId(null)}
            >
              취소
            </button>
            <button
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              삭제
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
