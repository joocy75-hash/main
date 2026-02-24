'use client';

import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>📞</span> 고객센터
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* New inquiry button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="size-4" />
            문의하기
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문의 작성</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-sm">제목</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="문의 제목을 입력하세요"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">내용</Label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="문의 내용을 상세히 작성해주세요"
                className="mt-1 min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
            >
              {isSubmitting ? '보내는 중...' : '보내기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inquiry list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">내 문의 내역</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">📋</span>
              <p className="text-sm text-muted-foreground">문의 내역이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id}>
                  {/* Inquiry header */}
                  <button
                    onClick={() => handleExpand(inquiry.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/50',
                      expandedId === inquiry.id && 'bg-secondary/30'
                    )}
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{inquiry.title}</span>
                        <Badge
                          variant={inquiry.status === 'answered' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {inquiry.status === 'answered' ? '답변완료' : '대기중'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(inquiry.createdAt)}
                      </span>
                    </div>
                    {expandedId === inquiry.id ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded detail + replies */}
                  {expandedId === inquiry.id && (
                    <div className="border-t border-border bg-card/50 px-4 py-3">
                      {selectedInquiry?.replies && selectedInquiry.replies.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {selectedInquiry.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={cn(
                                'rounded-lg px-3 py-2',
                                reply.isAdmin
                                  ? 'ml-4 bg-primary/10 border border-primary/20'
                                  : 'mr-4 bg-secondary'
                              )}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-xs font-medium">
                                  {reply.isAdmin ? '관리자' : '나'}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatFullDateTime(reply.createdAt)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm">
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {inquiry.content}
                          </p>
                          {inquiry.status === 'pending' && (
                            <p className="mt-2 text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  );
}
