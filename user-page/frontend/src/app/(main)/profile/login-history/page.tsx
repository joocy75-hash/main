'use client';

import { useEffect } from 'react';
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
      <div className="bg-white rounded-lg px-5 py-4">
        <h2 className="text-lg font-bold text-[#252531]">접속내역</h2>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#edeef3] rounded h-12 w-full" />
            ))}
          </div>
        ) : loginHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-4xl">🕐</span>
            <p className="text-sm text-[#707070]">접속내역이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f9fc]">
                  <th className="px-4 py-3 text-xs font-medium text-[#707070] uppercase text-left">IP 주소</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#707070] uppercase text-left">기기</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#707070] uppercase text-left">OS</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#707070] uppercase text-left">브라우저</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#707070] uppercase text-right">접속일시</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#f0f0f0] hover:bg-[#f8f9fc] transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-[#252531]">{entry.ip}</td>
                    <td className="px-4 py-3 text-sm text-[#252531]">{entry.device}</td>
                    <td className="px-4 py-3 text-sm text-[#252531]">{entry.os}</td>
                    <td className="px-4 py-3 text-sm text-[#252531]">{entry.browser}</td>
                    <td className="px-4 py-3 text-xs text-[#707070] text-right">
                      {formatDateTime(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
