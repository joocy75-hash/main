const fs = require('fs');
const file = './src/stores/profile-store.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /interface PaginatedResponse<T> \{\n  data: T\[\];\n  total: number;\n  page: number;\n  limit: number;\n  hasMore: boolean;\n\}/m,
  `interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}`
);

// Fix fetchBets
code = code.replace(
  /bets: data\.data,\n\s*betsTotal: data\.total,\n\s*betsPage: data\.page,\n\s*betsHasMore: data\.hasMore,/m,
  `bets: data.items,
        betsTotal: data.pagination.total,
        betsPage: data.pagination.page,
        betsHasMore: data.pagination.page < data.pagination.totalPages,`
);

// Fix fetchMoneyLogs
code = code.replace(
  /moneyLogs: data\.data,\n\s*moneyLogsTotal: data\.total,/m,
  `moneyLogs: data.items,
        moneyLogsTotal: data.pagination.total,`
);

// Fix fetchPointLogs
code = code.replace(
  /pointLogs: data\.data,\n\s*pointLogsTotal: data\.total,/m,
  `pointLogs: data.items,
        pointLogsTotal: data.pagination.total,`
);

// Fix fetchLoginHistory
code = code.replace(
  /const data = await api\.get<LoginHistory\[\]>\('\/api\/profile\/login-history'\);\n\s*set\(\{ loginHistory: data, isLoading: false \}\);/m,
  `const data = await api.get<PaginatedResponse<LoginHistory>>('/api/profile/login-history');
      set({ loginHistory: data.items, isLoading: false });`
);

// Fix fetchAffiliateMembers
code = code.replace(
  /set\(\{ affiliateMembers: data\.data \}\);/m,
  `set({ affiliateMembers: data.items });`
);

// Fix fetchCommissionRecords
code = code.replace(
  /set\(\{ commissionRecords: data\.data \}\);/m,
  `set({ commissionRecords: data.items });`
);

// Fix fetchMessages
code = code.replace(
  /messages: data\.data,\n\s*messagesTotal: data\.total,/m,
  `messages: data.items,
        messagesTotal: data.pagination.total,`
);

// Fix fetchInquiries
code = code.replace(
  /const data = await api\.get<Inquiry\[\]>\('\/api\/inquiries'\);\n\s*set\(\{ inquiries: data, isLoading: false \}\);/m,
  `const data = await api.get<PaginatedResponse<Inquiry>>('/api/inquiries');
      set({ inquiries: data.items, isLoading: false });`
);

fs.writeFileSync(file, code);
