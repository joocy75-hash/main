'use client';

import { useParams } from 'next/navigation';
import { UserDetailContent } from '@/components/user-detail-content';

export default function UserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);

  if (isNaN(userId) || userId <= 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">유효하지 않은 회원 ID입니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserDetailContent userId={userId} />
    </div>
  );
}
