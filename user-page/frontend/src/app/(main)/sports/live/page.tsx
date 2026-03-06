'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useSportsStore, SportEvent } from '@/stores/sports-store';
import { useAuthStore } from '@/stores/auth-store';
import {
  SPORT_ICONS,
  getFlagAndName,
  type Bet,
} from '@/lib/sports-constants';

/* ───────────────── Live-specific Constants ───────────────── */
const BET_LIMITS = { MIN: 5_000, MAX: 3_000_000, WIN_MAX: 10_000_000 } as const;
const REFRESH_INTERVAL = 10_000; // 10s for live

/* ───────────────── Live Helpers ───────────────── */

const fmtElapsed = (ev: SportEvent) => {
  if (ev.elapsed) return ev.elapsed;
  if (ev.period) return ev.period;
  const mins = Math.floor((Date.now() - new Date(ev.startTime).getTime()) / 60000);
  return `${mins}'`;
};

/** Stable market count derived from event data instead of Math.random() */
const getMarketCount = (ev: SportEvent): number => {
  const base = ((ev.id * 7 + 13) % 15) + 5;
  return base;
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function LiveSportsPage() {
  const {
    selectedSport, setSelectedSport,
    sportEvents, fetchSportEvents,
    sportCategories, fetchSportCategories,
    isLoading,
  } = useSportsStore();

  const [betSlip, setBetSlip] = useState<Bet[]>([]);
  const [betAmount, setBetAmount] = useState('');
  const [mobileSlipOpen, setMobileSlipOpen] = useState(false);
  const { user: authUser } = useAuthStore();
  const prevScoresRef = useRef<Record<number, string>>({});

  // Track score changes for flash animation
  const [flashEvents, setFlashEvents] = useState<Set<number>>(new Set());

  // Initial fetch + auto-refresh (single combined effect)
  useEffect(() => {
    fetchSportCategories();
    fetchSportEvents('LIVE', selectedSport);

    const t = setInterval(() => {
      fetchSportEvents('LIVE', selectedSport);
    }, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [selectedSport, fetchSportCategories, fetchSportEvents]);

  // Detect score changes for flash effect
  useEffect(() => {
    if (!sportEvents?.length) return;
    const newFlash = new Set<number>();
    const newScores: Record<number, string> = {};

    for (const ev of sportEvents) {
      const scoreKey = `${ev.homeTeam.score ?? 0}-${ev.awayTeam.score ?? 0}`;
      newScores[ev.id] = scoreKey;
      const prev = prevScoresRef.current[ev.id];
      if (prev && prev !== scoreKey) {
        newFlash.add(ev.id);
      }
    }
    prevScoresRef.current = newScores;

    if (newFlash.size > 0) {
      setFlashEvents(newFlash);
      const timer = setTimeout(() => setFlashEvents(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [sportEvents]);

  /* -- Grouping by league -- */
  const grouped = useMemo(() => {
    const m: Record<string, SportEvent[]> = {};
    (sportEvents ?? []).forEach(e => {
      if (e.status === 'LIVE') (m[e.leagueKo || e.league] ??= []).push(e);
    });
    return m;
  }, [sportEvents]);

  const liveCount = useMemo(() =>
    (sportEvents ?? []).filter(e => e.status === 'LIVE').length
  , [sportEvents]);

  /* -- Bet logic -- */
  const toggleBet = (b: Bet) => setBetSlip(p => p.find(s => s.eventId === b.eventId && s.type === b.type) ? p.filter(s => !(s.eventId === b.eventId && s.type === b.type)) : [...p, b]);
  const isSel = (eid: number, t: string) => betSlip.some(s => s.eventId === eid && s.type === t);
  const removeBet = (eid: number, t: string) => setBetSlip(p => p.filter(s => !(s.eventId === eid && s.type === t)));
  const totalOdds = betSlip.length > 0 ? betSlip.reduce((a, s) => a * s.odds, 1) : 0;
  const amt = parseFloat(betAmount.replace(/,/g, '')) || 0;
  const payout = Math.floor(amt * totalOdds);
  const formatNum = (v: string) => { const num = parseFloat(v.replace(/,/g, '')) || 0; return num === 0 ? '' : num.toLocaleString(); };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#333] font-sans pb-20 lg:pb-10 flex border-t border-[#ddd]">
      <div className="flex-1 max-w-[1300px] mx-auto flex gap-4 mt-0 px-2">

        {/* ═════════ LEFT: LIVE TABLE ═════════ */}
        <div className="flex-1 min-w-0">

          {/* -- Live Header Badge -- */}
          <div className="flex items-center gap-3 px-3 pt-3 pb-1">
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#dc2626] to-[#ef4444] text-white px-4 py-1.5 rounded-full shadow-[0_2px_8px_rgba(220,38,38,0.4)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              <span className="text-[13px] font-black tracking-wide">LIVE</span>
              <span className="bg-white/20 text-[11px] font-bold px-2 py-0.5 rounded-full">{liveCount}</span>
            </div>
            <span className="text-[12px] text-[#94a3b8] font-medium">{REFRESH_INTERVAL / 1000}&#xCD08; &#xC790;&#xB3D9;&#xC0C8;&#xB85C;&#xACE0;&#xCE68;</span>
            {isLoading && <span className="text-[11px] text-[#3b82f6] animate-pulse font-bold">&#xC5C5;&#xB370;&#xC774;&#xD2B8; &#xC911;...</span>}
          </div>

          {/* -- Sport Category Filter -- */}
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
                      ? 'bg-gradient-to-b from-[#ef4444] to-[#b91c1c] border-none text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.6),_0_5px_10px_rgba(220,38,38,0.5)]'
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
                      ? 'bg-[#7f1d1d] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),_0_1px_1px_rgba(255,255,255,0.2)]' 
                      : 'bg-[#8995a5] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),_0_1px_1px_rgba(255,255,255,0.8)]'
                  )}>
                    {sp.eventCount || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e5e9f0] overflow-hidden">

            {/* -- Header Columns -- */}
            <div className="hidden lg:flex bg-gradient-to-b from-[#fafbfc] to-[#f0f3f6] border-b border-[#e2e6eb] py-[10px] text-[12px] shadow-[inset_0_1px_0_white]">
              <div className="w-[140px] text-center font-extrabold text-[#6b7583]">&#xACBD;&#xACFC;&#xC2DC;&#xAC04;</div>
              <div className="w-[60px] text-center font-extrabold text-[#6b7583]">&#xC2A4;&#xCF54;&#xC5B4;</div>
              <div className="flex-[3] text-center font-extrabold text-[#6b7583]">&#xC2B9;(&#xD648;)</div>
              <div className="flex-[1] min-w-[60px] max-w-[70px] text-center font-extrabold text-[#6b7583]">&#xBB34;/&#xD578;</div>
              <div className="flex-[3] text-center font-extrabold text-[#6b7583]">&#xD328;(&#xC6D0;&#xC815;)</div>
              <div className="w-[70px] text-center font-extrabold text-[#6b7583]">&#xB9C8;&#xCF13;</div>
            </div>

            {/* -- Filter Bar -- */}
            <div className="flex items-center justify-between px-4 border-b border-[#e5e9f0] pb-3 mb-[12px] pt-3 bg-gradient-to-b from-white to-[#fcfcfd]">
              <div className="flex items-center gap-2 bg-[#f4f6f9] px-3 py-1.5 rounded-lg shadow-inner border border-[#e8eaef]">
                <span className="text-[18px]">📁</span>
                <span className="text-[14px] font-extrabold text-[#4a5568]">실시간 라이브</span>
              </div>
              <div className="flex gap-[8px]">
                <button className="h-[32px] border-none bg-gradient-to-b from-white to-[#f0f3f6] px-3 text-[12px] font-bold rounded-lg flex items-center gap-1.5 text-[#5b6571] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#d1d7e0] hover:to-[#e4e9ef]">
                  🌐 리그 선택 <span className="text-[9px] text-[#8995a5] ml-1">▼</span>
                </button>
              </div>
            </div>

            {/* -- League Sections -- */}
            <div className="px-3 pb-4">
              {Object.keys(grouped).length === 0 && !isLoading && (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">&#9917;</div>
                  <p className="text-[#94a3b8] text-[14px] font-bold">&#xD604;&#xC7AC; &#xC9C4;&#xD589; &#xC911;&#xC778; &#xB77C;&#xC774;&#xBE0C; &#xACBD;&#xAE30;&#xAC00; &#xC5C6;&#xC2B5;&#xB2C8;&#xB2E4;</p>
                  <p className="text-[#cbd5e1] text-[12px] mt-1">{REFRESH_INTERVAL / 1000}&#xCD08;&#xB9C8;&#xB2E4; &#xC790;&#xB3D9;&#xC73C;&#xB85C; &#xC0C8;&#xB85C;&#xACE0;&#xCE68;&#xB429;&#xB2C8;&#xB2E4;</p>
                </div>
              )}

              {Object.entries(grouped).map(([league, events]) => {
                const { flag, displayName } = getFlagAndName(league, events[0]);
                const sportCode = events[0].sport;
                const icon = SPORT_ICONS[sportCode] ?? '\uD83C\uDFBE';
                const leagueLogo = events[0].leagueLogo;
                const countryFlag = events[0].countryFlag;

                return (
                  <div key={league} className="mb-4 bg-white rounded-xl border border-[#e5e9f0] shadow-sm overflow-hidden">
                    {/* League Header - Glossy 3D Red for live */}
                    <div className="relative bg-gradient-to-r from-[#dc2626] via-[#ef4444] to-[#fef2f2] h-[38px] flex items-center overflow-hidden border-b border-[#b91c1c]">
                       {/* Gloss highlight */}
                      <div className="absolute inset-0 h-[50%] bg-gradient-to-b from-white/30 to-transparent"></div>
                      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#b91c1c] to-[#dc2626] flex items-center px-3 lg:px-4 text-white text-[13px] lg:text-[14px] font-extrabold gap-2 min-w-0 lg:min-w-[320px] max-w-[85%] lg:max-w-none shadow-[4px_0_10px_rgba(0,0,0,0.2)]"
                          style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 25px) 100%, 0 100%)', zIndex: 1 }}>
                        
                        <div className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center gap-2">
                          {/* 3D League Badge */}
                          <div className="size-[22px] rounded-full bg-gradient-to-b from-white to-[#fecaca] border border-white/50 flex items-center justify-center text-[12px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_2px_4px_rgba(0,0,0,0.3)] shrink-0 overflow-hidden text-[#7f1d1d]">
                            <LeagueBadge leagueLogo={leagueLogo} countryFlag={countryFlag} flag={flag} />
                          </div>
                          
                          {/* League Name Block */}
                          <span className="bg-white/10 px-2.5 py-0.5 rounded flex items-center gap-1.5 border border-white/20 shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]">
                            <span className="text-[12px] opacity-90">{icon}</span> 
                            <span className="tracking-wide text-[13.5px] truncate max-w-[200px]">{displayName}</span>
                          </span>
                          
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold shadow-sm">LIVE {events.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Matches */}
                    <div className="px-2 py-2 bg-[#fbfcfd]">
                      {events.map((ev: SportEvent, idx: number) => {
                        const o = ev.odds || { h: '-', d: 'VS', a: '-' };
                        const locked = o.h === '\uD83D\uDD12';
                        const noDraw = o.d === 'VS';
                        const home = ev.homeTeam.nameKo || ev.homeTeam.name;
                        const away = ev.awayTeam.nameKo || ev.awayTeam.name;
                        const elapsed = fmtElapsed(ev);
                        const isFlashing = flashEvents.has(ev.id);

                        return (
                          <div key={ev.id} className={cn('flex flex-col lg:flex-row lg:items-center py-[10px]', idx !== events.length - 1 && 'border-b border-[#edf1f5]')}>
                            {/* Mobile: elapsed + score row */}
                            <div className="flex lg:hidden items-center gap-2 px-3 pb-2 text-[11px]">
                              <span className="bg-[#dc2626] text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                              <span className="text-[#dc2626] font-black">{elapsed}</span>
                              <span className={cn(
                                'ml-auto font-black text-[13px] text-[#1e293b] transition-all duration-500',
                                isFlashing && 'text-[#dc2626] scale-125 animate-pulse'
                              )}>
                                {ev.homeTeam.score ?? 0} - {ev.awayTeam.score ?? 0}
                              </span>
                            </div>

                            {/* Desktop: Elapsed + Score */}
                            <div className="hidden lg:flex w-[140px] items-center gap-3 px-3 shrink-0">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="bg-[#dc2626] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">LIVE</span>
                                <span className="text-[#dc2626] font-black text-[13px]">{elapsed}</span>
                              </div>
                              {ev.period && <span className="text-[10px] text-[#94a3b8] font-bold">{ev.period}</span>}
                            </div>

                            {/* Desktop: Score */}
                            <div className="hidden lg:flex w-[60px] items-center justify-center shrink-0">
                              <div className={cn(
                                'bg-[#1e293b] text-white text-[14px] font-black px-3 py-1 rounded-lg shadow-sm transition-all duration-500',
                                isFlashing && 'bg-[#dc2626] scale-110 shadow-[0_0_12px_rgba(220,38,38,0.6)]'
                              )}>
                                {ev.homeTeam.score ?? 0} - {ev.awayTeam.score ?? 0}
                              </div>
                            </div>

                            {/* Middle: Odds Block */}
                            <div className="flex-1 flex mx-2 lg:mx-0 lg:max-w-[700px] border border-[#d1d7e0] rounded-xl bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] h-[48px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),_0_2px_5px_rgba(0,0,0,0.04)] p-[2px] items-center">
                              {/* Home */}
                              <div className="flex-[3] flex items-center px-2 lg:px-4 gap-1.5 lg:gap-2.5 text-[12px] lg:text-[13.5px] text-[#2d3748] font-extrabold tracking-tight justify-start overflow-hidden">
                                <div className="size-5 lg:size-7 rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-[#cbd5e1] flex items-center justify-center text-[10px] lg:text-[12px] font-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden text-[#475569]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {ev.homeTeam.logo ? <img src={ev.homeTeam.logo} alt="" className="w-full h-full object-contain p-0.5" /> : home.substring(0, 1)}
                                </div>
                                <span className={cn('truncate transition-colors duration-300', isFlashing && 'text-[#dc2626]')}>{home}</span>
                              </div>

                              <OddsButton value={o.h} locked={locked} selected={isSel(ev.id, 'h')}
                                onClick={() => !locked && toggleBet({ eventId: ev.id, league: displayName, type: 'h', label: '\uC2B9(\uD648)', odds: +o.h, home, away })} />

                              <div className="w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent mx-1" />

                              {noDraw ? (
                                <div className="flex-[1] min-w-[40px] lg:min-w-[60px] max-w-[70px] flex items-center justify-center text-[13px] lg:text-[14px] font-black text-[#94a3b8] drop-shadow-sm h-full">VS</div>
                              ) : (
                                <OddsButton value={o.d} locked={locked} selected={isSel(ev.id, 'd')}
                                  onClick={() => !locked && toggleBet({ eventId: ev.id, league: displayName, type: 'd', label: '\uBB34', odds: +o.d, home, away })} />
                              )}

                              <div className="w-[2px] h-[70%] bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent mx-1" />

                              <OddsButton value={o.a} locked={locked} selected={isSel(ev.id, 'a')}
                                onClick={() => !locked && toggleBet({ eventId: ev.id, league: displayName, type: 'a', label: '\uD328(\uC6D0\uC815)', odds: +o.a, home, away })} />

                              {/* Away */}
                              <div className="flex-[3] flex items-center px-2 lg:px-4 gap-1.5 lg:gap-2.5 text-[12px] lg:text-[13.5px] text-[#2d3748] font-extrabold tracking-tight justify-end overflow-hidden">
                                <span className={cn('truncate text-right transition-colors duration-300', isFlashing && 'text-[#dc2626]')}>{away}</span>
                                <div className="size-5 lg:size-7 rounded-full bg-gradient-to-b from-white to-[#e2e8f0] border border-[#cbd5e1] flex items-center justify-center text-[10px] lg:text-[12px] font-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(0,0,0,0.05)] shrink-0 overflow-hidden text-[#475569]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {ev.awayTeam.logo ? <img src={ev.awayTeam.logo} alt="" className="w-full h-full object-contain p-0.5" /> : away.substring(0, 1)}
                                </div>
                              </div>
                            </div>

                            {/* Right: markets (stable count) */}
                            <div className="w-[80px] shrink-0 hidden lg:flex justify-center items-center pl-2 pr-1">
                              <button className="bg-gradient-to-b from-[#dc2626] to-[#b91c1c] text-white text-[11px] font-black px-3 py-2 rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_2px_4px_rgba(220,38,38,0.4)] hover:from-[#ef4444] hover:to-[#dc2626] transform hover:translate-y-[1px] transition-all ring-1 ring-red-300/30 gap-1 flex items-center justify-center min-w-[50px]">
                                +{getMarketCount(ev)}
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
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-b from-[#dc2626] to-[#b91c1c] text-white">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              <span className="text-[14px] font-black">LIVE BET</span>
              <span className="ml-auto text-[11px] opacity-80">&#xC2E4;&#xC2DC;&#xAC04; &#xBCA0;&#xD305;</span>
            </div>

            {/* Slips */}
            <div className="bg-[#f1f5f9] text-center text-[13px] font-bold text-[#94a3b8] border-b border-[#e2e8f0] shadow-inner">
              {betSlip.length === 0 ? (
                <div className="py-8">
                  <div className="text-2xl mb-2">&#9917;</div>
                  <div>&#xB77C;&#xC774;&#xBE0C; &#xACBD;&#xAE30;&#xB97C; &#xC120;&#xD0DD;&#xD558;&#xC138;&#xC694;</div>
                </div>
              ) : (
                <div className="flex flex-col gap-[3px] max-h-[220px] overflow-y-auto p-1.5 scrollbar-hide">
                  {betSlip.map(b => (
                    <div key={`${b.eventId}-${b.type}`} className="bg-white rounded-lg text-left p-[10px] border border-[#e2e8f0] shadow-sm relative">
                      <button onClick={() => removeBet(b.eventId, b.type)} className="absolute top-2 right-2 text-[#cbd5e1] hover:text-[#ef4444] text-[18px] font-black h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#fee2e2] transition-colors">&times;</button>
                      <div className="text-[11.5px] text-[#64748b] font-extrabold pr-4">{b.league}</div>
                      <div className="text-[12.5px] font-black text-[#1e293b] mt-1.5">{b.home} <span className="text-[#94a3b8] font-bold mx-1">vs</span> {b.away}</div>
                      <div className="flex justify-between items-end mt-2.5">
                        <span className="text-[#dc2626] font-extrabold text-[12.5px] bg-[#fef2f2] px-2 py-0.5 rounded border border-[#fecaca]">{b.label}</span>
                        <span className="text-[#dc2626] font-black text-[15px]">{b.odds.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="p-4 bg-white text-[#475569] font-bold space-y-[12px] text-[13px]">
              <div className="flex justify-between items-center pb-[10px] border-b border-[#e2e8f0] border-dashed">
                <span className="text-[#64748b]">&#xBCF4;&#xC720;&#xAE08;&#xC561;</span>
                <span className="text-[18px] font-black text-[#3b82f6]">{Number(authUser?.balance || 0).toLocaleString()} <span className="text-[13px] text-[#94a3b8]">&#xC6D0;</span></span>
              </div>

              <div className="space-y-[8px] text-[12.5px]">
                <div className="flex justify-between"><span className="text-[#94a3b8]">&#xBCA0;&#xD305; &#xCD5C;&#xC18C;</span><span className="text-[#ef4444] font-extrabold">{BET_LIMITS.MIN.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">&#xBCA0;&#xD305; &#xCD5C;&#xB300;</span><span className="font-extrabold">{BET_LIMITS.MAX.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[#94a3b8]">&#xC801;&#xC911; &#xCD5C;&#xB300;</span><span className="font-extrabold">{BET_LIMITS.WIN_MAX.toLocaleString()}</span></div>
              </div>

              <div className="flex justify-between items-center py-[12px] border-t border-b border-[#e2e8f0] bg-gradient-to-r from-[#fef2f2] to-white px-2 rounded-md">
                <span className="font-extrabold text-[#7f1d1d]">&#xBC30;&#xB2F9;&#xB960;&#xD569;&#xACC4;</span>
                <span className="text-[18px] font-black text-[#dc2626]">{totalOdds > 0 ? totalOdds.toFixed(2) : '1.00'}</span>
              </div>

              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0] shadow-inner">
                <span className="text-[#64748b] font-extrabold ml-1">&#xBCA0;&#xD305;&#xAE08;&#xC561;</span>
                <input
                  type="text"
                  value={betAmount === '' ? '' : formatNum(betAmount)}
                  onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-[130px] h-[34px] bg-white border border-[#cbd5e1] rounded-md text-right px-3 text-[#dc2626] font-black text-[15px] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-[#64748b] font-extrabold">&#xC801;&#xC911;&#xC608;&#xC0C1;&#xAE08;&#xC561;</span>
                <span className="text-[18px] font-black text-[#3b82f6]">{payout > 0 ? formatNum(payout.toString()) : '0'}</span>
              </div>

              <div className="pt-3">
                <div className="grid grid-cols-3 gap-[6px] mb-[6px]">
                  {[5000, 10000, 50000, 100000, 500000, 1000000].map(v => (
                    <button key={v} onClick={() => setBetAmount((amt + v).toString())}
                      className="h-[36px] bg-gradient-to-b from-white to-[#f1f5f9] ring-1 ring-[#cbd5e1] text-[#475569] text-[13px] font-black rounded-lg shadow-sm hover:from-[#f8fafc] hover:to-[#e2e8f0] transition-all">
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-[6px]">
                  <button onClick={() => setBetAmount(Math.floor(amt / 2).toString())} className="h-[38px] bg-gradient-to-b from-[#64748b] to-[#334155] text-white text-[13px] font-black rounded-lg shadow-md">&#xD558;&#xD504;</button>
                  <button onClick={() => setBetAmount(BET_LIMITS.MAX.toString())} className="h-[38px] bg-gradient-to-b from-[#64748b] to-[#334155] text-white text-[13px] font-black rounded-lg shadow-md">&#xCD5C;&#xB300;</button>
                  <button onClick={() => setBetAmount('')} className="h-[38px] bg-gradient-to-b from-[#94a3b8] to-[#475569] text-white text-[13px] font-black rounded-lg shadow-md">&#xC815;&#xC815;</button>
                </div>
              </div>

              <button className="w-full mt-4 h-[52px] bg-gradient-to-b from-[#dc2626] to-[#991b1b] hover:from-[#ef4444] hover:to-[#b91c1c] text-white text-[17px] font-black rounded-xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.3),_0_8px_12px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-50" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-white" />
                </span>
                &#xB77C;&#xC774;&#xBE0C; &#xBCA0;&#xD305;&#xD558;&#xAE30;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ MOBILE FAB ═════════ */}
      <button onClick={() => setMobileSlipOpen(!mobileSlipOpen)}
        className="fixed bottom-20 right-4 z-50 lg:hidden w-[56px] h-[56px] rounded-full bg-gradient-to-b from-[#dc2626] to-[#991b1b] text-white shadow-[0_4px_12px_rgba(220,38,38,0.5)] flex items-center justify-center text-2xl active:scale-95 transition-transform">
        &#9917;
        {betSlip.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#dc2626] text-[10px] font-black rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-sm">{betSlip.length}</span>
        )}
      </button>

      {/* Mobile Bet Slip Overlay */}
      {mobileSlipOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSlipOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex justify-center pt-2 pb-1"><div className="w-10 h-1 bg-[#d1d7e0] rounded-full" /></div>
            <div className="flex justify-between items-center px-4 py-2 border-b border-[#e2e8f0]">
              <span className="font-black text-[15px] text-[#dc2626]">LIVE BET ({betSlip.length})</span>
              <div className="flex gap-2">
                <button onClick={() => setBetSlip([])} className="text-[#94a3b8] hover:text-[#ef4444] text-lg">&#128465;</button>
                <button onClick={() => setMobileSlipOpen(false)} className="text-[#94a3b8] hover:text-[#1e293b] text-lg font-black">&times;</button>
              </div>
            </div>
            <div className="p-3">
              {betSlip.length === 0 ? (
                <div className="py-8 text-center text-[13px] font-bold text-[#94a3b8]">&#xB77C;&#xC774;&#xBE0C; &#xACBD;&#xAE30;&#xB97C; &#xC120;&#xD0DD;&#xD558;&#xC138;&#xC694;</div>
              ) : (
                <div className="flex flex-col gap-2 mb-3">
                  {betSlip.map(b => (
                    <div key={`m-${b.eventId}-${b.type}`} className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0] relative">
                      <button onClick={() => removeBet(b.eventId, b.type)} className="absolute top-2 right-2 text-[#cbd5e1] hover:text-[#ef4444] text-[16px] font-black">&times;</button>
                      <div className="text-[11px] text-[#64748b] font-extrabold">{b.league}</div>
                      <div className="text-[12px] font-black text-[#1e293b] mt-1">{b.home} <span className="text-[#94a3b8] mx-1">vs</span> {b.away}</div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[#dc2626] font-extrabold text-[12px] bg-[#fef2f2] px-2 py-0.5 rounded border border-[#fecaca]">{b.label}</span>
                        <span className="text-[#dc2626] font-black text-[14px]">{b.odds.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 pb-6 space-y-3 border-t border-[#e2e8f0] pt-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#64748b] font-extrabold">&#xBC30;&#xB2F9;&#xB960;&#xD569;&#xACC4;</span>
                <span className="text-[16px] font-black text-[#dc2626]">{totalOdds > 0 ? totalOdds.toFixed(2) : '1.00'}</span>
              </div>
              <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0]">
                <span className="text-[#64748b] font-extrabold text-[13px] ml-1">&#xBCA0;&#xD305;&#xAE08;&#xC561;</span>
                <input type="text" value={betAmount === '' ? '' : formatNum(betAmount)}
                  onChange={(e) => setBetAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-[120px] h-[34px] bg-white border border-[#cbd5e1] rounded-md text-right px-3 text-[#dc2626] font-black text-[15px] focus:outline-none focus:ring-2 focus:ring-[#dc2626]"
                  placeholder="0" />
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[5000, 10000, 50000, 100000].map(v => (
                  <button key={v} onClick={() => setBetAmount((amt + v).toString())} className="h-[32px] bg-[#f1f5f9] text-[#475569] text-[12px] font-bold rounded-lg border border-[#e2e8f0]">{(v / 1000)}K</button>
                ))}
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#64748b] font-extrabold">&#xC801;&#xC911;&#xC608;&#xC0C1;&#xAE08;&#xC561;</span>
                <span className="text-[16px] font-black text-[#3b82f6]">{payout > 0 ? formatNum(payout.toString()) : '0'}</span>
              </div>
              <button className="w-full h-[48px] bg-gradient-to-b from-[#dc2626] to-[#991b1b] text-white text-[16px] font-black rounded-xl shadow-[0_4px_12px_rgba(220,38,38,0.3)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                LIVE &#xBCA0;&#xD305;&#xD558;&#xAE30;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Sub-Components ═══════════════ */

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

function OddsButton({ value, locked, selected, onClick }: { value: string; locked: boolean; selected: boolean; onClick: () => void }) {
  if (locked) {
    return <div className="flex-[1] min-w-[40px] max-w-[70px] flex items-center justify-center text-[#94a3b8] text-[15px]">&#128274;</div>;
  }
  return (
    <button onClick={onClick}
      className={cn(
        'flex-[1] min-w-[40px] max-w-[70px] flex items-center justify-center text-[13px] lg:text-[14px] font-black transition-all rounded-lg mx-0.5',
        selected
          ? 'bg-gradient-to-b from-[#dc2626] to-[#991b1b] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_5px_rgba(220,38,38,0.4)] -translate-y-[1px]'
          : 'bg-transparent text-[#475569] hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-[#e2e8f0]'
      )}>
      {value}
    </button>
  );
}
