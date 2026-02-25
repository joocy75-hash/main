'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useProfileStore, type Inquiry } from '@/stores/profile-store';

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatFullDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SupportPage() {
  const {
    inquiries,
    selectedInquiry,
    isLoading,
    fetchInquiries,
    fetchInquiryDetail,
    createInquiry,
  } = useProfileStore();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    await fetchInquiryDetail(id);
  };

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createInquiry(newTitle.trim(), newContent.trim());
      setDialogOpen(false);
      setNewTitle('');
      setNewContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-lg px-5 py-4">
        <h1 className="flex items-center gap-2 text-[#252531] font-bold text-lg">
          <span>📞</span> 고객센터
        </h1>
      </div>

      {/* New inquiry button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#ffd651] to-[#fe960e] text-white font-bold rounded-lg px-4 py-2 transition-opacity hover:opacity-90">
            <Plus className="size-4" />
            문의하기
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문의 작성</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-[#252531] font-medium">제목</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="문의 제목을 입력하세요"
                className="mt-1 w-full rounded-lg border border-[#dddddd] px-3 py-2 text-sm focus:outline-none focus:border-[#f4b53e] focus:ring-1 focus:ring-[#f4b53e]"
              />
            </div>
            <div>
              <label className="text-sm text-[#252531] font-medium">내용</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="문의 내용을 상세히 작성해주세요"
                className="mt-1 min-h-32 w-full rounded-lg border border-[#dddddd] px-3 py-2 text-sm focus:outline-none focus:border-[#f4b53e] focus:ring-1 focus:ring-[#f4b53e]"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
              className="bg-gradient-to-r from-[#ffd651] to-[#fe960e] text-white font-bold rounded-lg px-4 py-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '보내는 중...' : '보내기'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inquiry list */}
      <div className="bg-white rounded-lg">
        <div className="px-5 py-4 border-b border-[#dddddd]">
          <h2 className="text-[#252531] font-bold text-base">내 문의 내역</h2>
        </div>
        <div>
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-[#edeef3] rounded h-16 w-full" />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">📋</span>
              <p className="text-sm text-[#707070]">문의 내역이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#dddddd]">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id}>
                  {/* Inquiry header */}
                  <button
                    onClick={() => handleExpand(inquiry.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#f8f9fc]',
                      expandedId === inquiry.id && 'bg-[#f8f9fc]'
                    )}
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#252531]">{inquiry.title}</span>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            inquiry.status === 'answered'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-yellow-50 text-yellow-600'
                          )}
                        >
                          {inquiry.status === 'answered' ? '답변완료' : '대기중'}
                        </span>
                      </div>
                      <span className="text-xs text-[#707070]">
                        {formatDateTime(inquiry.createdAt)}
                      </span>
                    </div>
                    {expandedId === inquiry.id ? (
                      <ChevronUp className="size-4 text-[#707070]" />
                    ) : (
                      <ChevronDown className="size-4 text-[#707070]" />
                    )}
                  </button>

                  {/* Expanded detail + replies */}
                  {expandedId === inquiry.id && (
                    <div className="border-t border-[#dddddd] bg-[#f8f9fc] px-4 py-3">
                      {selectedInquiry?.replies && selectedInquiry.replies.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {selectedInquiry.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={cn(
                                reply.isAdmin
                                  ? 'ml-4 bg-[#fff8e7] border border-[#f4b53e]/20 rounded-lg px-3 py-2'
                                  : 'mr-4 bg-[#f8f9fc] rounded-lg px-3 py-2'
                              )}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-medium text-[#252531]">
                                  {reply.isAdmin ? '관리자' : '나'}
                                </span>
                                <span className="text-[10px] text-[#707070]">
                                  {formatFullDateTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm text-[#252531]">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap text-sm text-[#707070]">
                            {inquiry.content}
                          </p>
                          {inquiry.status === 'pending' && (
                            <p className="mt-2 text-xs text-[#707070]">
                              답변 대기 중입니다. 빠른 시일 내에 답변 드리겠습니다.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
