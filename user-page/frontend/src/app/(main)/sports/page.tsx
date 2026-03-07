'use client';

import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useSportsStore, SportEvent } from '@/stores/sports-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  SPORT_ICONS,
  getFlagAndName,
  type Bet,
} from '@/lib/sports-constants';

/* ───────────────── Constants ───────────────── */
const BET_LIMITS = { MIN: 5_000, MAX: 7_000_000, WIN_MAX: 20_000_000 } as const;

/* ───────────────── Helpers ───────────────── */

const fmtDateShort = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtNow = () => {
  const n = new Date();
  const days = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];
  const pad = (v: number) => String(v).padStart(2, '0');
  return {
    date: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())} (${days[n.getDay()]})`,
    time: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
  };
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function SportsPage() {
  const { 
    selectedSport, setSelectedSport,
    sportEvents, fetchSportEvents,
    sportCategories, fetchSportCategories
  } = useSportsStore();

  const [betSlip, setBetSlip] = useState<Bet[]>([]);
  const [betAmount, setBetAmount] = useState('');
  const [slipTab, setSlipTab] = useState<'cart' | 'history'>('cart');
  const [clock, setClock] = useState(fmtNow());
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false);
  const { user: authUser } = useAuthStore();

  useEffect(() => { const t = setInterval(() => setClock(fmtNow()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    fetchSportCategories();
    fetchSportEvents();
  }, [fetchSportCategories, fetchSportEvents]);

  // Refetch when selected sport changes
  useEffect(() => {
    fetchSportEvents('LIVE', selectedSport);
  }, [selectedSport, fetchSportEvents]);

  /* ── Grouping ── */
  const grouped = useMemo(() => {
    const m: Record<string, SportEvent[]> = {};
    sportEvents.forEach(e => { (m[e.leagueKo || e.league] ??= []).push(e); });
    return m;
  }, [sportEvents]);

  /* ── Bet logic ── */
  const toggleBet = (b: Bet) => setBetSlip(p => p.find(s => s.eventId === b.eventId && s.type === b.type) ? p.filter(s => !(s.eventId === b.eventId && s.type === b.type)) : [...p, b]);
  const isSel = (eid: number, t: string) => betSlip.some(s => s.eventId === eid && s.type === t);
  const removeBet = (eid: number, t: string) => setBetSlip(p => p.filter(s => !(s.eventId === eid && s.type === t)));
  const totalOdds = betSlip.length > 0 ? betSlip.reduce((a, s) => a * s.odds, 1) : 0;
  const amt = parseFloat(betAmount.replace(/,/g, '')) || 0;
  const payout = Math.floor(amt * totalOdds);

  const formatNum = (v: string) => {
    const num = parseFloat(v.replace(/,/g, '')) || 0;
    return num === 0 ? '' : num.toLocaleString();
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#333] font-sans pb-20 lg:pb-10 flex border-t border-[#ddd]">
      {/* Container simulating the main width of the site */}
      <div className="flex-1 max-w-[1300px] mx-auto flex gap-4 mt-0 px-2">
        
        {/* ═════════ LEFT: TABLE ═════════ */}
        <div className="flex-1 min-w-0">
          
          {/* ── Sport Icons Grid ── */}
          <div className="flex gap-2 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide">
            {sportCategories.map(sp => {
              const on = selectedSport === sp.code;
              return (
                <button
                  key={sp.code}
                  onClick={() => setSelectedSport(sp.code)}
                  className={cn(
                    'shrink-0 w-[64px] lg:w-[78px] h-[80px] lg:h-[96px] rounded-xl flex flex-col items-center justify-between py-2 transition-all transform hover:-translate-y-1 relative overflow-hidden',
                    on
                      ? 'bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] border-none text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.6),_0_5px_10px_rgba(30,106,219,0.5)]'
                      : 'bg-gradient-to-b from-[#ffffff] to-[#e4e9f0] border-none text-[#444] shadow-[inset_0_-4px_0_rgba(180,186,195,0.4),_inset_0_3px_5px_rgba(255,255,255,0.9),_0_4px_6px_rgba(0,0,0,0.06)] hover:shadow-[inset_0_-4px_0_rgba(180,186,195,0.4),_inset_0_3px_5px_rgba(255,255,255,0.9),_0_6px_10px_rgba(0,0,0,0.1)]'
                  )}
                >
                  {/* Icon Circle */}
                  <div className={cn(
                    'w-[38px] h-[38px] lg:w-[46px] lg:h-[46px] rounded-full flex items-center justify-center text-xl lg:text-2xl z-10 transition-all',
                    on 
                      ? 'bg-gradient-to-br from-white/30 to-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] ring-1 ring-white/30' 
                      : 'bg-gradient-to-br from-[#ffffff] to-[#f0f3f6] shadow-[inset_0_3px_6px_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.08)] ring-1 ring-[#e2e7ec]'
                  )}>
                    {sp.icon}
                  </div>
                  
                  {/* Label */}
                  <span className={cn('text-[12px] font-extrabold z-10 mt-[2px] drop-shadow-sm', on ? 'text-white' : 'text-[#5b6571]')}>{sp.nameKo || sp.name}</span>
                  
                  {/* Count Pill */}
                  <span className={cn(
                    'text-[10px] w-12 text-center rounded-full leading-tight py-[3px] mt-1 z-10 font-black tracking-wide',
                    on 
                      ? 'bg-[#0b4792] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),_0_1px_1px_rgba(255,255,255,0.2)]' 
                      : 'bg-[#8995a5] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),_0_1px_1px_rgba(255,255,255,0.8)]'
                  )}>
                    {sp.eventCount || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e5e9f0] text-[#444] overflow-hidden">
              
            {/* ── Header Columns ── */}
            <div className="hidden lg:flex bg-gradient-to-b from-[#fafbfc] to-[#f0f3f6] border-b border-[#e2e6eb] py-[10px] text-[12px] shadow-[inset_0_1px_0_white]">
              <div className="w-[100px] text-center font-extrabold text-[#6b7583]">경기일시</div>
              <div className="w-[80px] text-center font-extrabold text-[#6b7583]">구분</div>
              <div className="flex-[3] text-center font-extrabold text-[#6b7583]">승(홈)오버 <span className="text-[#ff5c5c] text-[9px] ml-1 mb-1 inline-block drop-shadow-sm">▲</span></div>
              <div className="flex-[1] min-w-[60px] max-w-[70px] text-center font-extrabold text-[#6b7583]">무/핸/합</div>
              <div className="flex-[3] text-center font-extrabold text-[#6b7583]">패(원정)언더 <span className="text-[#4da1ff] text-[9px] ml-1 mb-1 inline-block drop-shadow-sm">▼</span></div>
              <div className="w-[70px] text-center font-extrabold text-[#6b7583]">정보</div>
            </div>

            {/* ── Bonus Banner ── */}
            <div className="m-3 bg-white rounded-xl border border-[#eab16f] shadow-[0_4px_10px_rgba(234,177,111,0.2)] hidden lg:flex items-stretch h-[86px] overflow-hidden relative">
              {/* Glossy top edge overlay */}
              <div className="absolute inset-x-0 top-0 h-[40%] bg-white/20 z-10 pointer-events-none"></div>

              {/* Red Gift Section */}
              <div className="w-[76px] bg-gradient-to-b from-[#ff6b52] to-[#da2a13] flex items-center justify-center shrink-0 border-r border-[#ba200e] shadow-[inset_0_-4px_0_rgba(0,0,0,0.15),_inset_0_2px_4px_rgba(255,255,255,0.3)] z-0">
                <span className="text-4xl drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)] transform hover:scale-110 transition-transform">🎁</span>
              </div>
              
              {/* Orange Content Section */}
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#fff6e0] z-0">
                {/* Top orange line */}
                <div className="h-[55%] bg-gradient-to-r from-[#ffbd59] to-[#f29432] relative flex items-center pl-5 border-b border-[#e28322] shadow-[inset_0_-2px_0_rgba(0,0,0,0.08),_inset_0_2px_4px_rgba(255,255,255,0.4)]">
                  {/* Fake Slanted effect */}
                  <div className="absolute right-0 top-0 bottom-0 w-[45%] bg-gradient-to-r from-[#fff6e0] to-[#fff6e0]" style={{ clipPath: 'polygon(40px 0%, 100% 0, 100% 100%, 0% 100%)' }}></div>
                  <span className="relative z-10 text-[#fffbf0] font-black tracking-wider text-[22px] drop-shadow-[0_2px_3px_rgba(180,80,0,0.6)]">
                    보너스 이벤트
                  </span>
                </div>
                
                {/* Bottom tools */}
                <div className="flex-1 flex items-center px-4 gap-4 text-[12px]">
                  <span className="font-extrabold text-[#444] tracking-tighter shrink-0">{fmtDateShort(new Date().toISOString())}</span>
                  <span className="font-black text-[#d67a1b] shrink-0 drop-shadow-sm">보너스</span>
                  
                  <div className="flex gap-[6px] items-center flex-1 justify-center shrink-0">
                    <div className="bg-gradient-to-b from-[#ffb15c] to-[#e87a1a] border-[#c4600e] text-white px-[40px] py-[3px] rounded-full shadow-[inset_0_-2px_0_rgba(0,0,0,0.15),_0_2px_4px_rgba(232,122,26,0.3)] flex items-center gap-[40px] font-bold">
                      <span className="drop-shadow-sm">다폴더 보너스 배당</span><span className="opacity-40">-</span>
                    </div>
                    <div className="bg-gradient-to-b from-[#ffb15c] to-[#e87a1a] border-[#c4600e] text-white px-3 py-[3px] rounded-full font-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.15),_0_2px_4px_rgba(232,122,26,0.3)] z-10">
                      VS
                    </div>
                    <div className="bg-gradient-to-b from-[#ffb15c] to-[#e87a1a] border-[#c4600e] text-white px-[40px] py-[3px] rounded-full shadow-[inset_0_-2px_0_rgba(0,0,0,0.15),_0_2px_4px_rgba(232,122,26,0.3)] flex items-center gap-[10px] font-bold">
                      <span className="opacity-40">-</span><span className="drop-shadow-sm">◀ 3폴더 이상 배팅 시</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex items-center justify-between px-4 border-b border-[#e5e9f0] pb-3 mb-[12px] bg-gradient-to-b from-white to-[#fcfcfd]">
              <div className="flex items-center gap-2 bg-[#f4f6f9] px-3 py-1.5 rounded-lg shadow-inner border border-[#e8eaef]">
                <span className="text-[18px]">📁</span>
                <span className="text-[14px] font-extrabold text-[#4a5568]">전체</span>
              </div>
              <div className="flex gap-[8px]">
                <button className="h-[32px] border-none bg-gradient-to-b from-white to-[#f0f3f6] px-3 text-[12px] font-bold rounded-lg flex items-center gap-1.5 text-[#5b6571] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#d1d7e0] hover:to-[#e4e9ef]">
                  🌐 리그 선택 <span className="text-[9px] text-[#8995a5] ml-1">▼</span>
                </button>
                <button className="h-[32px] border-none bg-gradient-to-b from-white to-[#f0f3f6] px-3 text-[12px] font-bold rounded-lg flex items-center gap-1.5 text-[#5b6571] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#d1d7e0] hover:to-[#e4e9ef]">
                  🌐 국가선택 <span className="text-[9px] text-[#8995a5] ml-1">▼</span>
                </button>
              </div>
            </div>

            {/* ── League Sections ── */}
            <div className="px-3 pb-4">
              {Object.entries(grouped).map(([league, events]) => {
                const { flag, displayName } = getFlagAndName(league, events[0]);
                const sportCode = events[0].sport;
                const icon = SPORT_ICONS[sportCode] ?? '🎾';
                const leagueLogo = events[0].leagueLogo;
                const countryFlag = events[0].countryFlag;

                return (
                  <div key={league} className="mb-5 bg-white rounded-xl border border-[#e5e9f0] shadow-sm overflow-hidden">
                    {/* League Header - Glossy 3D Blue */}
                    <div className="relative bg-gradient-to-r from-[#2c7de0] via-[#4da1ff] to-[#eaf2fc] h-[38px] flex items-center overflow-hidden border-b border-[#1e6adb]">
                       {/* Gloss highlight */}
                      <div className="absolute inset-0 h-[50%] bg-gradient-to-b from-white/30 to-transparent"></div>
                      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#1e6adb] to-[#3a8ef2] flex items-center px-3 lg:px-4 text-white text-[13px] lg:text-[14px] font-extrabold gap-2 min-w-0 lg:min-w-[320px] max-w-[85%] lg:max-w-none shadow-[4px_0_10px_rgba(0,0,0,0.2)]"
                          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 25px) 100%, 0 100%)', zIndex: 1 }}>
                        
                        <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center gap-2">
                          {/* 3D League Badge */}
                          <div className="size-[22px] rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-white/50 flex items-center justify-center text-[12px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_2px_4px_rgba(0,0,0,0.3)] shrink-0 overflow-hidden text-[#475569]">
                            <LeagueBadge leagueLogo={leagueLogo} countryFlag={countryFlag} flag={flag} />
                          </div>
                          
                          {/* League Name Block */}
                          <span className="bg-white/10 px-2.5 py-0.5 rounded flex items-center gap-1.5 border border-white/20 shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]">
                            <span className="text-[12px] opacity-90">{icon}</span> 
                            <span className="tracking-wide text-[13.5px] truncate max-w-[200px]">{displayName}</span>
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Matches */}
                    <div className="px-2 py-2 bg-[#fbfcfd]">
                      {events.map((ev: SportEvent, idx: number) => {
                        const o = ev.odds || { h: '1.90', d: 'VS', a: '1.90' };
                        const locked = o.h === '🔒';
                        const noDraw = o.d === 'VS';
                        const home = ev.homeTeam.nameKo || ev.homeTeam.name;
                        const away = ev.awayTeam.nameKo || ev.awayTeam.name;
                        const [datePart, timePart] = fmtDateShort(ev.startTime).split(' ');

                        return (
                          <div key={ev.id} className={cn("flex flex-col lg:flex-row lg:items-center py-[10px]", idx !== events.length -1 && "border-b border-[#edf1f5]")}>
                            {/* Mobile: Compact date row */}
                            <div className="flex lg:hidden items-center gap-2 px-3 pb-2 text-[11px] text-[#6b7583] font-bold">
                              <span>{datePart}</span>
                              <span className="text-[#3b82f6]">{timePart}</span>
                              <span className="ml-auto text-[10px] bg-white border border-[#e2e8f0] px-1.5 py-0.5 rounded font-extrabold text-[#2d3748]">1x2</span>
                            </div>
                            {/* Desktop: Left Date/Type */}
                            <div className="hidden lg:flex w-[184px] justify-between px-3 items-center shrink-0">
                              <div className="text-[11.5px] text-[#6b7583] leading-[16px] font-bold tracking-tight">
                                {datePart}<br/>
                                <span className="text-[#3b82f6] text-[13px]">{timePart}</span>
                              </div>
                              <div className="text-[11px] text-center leading-[15px] bg-white border border-[#e2e8f0] px-2 py-1 rounded-md shadow-sm">
                                <div className="font-extrabold text-[#2d3748]">1x2</div>
                                <div className="text-[9.5px] text-[#a0aec0] tracking-tighter">(연장미포함)</div>
                              </div>
                            </div>

                            {/* Middle: Odds Block 3D Container */}
                            <div className="flex-1 flex mx-2 lg:mx-0 lg:max-w-[700px] border border-[#d1d7e0] rounded-xl bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] h-[48px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),_0_2px_5px_rgba(0,0,0,0.04)] p-[2px] items-center">
                              {/* Home Team */}
                              <div className="flex-[3] flex items-center px-2 lg:px-4 gap-1.5 lg:gap-2.5 text-[12px] lg:text-[13.5px] text-[#2d3748] font-extrabold tracking-tight justify-start overflow-hidden">
                                <div className="size-5 lg:size-7 rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-[#cbd5e1] flex items-center justify-center text-[10px] lg:text-[12px] font-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden text-[#475569]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {ev.homeTeam.logo ? <img src={ev.homeTeam.logo} alt="" className="w-full h-full object-contain p-0.5" /> : home.substring(0,1)}
                                </div>
                                <span className="truncate">{home}</span>
                              </div>
                              
                              {/* Odds Home */}
                              <OddsButton 
                                value={o.h} locked={locked} selected={isSel(ev.id, 'h')} 
                                onClick={() => !locked && toggleBet({ eventId: ev.id, league: displayName, type: 'h', label: '승(홈)', odds: +o.h, home, away })} 
                              />
                              
                              <div className="w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent mx-1"></div>

                              {/* Odds Draw */}
                              {noDraw ? (
                                <div className="flex-[1] min-w-[40px] lg:min-w-[60px] max-w-[70px] flex items-center justify-center bg-transparent text-[13px] lg:text-[14px] font-black text-[#94a3b8] drop-shadow-sm h-full">VS</div>
                              ) : (
                                <OddsButton 
                                  value={o.d} locked={locked} selected={isSel(ev.id, 'd')}
                                  onClick={() => !locked && toggleBet({ eventId: ev.id, league: displayName, type: 'd', label: '무', odds: +o.d, home, away })} 
                                />
                              )}

                              <div className="w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent mx-1"></div>

                              {/* Odds Away */}
                              <OddsButton 
                                value={o.a} locked={locked} selected={isSel(ev.id, 'a')}
                                onClick={() => !locked && toggleBet({ eventId: ev.id, league: displayName, type: 'a', label: '패(원정)', odds: +o.a, home, away })} 
                              />

                              {/* Away Team */}
                              <div className="flex-[3] flex items-center px-2 lg:px-4 gap-1.5 lg:gap-2.5 text-[12px] lg:text-[13.5px] text-[#2d3748] font-extrabold tracking-tight justify-end overflow-hidden">
                                <span className="truncate text-right">{away}</span>
                                <div className="size-5 lg:size-7 rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-[#cbd5e1] flex items-center justify-center text-[10px] lg:text-[12px] font-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden text-[#475569]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {ev.awayTeam.logo ? <img src={ev.awayTeam.logo} alt="" className="w-full h-full object-contain p-0.5" /> : away.substring(0,1)}
                                </div>
                              </div>
                            </div>

                            {/* Right: +더보기 */}
                            <div className="w-[80px] shrink-0 hidden lg:flex justify-center items-center">
                               <button className="bg-gradient-to-b from-[#6b7583] to-[#4a5568] text-white text-[11px] font-bold px-[12px] py-[8px] rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_2px_4px_rgba(0,0,0,0.15)] hover:from-[#5b6571] hover:to-[#3a4454] transform hover:translate-y-[1px] hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_1px_2px_rgba(0,0,0,0.15)] transition-all">
                                 + 더보기
                               </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* ═════════ RIGHT: BET SLIP ═════════ */}
        <div className="w-[300px] shrink-0 hidden lg:block">
          <div className="bg-white border-0 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] sticky top-[80px] overflow-hidden ring-1 ring-[#e5e9f0]">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-[10px] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white]">
              <div className="text-[12px] text-[#64748b] font-bold">
                 <div>{clock.date}</div>
                 <div className="text-[#3b82f6] font-black text-[15px] tracking-tight">{clock.time}</div>
              </div>
              <div className="flex gap-[6px]">
                <button onClick={() => setBetSlip([])} className="w-[34px] h-[34px] flex items-center justify-center bg-gradient-to-b from-white to-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#ef4444] text-[15px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#e2e8f0] transform hover:-translate-y-[1px] transition-all">🗑️</button>
                <button className="w-[34px] h-[34px] flex items-center justify-center bg-gradient-to-b from-white to-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#3b82f6] text-[15px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#e2e8f0] transform hover:-translate-y-[1px] transition-all">🔄</button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-[#cbd5e1] overflow-visible z-10 relative bg-[#f8fafc] p-1 gap-1">
              <button onClick={() => setSlipTab('cart')} className={cn("flex-[1.2] py-[12px] text-[14px] font-black flex items-center justify-center gap-[6px] relative rounded-md transition-all", slipTab === 'cart' ? 'bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_6px_rgba(30,106,219,0.3)]' : 'bg-transparent text-[#64748b] hover:bg-[#e2e8f0] hover:shadow-inner')}>
                🛒 베팅카트 
                <span className={cn("text-white text-[10px] font-bold rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-sm", slipTab === 'cart' ? 'bg-[#ff5c5c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]' : 'bg-[#94a3b8]')}>{betSlip.length}</span>
              </button>
              <button onClick={() => setSlipTab('history')} className={cn("flex-1 py-[12px] text-[14px] font-black flex items-center justify-center gap-[6px] relative rounded-md transition-all", slipTab === 'history' ? 'bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_6px_rgba(30,106,219,0.3)]' : 'bg-transparent text-[#64748b] hover:bg-[#e2e8f0] hover:shadow-inner')}>
                📋 베팅내역 
                <span className={cn("text-white text-[10px] font-bold rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-sm", slipTab === 'history' ? 'bg-[#ff5c5c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]' : 'bg-[#94a3b8]')}>0</span>
              </button>
            </div>
            
            {/* Slips */}
            <div className="bg-[#f1f5f9] text-center text-[13px] font-bold text-[#94a3b8] border-b border-[#e2e8f0] shadow-inner">
              {betSlip.length === 0 ? (
                <div className="py-8">베팅을 선택하세요.</div>
              ) : (
                <div className="flex flex-col gap-[3px] max-h-[220px] overflow-y-auto p-1.5 scrollbar-hide">
                  {betSlip.map(b => (
                    <div key={`${b.eventId}-${b.type}`} className="bg-white rounded-lg text-left p-[10px] border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.03)] relative">
                      <button onClick={() => removeBet(b.eventId, b.type)} className="absolute top-2 right-2 text-[#cbd5e1] hover:text-[#ef4444] text-[18px] font-black h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#fee2e2] transition-colors">×</button>
                      <div className="text-[11.5px] text-[#64748b] font-extrabold pr-4 tracking-tight">{b.league}</div>
                      <div className="text-[12.5px] font-black text-[#1e293b] mt-1.5">{b.home} <span className="text-[#94a3b8] font-bold mx-1">vs</span> {b.away}</div>
                      <div className="flex justify-between items-end mt-2.5">
                        <span className="text-[#3b82f6] font-extrabold text-[12.5px] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">{b.label}</span>
                        <span className="text-[#ef4444] font-black text-[15px]">{b.odds.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Stats Area */}
            <div className="p-4 bg-white text-[#475569] font-bold space-y-[12px] text-[13px]">
               <div className="flex justify-between items-center pb-[10px] border-b border-[#e2e8f0] border-dashed">
                 <span className="text-[#64748b]">보유금액</span>
                 <span className="text-[18px] font-black text-[#3b82f6] drop-shadow-sm">{Number(authUser?.balance || 0).toLocaleString()} <span className="text-[13px] text-[#94a3b8]">원</span></span>
               </div>
               
               <div className="space-y-[8px] text-[12.5px]">
                 <div className="flex justify-between items-center">
                   <span className="text-[#94a3b8] font-medium">베팅 최소금액</span>
                   <span className="text-[#ef4444] font-extrabold">{BET_LIMITS.MIN.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[#94a3b8] font-medium">베팅 최대금액</span>
                   <span className="font-extrabold text-[#334155]">{BET_LIMITS.MAX.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[#94a3b8] font-medium">적중 최대금액</span>
                   <span className="font-extrabold text-[#334155]">{BET_LIMITS.WIN_MAX.toLocaleString()}</span>
                 </div>
               </div>

               <div className="flex justify-between items-center py-[12px] my-[10px] border-t border-b border-[#e2e8f0] bg-gradient-to-r from-[#fef2f2] to-white px-2 rounded-md">
                 <span className="font-extrabold text-[#7f1d1d]">배당률합계</span>
                 <span className="text-[18px] font-black text-[#ef4444] drop-shadow-sm">{totalOdds > 0 ? totalOdds.toFixed(2) : '1.00'}</span>
               </div>

               <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0] shadow-inner">
                 <span className="text-[#64748b] font-extrabold ml-1">베팅금액</span>
                 <input 
                   type="text" 
                   value={betAmount === '' ? '' : formatNum(betAmount)}
                   onChange={(e) => {
                     const val = e.target.value.replace(/[^0-9]/g, '');
                     setBetAmount(val);
                   }}
                   className="w-[130px] h-[34px] bg-white border border-[#cbd5e1] rounded-md text-right px-3 text-[#ef4444] font-black text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]" 
                   placeholder="0" 
                 />
               </div>

               <div className="flex justify-between items-center px-1">
                 <span className="text-[#64748b] font-extrabold">적중예상금액</span>
                 <span className="text-[18px] font-black text-[#3b82f6] drop-shadow-sm">{payout > 0 ? formatNum(payout.toString()) : '0'}</span>
               </div>

               {/* Add Amount Buttons */}
               <div className="pt-3">
                 <div className="grid grid-cols-3 gap-[6px] mb-[6px]">
                   {[5000, 10000, 50000, 100000, 500000, 1000000].map((v) => (
                     <button 
                       key={v}
                       onClick={() => setBetAmount((amt + v).toString())}
                       className="h-[36px] bg-gradient-to-b from-white to-[#f1f5f9] border-none ring-1 ring-[#cbd5e1] text-[#475569] text-[13px] font-black rounded-lg shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_3px_rgba(0,0,0,0.05)] hover:from-[#f8fafc] hover:to-[#e2e8f0] transform hover:-translate-y-[1px] transition-all"
                     >{v.toLocaleString()}</button>
                   ))}
                 </div>
                 <div className="grid grid-cols-3 gap-[6px]">
                   <button onClick={() => setBetAmount(Math.floor(amt/2).toString())} className="h-[38px] bg-gradient-to-b from-[#64748b] to-[#334155] border-none text-white text-[13px] font-black rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_3px_5px_rgba(0,0,0,0.2)] hover:from-[#475569] hover:to-[#1e293b] transform hover:-translate-y-[1px] transition-all">하프</button>
                   <button onClick={() => setBetAmount(BET_LIMITS.MAX.toString())} className="h-[38px] bg-gradient-to-b from-[#64748b] to-[#334155] border-none text-white text-[13px] font-black rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_3px_5px_rgba(0,0,0,0.2)] hover:from-[#475569] hover:to-[#1e293b] transform hover:-translate-y-[1px] transition-all">최대</button>
                   <button onClick={() => setBetAmount('')} className="h-[38px] bg-gradient-to-b from-[#94a3b8] to-[#475569] border-none text-white text-[13px] font-black rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_3px_5px_rgba(0,0,0,0.2)] hover:from-[#cbd5e1] hover:to-[#64748b] transform hover:-translate-y-[1px] transition-all">정정</button>
                 </div>
               </div>

               <button
                 disabled
                 className="w-full mt-4 h-[52px] rounded-xl bg-[#6b7280] text-[17px] font-bold text-white cursor-not-allowed opacity-60"
                 title="스포츠 베팅 기능은 준비 중입니다"
               >
                 준비 중
               </button>
               <p className="mt-2 text-center text-[12px] text-[#98a7b5]">
                 스포츠 베팅 서비스는 곧 오픈됩니다
               </p>
            </div>
          </div>
        </div>

      </div>

      {/* ═════════ MOBILE: Floating Bet Slip ═════════ */}
      {/* FAB */}
      <button
        onClick={() => setMobileSlipOpen(!mobileSlipOpen)}
        className="fixed bottom-20 right-4 z-50 lg:hidden w-[56px] h-[56px] rounded-full bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[0_4px_12px_rgba(30,106,219,0.5)] flex items-center justify-center text-2xl active:scale-95 transition-transform"
      >
        🛒
        {betSlip.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#ff5c5c] text-white text-[10px] font-black rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-sm">{betSlip.length}</span>
        )}
      </button>

      {/* Mobile Bet Slip Overlay */}
      {mobileSlipOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSlipOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-[#d1d7e0] rounded-full" />
            </div>
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-[#e2e8f0]">
              <span className="font-black text-[15px] text-[#1e293b]">🛒 베팅카트 ({betSlip.length})</span>
              <div className="flex gap-2">
                <button onClick={() => setBetSlip([])} className="text-[#94a3b8] hover:text-[#ef4444] text-lg">🗑️</button>
                <button onClick={() => setMobileSlipOpen(false)} className="text-[#94a3b8] hover:text-[#1e293b] text-lg font-black">✕</button>
              </div>
            </div>
            {/* Slips */}
            <div className="p-3">
              {betSlip.length === 0 ? (
                <div className="py-8 text-center text-[13px] font-bold text-[#94a3b8]">베팅을 선택하세요.</div>
              ) : (
                <div className="flex flex-col gap-2 mb-3">
                  {betSlip.map(b => (
                    <div key={`m-${b.eventId}-${b.type}`} className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0] relative">
                      <button onClick={() => removeBet(b.eventId, b.type)} className="absolute top-2 right-2 text-[#cbd5e1] hover:text-[#ef4444] text-[16px] font-black">×</button>
                      <div className="text-[11px] text-[#64748b] font-extrabold">{b.league}</div>
                      <div className="text-[12px] font-black text-[#1e293b] mt-1">{b.home} <span className="text-[#94a3b8] mx-1">vs</span> {b.away}</div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[#3b82f6] font-extrabold text-[12px] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">{b.label}</span>
                        <span className="text-[#ef4444] font-black text-[14px]">{b.odds.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Stats + Bet */}
            <div className="px-4 pb-6 space-y-3 border-t border-[#e2e8f0] pt-3">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#64748b] font-extrabold">배당률합계</span>
                <span className="text-[16px] font-black text-[#ef4444]">{totalOdds > 0 ? totalOdds.toFixed(2) : '1.00'}</span>
              </div>
              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                <span className="text-[#64748b] font-extrabold text-[13px] ml-1">베팅금액</span>
                <input
                  type="text"
                  value={betAmount === '' ? '' : formatNum(betAmount)}
                  onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-[120px] h-[34px] bg-white border border-[#cbd5e1] rounded-md text-right px-3 text-[#ef4444] font-black text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[5000, 10000, 50000, 100000].map((v) => (
                  <button key={v} onClick={() => setBetAmount((amt + v).toString())} className="h-[32px] bg-[#f1f5f9] text-[#475569] text-[12px] font-bold rounded-lg border border-[#e2e8f0]">{(v/1000)}K</button>
                ))}
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#64748b] font-extrabold">적중예상금액</span>
                <span className="text-[16px] font-black text-[#3b82f6]">{payout > 0 ? formatNum(payout.toString()) : '0'}</span>
              </div>
              <button
                disabled
                className="w-full h-[48px] rounded-xl bg-[#6b7280] text-[16px] font-bold text-white cursor-not-allowed opacity-60"
                title="스포츠 베팅 기능은 준비 중입니다"
              >
                준비 중
              </button>
              <p className="mt-2 text-center text-[12px] text-[#98a7b5]">
                스포츠 베팅 서비스는 곧 오픈됩니다
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Sub-Components ═══════════════ */

interface OddsButtonProps {
  value: string;
  locked: boolean;
  selected: boolean;
  onClick: () => void;
}

function LeagueBadge({ leagueLogo, countryFlag, flag }: { leagueLogo?: string; countryFlag?: string; flag: string }) {
  if (leagueLogo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={leagueLogo} alt="" className="w-full h-full object-contain p-[1px] bg-white" />;
  }
  if (countryFlag) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={countryFlag} alt="" className="w-full h-full object-cover" />;
  }
  return <span className="drop-shadow-sm">{flag}</span>;
}

function OddsButton({ value, locked, selected, onClick }: OddsButtonProps) {
  if (locked) {
    return (
      <div className="flex-[1] min-w-[40px] lg:min-w-[60px] max-w-[70px] flex items-center justify-center bg-transparent text-[#94a3b8] text-[15px] drop-shadow-sm">
        🔒
      </div>
    );
  }
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-[1] min-w-[40px] lg:min-w-[60px] max-w-[70px] flex items-center justify-center text-[13px] lg:text-[14px] font-black transition-all rounded-lg mx-0.5",
        selected 
          ? "bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.4),_0_3px_5px_rgba(30,106,219,0.4)] transform -translate-y-[1px]" 
          : "bg-transparent text-[#475569] hover:bg-white hover:shadow-[0_2px_5px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.02)] ring-1 ring-transparent hover:ring-[#e2e8f0]"
      )}
    >
      {value}
    </button>
  );
}
