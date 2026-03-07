'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp, MessageSquare, Clock, CheckCircle2, Send, Headset } from 'lucide-react';
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
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header Area */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#e2e8f0]">
        <div className="flex items-center gap-4">
          <div className="relative flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-[inset_0_2px_0_rgba(255,255,255,0.8),_inset_0_-2px_0_rgba(226,232,240,0.5)] border border-[#e2e8f0] transform -rotate-2">
            <Headset className="size-6 text-slate-700 drop-shadow-sm" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-[#1e293b]">고객센터</h1>
            <p className="text-[13px] font-bold text-[#94a3b8] mt-0.5">24시간 연중무휴 친절하게 상담해 드립니다.</p>
          </div>
        </div>

        {/* New inquiry button & Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] px-5 text-[14px] font-bold text-white shadow-[0_4px_10px_rgba(15,23,42,0.3),_inset_0_2px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(15,23,42,0.4)]">
              <Plus className="size-4" strokeWidth={3} />
              1:1 문의작성
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white rounded-2xl p-0 overflow-hidden">
            <div className="bg-gradient-to-b from-slate-50 to-white px-6 py-5 border-b border-slate-100">
              <DialogHeader>
                <DialogTitle className="text-[18px] font-black text-[#1e293b] flex items-center gap-2">
                  <MessageSquare className="size-5 text-slate-700" /> 새로운 문의 접수
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="flex flex-col gap-5 p-6">
              <div>
                <label className="text-[13px] font-bold text-[#64748b] ml-1 mb-1.5 block">문의 제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="무엇을 도와드릴까요?"
                  className="w-full rounded-xl border border-[#cbd5e1] bg-[#fbfcfd] px-4 py-3 text-[14px] font-semibold text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-[#64748b] ml-1 mb-1.5 block">문의 내용</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="상세한 내용을 입력해주시면 빠르고 정확한 답변이 가능합니다."
                  className="min-h-[160px] w-full resize-none rounded-xl border border-[#cbd5e1] bg-[#fbfcfd] px-4 py-3 text-[14px] font-medium text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all shadow-inner"
                />
              </div>
              
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] px-8 text-[15px] font-bold text-white shadow-[0_4px_10px_rgba(15,23,42,0.3),_inset_0_2px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(15,23,42,0.4)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  <Send className="size-4" />
                  {isSubmitting ? '접수 중...' : '문의 접수하기'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inquiry list Area */}
      <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#e2e8f0] overflow-hidden">
        <div className="bg-gradient-to-b from-slate-50 to-white px-6 py-4 border-b border-[#e2e8f0]">
          <h2 className="text-[18px] font-black text-[#1e293b] flex items-center gap-2">
            <MessageSquare className="size-5 text-slate-600" /> 나의 문의 내역
          </h2>
        </div>
        <div className="p-2 sm:p-4">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-[72px] w-full" />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
                <MessageSquare className="size-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-bold text-slate-400">등록된 문의 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white transition-all">
                  {/* Inquiry header (Row) */}
                  <button
                    onClick={() => handleExpand(inquiry.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-5 py-4 text-left transition-all hover:bg-slate-50',
                      expandedId === inquiry.id && 'bg-slate-50 border-b border-[#e2e8f0]'
                    )}
                  >
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[15px] font-bold text-[#1e293b] line-clamp-1">{inquiry.title}</span>
                        {/* Custom sleek chips */}
                        {inquiry.status === 'answered' ? (
                          <span className="flex items-center gap-1 text-[11px] font-black rounded-md px-2 py-0.5 bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] shadow-sm shrink-0">
                            <CheckCircle2 className="size-3" /> 답변완료
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-black rounded-md px-2 py-0.5 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] shadow-sm shrink-0">
                            <Clock className="size-3" /> 대기중
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] font-semibold text-[#94a3b8]">
                        접수일: {formatDateTime(inquiry.createdAt)}
                      </span>
                    </div>
                    <div className={cn("shrink-0 ml-4 p-2 rounded-full transition-all text-[#94a3b8]", expandedId === inquiry.id ? "bg-slate-200 text-[#475569]" : "bg-slate-100 group-hover:bg-slate-200")}>
                      {expandedId === inquiry.id ? (
                        <ChevronUp className="size-4" strokeWidth={2.5} />
                      ) : (
                        <ChevronDown className="size-4" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail + replies */}
                  {expandedId === inquiry.id && (
                    <div className="bg-[#f8fafc] px-5 py-5 shadow-inner">
                      {selectedInquiry?.replies && selectedInquiry.replies.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          {selectedInquiry.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={cn(
                                "flex flex-col max-w-[85%]",
                                reply.isAdmin ? "ms-6" : "me-6 mt-2"
                              )}
                            >
                              <div className="mb-1.5 flex items-center gap-2 px-1">
                                <span className={cn("text-[12px] font-black", reply.isAdmin ? "text-blue-600" : "text-slate-500")}>
                                  {reply.isAdmin ? '고객센터 담당자' : '나의 질문'}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {formatFullDateTime(reply.createdAt)}
                                </span>
                              </div>
                              <div className={cn(
                                "px-4 py-3 rounded-2xl text-[14px] font-medium leading-[1.6] break-words shadow-sm",
                                reply.isAdmin 
                                  ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-[0_2px_4px_rgba(0,0,0,0.02)]" 
                                  : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 border border-slate-300 rounded-tr-sm"
                              )}>
                                <p className="whitespace-pre-wrap">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
                            <span className="text-[12px] font-black text-slate-400 mb-2 block">나의 질문 내역</span>
                            <p className="whitespace-pre-wrap text-[14px] font-medium text-slate-700 leading-relaxed">
                              {inquiry.content}
                            </p>
                          </div>
                          {inquiry.status === 'pending' && (
                            <div className="flex items-center gap-2 self-start rounded-lg bg-slate-200/50 px-3 py-2 text-[12px] font-bold text-slate-500 border border-slate-200">
                              <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full size-2 bg-slate-400"></span>
                              </span>
                              담당자가 내용을 검토하고 있습니다. 잠시만 기다려주세요.
                            </div>
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
