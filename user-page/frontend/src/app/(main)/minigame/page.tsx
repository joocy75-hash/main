"use client";

import { useEffect, useState, useMemo, useRef, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useMinigameStore } from "@/stores/minigame-store";
import { useAuthStore } from "@/stores/auth-store";
import type { BepickRound } from "../../../../../shared/types/minigame";

const REFRESH_INTERVAL = 10_000;
const ROUND_INTERVAL = 300;
const DISPLAY_ROUNDS = 30;
const BET_LIMITS = { MIN: 5_000, MAX: 7_000_000, WIN_MAX: 20_000_000 } as const;

const IFRAME_URLS: Record<string, string> = {
  powerball: "https://bepick.net/live/eosball5m",
  ladder: "https://bepick.net/live/powerladder",
};

// --- Label helpers ---
const oddEvenLabel = (v: 1 | 2) => (v === 1 ? "홀" : "짝");
const underOverLabel = (v: 1 | 2) => (v === 1 ? "언더" : "오버");
const smlLabel = (v: 1 | 2 | 3) => (v === 1 ? "소" : v === 2 ? "중" : "대");
const leftRightLabel = (v: 1 | 2) => (v === 1 ? "좌" : "우");
const ladderCountLabel = (v: 1 | 2) => (v === 1 ? "3줄" : "4줄");

const oddEvenColor = (v: 1 | 2) =>
  v === 1 ? "text-[#ef4444]" : "text-[#3b82f6]";
const underOverColor = (v: 1 | 2) =>
  v === 1 ? "text-[#10b981]" : "text-[#f97316]";

const MARKET_LABELS: Record<string, string> = {
  pb_oe: "파워볼 홀짝",
  pb_uo: "파워볼 언오버",
  nb_oe: "일반볼 홀짝",
  nb_uo: "일반볼 언오버",
  nb_sml: "일반볼 대중소",
  pl_lr: "사다리 출발",
  pl_lc: "사다리 줄수",
  pl_oe: "사다리 홀짝",
};

const fmtNow = () => {
  const n = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const pad = (v: number) => String(v).padStart(2, "0");
  return {
    date: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())} (${days[n.getDay()]})`,
    time: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
  };
};

/* ───────────────── Countdown hook (hydration-safe) ───────────────── */
function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(ROUND_INTERVAL);

  useEffect(() => {
    const calcRemaining = () => {
      const now = new Date();
      const totalSeconds = now.getMinutes() * 60 + now.getSeconds();
      const elapsed = totalSeconds % ROUND_INTERVAL;
      return ROUND_INTERVAL - elapsed;
    };
    setSecondsLeft(calcRemaining());
    const timer = setInterval(() => setSecondsLeft(calcRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    minutes: Math.floor(secondsLeft / 60),
    seconds: secondsLeft % 60,
    secondsLeft,
  };
}

/* ───────────────── Isolated clock components (prevent parent re-render) ───────────────── */
function ClockDisplay() {
  const [clock, setClock] = useState({ date: "", time: "" });

  useEffect(() => {
    setClock(fmtNow());
    const t = setInterval(() => setClock(fmtNow()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!clock.date) return null;

  return (
    <div className="text-[12px] text-[#64748b] font-bold">
      <div>{clock.date}</div>
      <div className="text-[#3b82f6] font-black text-[15px] tracking-tight">
        {clock.time}
      </div>
    </div>
  );
}

function CountdownBadge({ secondsLeft }: { secondsLeft: number }) {
  const isClosed = secondsLeft <= 10;

  return (
    <>
      <div className="flex gap-2">
        {isClosed ? (
          <Badge className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white border-0 shadow-[inset_0_-1px_0_rgba(0,0,0,0.2),_0_1px_3px_rgba(245,158,11,0.4)] px-2 py-0.5 text-[11px] font-bold">
            마감
          </Badge>
        ) : (
          <Badge className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white border-0 shadow-[inset_0_-1px_0_rgba(0,0,0,0.2),_0_1px_3px_rgba(239,68,68,0.4)] px-2 py-0.5 text-[11px] font-bold animate-pulse">
            <span className="relative flex size-1.5 mr-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-white"></span>
            </span>
            LIVE 베팅
          </Badge>
        )}
      </div>
    </>
  );
}

function CountdownTimer({ round, minutes, seconds }: { round: number | null; minutes: number; seconds: number }) {

  return (
    <div className="flex justify-between items-center bg-[#f1f5f9] p-2 rounded-lg border border-[#e2e8f0] shadow-inner font-extrabold text-[#475569] text-[13px] mb-4">
      <span>
        {round ? `${round.toLocaleString()}회차` : "---"} 마감까지
      </span>
      <span className="text-[#3b82f6] text-[15px] tabular-nums font-black drop-shadow-sm bg-white px-2 py-0.5 rounded border border-[#bfdbfe]">
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

/* ───────────────── Stable style objects (prevent re-render allocation) ───────────────── */
const VIDEO_CONTAINER_STYLE = { height: "clamp(500px, 70vh, 800px)" } as const;
const IFRAME_NO_SCROLL_STYLE = { overflow: "hidden", touchAction: "none" } as const;

/* ───────────────── Game Video Component ───────────────── */
function GameVideoPlayer({ game }: { game: string }) {
  const [iframeStatus, setIframeStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeUrl = IFRAME_URLS[game] || IFRAME_URLS.powerball;

  useEffect(() => {
    setIframeStatus("loading");
  }, [game]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (iframeStatus === "loading") {
        setIframeStatus("loaded");
      }
    }, 8000);
    return () => clearTimeout(timeout);
  }, [iframeStatus, game]);

  return (
    <div className="w-full bg-[#111] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#222] overflow-hidden relative" style={VIDEO_CONTAINER_STYLE}>
      {iframeStatus === "loading" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#111] text-white/60 gap-3">
          <div className="size-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          <span className="text-sm font-medium">게임 영상 로딩중...</span>
        </div>
      )}

      {iframeStatus === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a2e] to-[#111] text-white/70 gap-4 p-6">
          <div className="size-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <span className="text-3xl">🎮</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-white/90 text-[15px] mb-1">
              실시간 게임 영상
            </p>
            <p className="text-[13px] text-white/50 mb-4">
              영상을 불러올 수 없습니다
            </p>
            <button
              onClick={() => setIframeStatus("loading")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors border border-white/10"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-0" style={IFRAME_NO_SCROLL_STYLE}>
        <iframe
          ref={iframeRef}
          key={game}
          src={iframeUrl}
          className={cn(
            "border-none transition-opacity duration-300",
            iframeStatus === "loaded" ? "opacity-100" : "opacity-0",
          )}
          style={{ width: "100%", height: "100%", overflow: "hidden" }}
          title="게임영상"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups"
          referrerPolicy="no-referrer"
          scrolling="no"
          onLoad={() => setIframeStatus("loaded")}
          onError={() => setIframeStatus("error")}
        />
      </div>
    </div>
  );
}

/* ───────────────── Ball components (3D styled) ───────────────── */
function PowerBallDisplay({ ball }: { ball: number }) {
  const isOdd = ball % 2 === 1;
  return (
    <div
      className={cn(
        "flex size-14 items-center justify-center rounded-full text-xl font-black text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.6),_0_5px_10px_rgba(0,0,0,0.2)] sm:size-16 sm:text-2xl ring-1 ring-white/30",
        isOdd
          ? "bg-gradient-to-br from-[#ff6b6b] to-[#dc2626]"
          : "bg-gradient-to-br from-[#60a5fa] to-[#2563eb]",
      )}
    >
      <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">{ball}</span>
    </div>
  );
}

function NormalBall({ number }: { number: number }) {
  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#94a3b8] to-[#475569] text-xs font-black text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.3),_inset_0_2px_3px_rgba(255,255,255,0.4),_0_3px_5px_rgba(0,0,0,0.2)] sm:size-10 sm:text-sm ring-1 ring-white/20">
      <span className="drop-shadow-sm">{number}</span>
    </div>
  );
}

/* ───────────────── Option button (3D Glossy Style matching Sports) ───────────────── */
interface BetOptionProps {
  label: string;
  sublabel?: string;
  odds: string;
  selected: boolean;
  onClick: () => void;
}

const BetOption = memo(function BetOption({
  label,
  sublabel,
  odds,
  selected,
  onClick,
}: BetOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-lg border-none transition-all py-2 min-h-[50px] mx-0.5 w-full",
        selected
          ? "bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.4),_0_3px_5px_rgba(30,106,219,0.4)] transform -translate-y-[1px]"
          : "bg-transparent text-[#475569] hover:bg-white hover:shadow-[0_2px_5px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.02)] ring-1 ring-transparent hover:ring-[#e2e8f0]",
      )}
    >
      <span
        className={cn(
          "text-[13px] font-black leading-tight",
          selected ? "text-white" : "text-[#334155]",
        )}
      >
        {label}
      </span>
      {sublabel && (
        <span
          className={cn(
            "text-[10px] font-bold tracking-tighter opacity-80 leading-none",
            selected ? "text-white/80" : "text-[#94a3b8]",
          )}
        >
          {sublabel}
        </span>
      )}
      <span
        className={cn(
          "text-[14px] font-black mt-[2px] leading-none",
          selected ? "text-white drop-shadow-sm" : "text-[#475569]",
        )}
      >
        {odds}
      </span>
    </button>
  );
});

/* ───────────────── Betting Panel (Matching Bet Slip style) ───────────────── */
interface BetSelection {
  market: string;
  option: string;
  odds: string;
}

function BettingPanel({
  game,
  currentRound,
}: {
  game: string;
  currentRound: BepickRound | null;
}) {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [betAmount, setBetAmount] = useState("");
  const { user: authUser } = useAuthStore();
  const [slipTab, setSlipTab] = useState<"cart" | "history">("cart");
  const [mounted, setMounted] = useState(false);
  const { minutes, seconds, secondsLeft } = useCountdown();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-[#e5e9f0] p-4 lg:p-5 h-[400px] flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    );
  }

  const toggleSelection = useCallback((market: string, option: string, odds: string) => {
    setSelections((prev) => {
      const exists = prev.find(
        (s) => s.market === market && s.option === option,
      );
      if (exists) return [];
      return [{ market, option, odds }];
    });
  }, []);

  const isSelected = useCallback((market: string, option: string) =>
    selections.some((s) => s.market === market && s.option === option),
  [selections]);

  const removeBet = useCallback((m: string, o: string) =>
    setSelections((p) => p.filter((s) => !(s.market === m && s.option === o))),
  []);

  const totalOdds =
    selections.length > 0
      ? selections.reduce((acc, s) => acc * parseFloat(s.odds), 1)
      : 0;

  const amt = parseFloat(betAmount.replace(/,/g, "")) || 0;
  const payout = Math.floor(amt * totalOdds);

  const formatNum = (v: string) => {
    const num = parseFloat(v.replace(/,/g, "")) || 0;
    return num === 0 ? "" : num.toLocaleString();
  };

  const wrapSection = (title: string, content: React.ReactNode) => (
    <div className="mb-4 bg-[#f8fafc] p-2.5 rounded-xl border border-[#e2e8f0] shadow-inner">
      <div className="text-[12px] font-extrabold text-[#64748b] mb-2 px-1 border-b border-[#cbd5e1]/50 pb-1">
        {title}
      </div>
      {content}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Game Controls (Desktop) ── */}
      <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e5e9f0] p-4 lg:p-5 relative overflow-hidden">
        {/* Top Gloss */}
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none"></div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-[15px] font-black text-[#1e293b] flex items-center gap-1.5 drop-shadow-sm">
            <span className="text-xl">🎯</span> 베팅 선택
          </div>
          <CountdownBadge secondsLeft={secondsLeft} />
        </div>

        <CountdownTimer round={currentRound?.AllRound ?? null} minutes={minutes} seconds={seconds} />

        {game === "powerball" ? (
          <>
            {wrapSection(
              "파워볼",
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-1 border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                  <BetOption
                    label="홀"
                    odds="1.95"
                    selected={isSelected("pb_oe", "홀")}
                    onClick={() => toggleSelection("pb_oe", "홀", "1.95")}
                  />
                  <div className="w-[1px] bg-[#cbd5e1]" />
                  <BetOption
                    label="짝"
                    odds="1.95"
                    selected={isSelected("pb_oe", "짝")}
                    onClick={() => toggleSelection("pb_oe", "짝", "1.95")}
                  />
                </div>
                <div className="col-span-1 border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                  <BetOption
                    label="언더"
                    sublabel="0~4"
                    odds="1.95"
                    selected={isSelected("pb_uo", "언더")}
                    onClick={() => toggleSelection("pb_uo", "언더", "1.95")}
                  />
                  <div className="w-[1px] bg-[#cbd5e1]" />
                  <BetOption
                    label="오버"
                    sublabel="5~9"
                    odds="1.95"
                    selected={isSelected("pb_uo", "오버")}
                    onClick={() => toggleSelection("pb_uo", "오버", "1.95")}
                  />
                </div>
              </div>,
            )}

            {wrapSection(
              "일반볼 (홀짝 / 언오버 / 대중소)",
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                    <BetOption
                      label="홀"
                      odds="1.95"
                      selected={isSelected("nb_oe", "홀")}
                      onClick={() => toggleSelection("nb_oe", "홀", "1.95")}
                    />
                    <div className="w-[1px] bg-[#cbd5e1]" />
                    <BetOption
                      label="짝"
                      odds="1.95"
                      selected={isSelected("nb_oe", "짝")}
                      onClick={() => toggleSelection("nb_oe", "짝", "1.95")}
                    />
                  </div>
                  <div className="border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                    <BetOption
                      label="언더"
                      sublabel="15~72"
                      odds="1.95"
                      selected={isSelected("nb_uo", "언더")}
                      onClick={() => toggleSelection("nb_uo", "언더", "1.95")}
                    />
                    <div className="w-[1px] bg-[#cbd5e1]" />
                    <BetOption
                      label="오버"
                      sublabel="73~130"
                      odds="1.95"
                      selected={isSelected("nb_uo", "오버")}
                      onClick={() => toggleSelection("nb_uo", "오버", "1.95")}
                    />
                  </div>
                </div>
                <div className="border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1 w-full justify-between">
                  <BetOption
                    label="소"
                    sublabel="15~64"
                    odds="2.80"
                    selected={isSelected("nb_sml", "소")}
                    onClick={() => toggleSelection("nb_sml", "소", "2.80")}
                  />
                  <div className="w-[1px] bg-[#cbd5e1]" />
                  <BetOption
                    label="중"
                    sublabel="65~80"
                    odds="3.50"
                    selected={isSelected("nb_sml", "중")}
                    onClick={() => toggleSelection("nb_sml", "중", "3.50")}
                  />
                  <div className="w-[1px] bg-[#cbd5e1]" />
                  <BetOption
                    label="대"
                    sublabel="81~130"
                    odds="2.80"
                    selected={isSelected("nb_sml", "대")}
                    onClick={() => toggleSelection("nb_sml", "대", "2.80")}
                  />
                </div>
              </div>,
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {wrapSection(
              "출발",
              <div className="border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                <BetOption
                  label="좌"
                  odds="1.95"
                  selected={isSelected("pl_lr", "좌")}
                  onClick={() => toggleSelection("pl_lr", "좌", "1.95")}
                />
                <div className="w-[1px] bg-[#cbd5e1]" />
                <BetOption
                  label="우"
                  odds="1.95"
                  selected={isSelected("pl_lr", "우")}
                  onClick={() => toggleSelection("pl_lr", "우", "1.95")}
                />
              </div>,
            )}
            {wrapSection(
              "줄수",
              <div className="border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                <BetOption
                  label="3줄"
                  odds="1.95"
                  selected={isSelected("pl_lc", "3줄")}
                  onClick={() => toggleSelection("pl_lc", "3줄", "1.95")}
                />
                <div className="w-[1px] bg-[#cbd5e1]" />
                <BetOption
                  label="4줄"
                  odds="1.95"
                  selected={isSelected("pl_lc", "4줄")}
                  onClick={() => toggleSelection("pl_lc", "4줄", "1.95")}
                />
              </div>,
            )}
            {wrapSection(
              "홀짝",
              <div className="border border-[#d1d7e0] rounded-lg bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-sm p-1 flex gap-1">
                <BetOption
                  label="홀"
                  odds="1.95"
                  selected={isSelected("pl_oe", "홀")}
                  onClick={() => toggleSelection("pl_oe", "홀", "1.95")}
                />
                <div className="w-[1px] bg-[#cbd5e1]" />
                <BetOption
                  label="짝"
                  odds="1.95"
                  selected={isSelected("pl_oe", "짝")}
                  onClick={() => toggleSelection("pl_oe", "짝", "1.95")}
                />
              </div>,
            )}
          </div>
        )}
      </div>

      {/* ── Actual Bet Slip ── */}
      <div className="bg-white border-0 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.08)] overflow-hidden ring-1 ring-[#e5e9f0]">
        <div className="flex justify-between items-center px-4 py-[10px] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white]">
          <ClockDisplay />
          <div className="flex gap-[6px]">
            <button
              onClick={() => setSelections([])}
              className="w-[34px] h-[34px] flex items-center justify-center bg-gradient-to-b from-white to-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#ef4444] text-[15px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#e2e8f0] transform hover:-translate-y-[1px] transition-all"
            >
              🗑️
            </button>
            <button className="w-[34px] h-[34px] flex items-center justify-center bg-gradient-to-b from-white to-[#f1f5f9] rounded-lg text-[#64748b] hover:text-[#3b82f6] text-[15px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.05)] ring-1 ring-[#e2e8f0] transform hover:-translate-y-[1px] transition-all">
              🔄
            </button>
          </div>
        </div>

        <div className="flex border-b border-[#cbd5e1] relative bg-[#f8fafc] p-1 gap-1">
          <button
            onClick={() => setSlipTab("cart")}
            className={cn(
              "flex-[1.2] py-[12px] text-[14px] font-black flex items-center justify-center gap-[6px] relative rounded-md transition-all",
              slipTab === "cart"
                ? "bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_6px_rgba(30,106,219,0.3)]"
                : "bg-transparent text-[#64748b] hover:bg-[#e2e8f0] hover:shadow-inner",
            )}
          >
            🛒 베팅카트
            <span
              className={cn(
                "text-white text-[10px] font-bold rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-sm",
                slipTab === "cart"
                  ? "bg-[#ff5c5c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
                  : "bg-[#94a3b8]",
              )}
            >
              {selections.length}
            </span>
          </button>
          <button
            onClick={() => setSlipTab("history")}
            className={cn(
              "flex-1 py-[12px] text-[14px] font-black flex items-center justify-center gap-[6px] relative rounded-md transition-all",
              slipTab === "history"
                ? "bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_6px_rgba(30,106,219,0.3)]"
                : "bg-transparent text-[#64748b] hover:bg-[#e2e8f0] hover:shadow-inner",
            )}
          >
            📋 베팅내역
            <span
              className={cn(
                "text-white text-[10px] font-bold rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-sm",
                slipTab === "history"
                  ? "bg-[#ff5c5c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]"
                  : "bg-[#94a3b8]",
              )}
            >
              0
            </span>
          </button>
        </div>

        <div className="bg-[#f1f5f9] text-center text-[13px] font-bold text-[#94a3b8] border-b border-[#e2e8f0] shadow-inner min-h-[100px]">
          {selections.length === 0 ? (
            <div className="py-8">항목을 선택하세요.</div>
          ) : (
            <div className="flex flex-col gap-[3px] max-h-[200px] overflow-y-auto p-1.5 scrollbar-hide">
              {selections.map((s) => {
                const marketName = MARKET_LABELS[s.market] || s.market;

                return (
                  <div
                    key={`${s.market}-${s.option}`}
                    className="bg-white rounded-lg text-left p-[10px] border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.03)] relative"
                  >
                    <button
                      onClick={() => removeBet(s.market, s.option)}
                      className="absolute top-2 right-2 text-[#cbd5e1] hover:text-[#ef4444] text-[18px] font-black h-6 w-6 flex items-center justify-center rounded-full hover:bg-[#fee2e2] transition-colors"
                    >
                      ×
                    </button>
                    <div className="text-[11.5px] text-[#64748b] font-extrabold pr-4 tracking-tight">
                      {currentRound?.AllRound}회차 | {marketName}
                    </div>
                    <div className="flex justify-between items-end mt-2.5">
                      <span className="text-[#3b82f6] font-extrabold text-[12.5px] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">
                        {s.option}
                      </span>
                      <span className="text-[#ef4444] font-black text-[15px]">
                        {parseFloat(s.odds).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-white text-[#475569] font-bold space-y-[12px] text-[13px]">
          <div className="flex justify-between items-center pb-[10px] border-b border-[#e2e8f0] border-dashed">
            <span className="text-[#64748b]">보유금액</span>
            <span className="text-[18px] font-black text-[#3b82f6] drop-shadow-sm">
              {Number(authUser?.balance || 0).toLocaleString()}{" "}
              <span className="text-[13px] text-[#94a3b8]">원</span>
            </span>
          </div>

          <div className="space-y-[8px] text-[12.5px]">
            <div className="flex justify-between items-center">
              <span className="text-[#94a3b8] font-medium">최소베팅</span>
              <span className="text-[#ef4444] font-extrabold">
                {BET_LIMITS.MIN.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#94a3b8] font-medium">최대베팅</span>
              <span className="font-extrabold text-[#334155]">
                {BET_LIMITS.MAX.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-[10px] my-[10px] border-t border-b border-[#e2e8f0] bg-gradient-to-r from-[#fef2f2] to-white px-2 rounded-md">
            <span className="font-extrabold text-[#7f1d1d]">배당률</span>
            <span className="text-[18px] font-black text-[#ef4444] drop-shadow-sm">
              {totalOdds > 0 ? totalOdds.toFixed(2) : "1.00"}
            </span>
          </div>

          <div className="flex justify-between items-center bg-[#f8fafc] p-2 rounded-lg border border-[#e2e8f0] shadow-inner">
            <span className="text-[#64748b] font-extrabold ml-1">베팅금액</span>
            <input
              type="text"
              value={betAmount === "" ? "" : formatNum(betAmount)}
              onChange={(e) =>
                setBetAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-[130px] h-[34px] bg-white border border-[#cbd5e1] rounded-md text-right px-3 text-[#ef4444] font-black text-[15px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[#64748b] font-extrabold">적중예상금액</span>
            <span className="text-[18px] font-black text-[#3b82f6] drop-shadow-sm">
              {payout > 0 ? formatNum(payout.toString()) : "0"}
            </span>
          </div>

          <div className="pt-3">
            <div className="grid grid-cols-3 gap-[6px] mb-[6px]">
              {[5000, 10000, 50000, 100000, 500000, 1000000].map((v) => (
                <button
                  key={v}
                  onClick={() => setBetAmount((amt + v).toString())}
                  className="h-[36px] bg-gradient-to-b from-white to-[#f1f5f9] border-none ring-1 ring-[#cbd5e1] text-[#475569] text-[13px] font-black rounded-lg shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_3px_rgba(0,0,0,0.05)] hover:from-[#f8fafc] hover:to-[#e2e8f0] transform hover:-translate-y-[1px] transition-all"
                >
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-[6px]">
              <button
                onClick={() => setBetAmount(Math.floor(amt / 2).toString())}
                className="h-[38px] bg-gradient-to-b from-[#64748b] to-[#334155] text-white text-[13px] font-black rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_3px_5px_rgba(0,0,0,0.2)] hover:from-[#475569] hover:to-[#1e293b] transform hover:-translate-y-[1px] transition-all"
              >
                하프
              </button>
              <button
                onClick={() => setBetAmount(BET_LIMITS.MAX.toString())}
                className="h-[38px] bg-gradient-to-b from-[#64748b] to-[#334155] text-white text-[13px] font-black rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_3px_5px_rgba(0,0,0,0.2)] hover:from-[#475569] hover:to-[#1e293b] transform hover:-translate-y-[1px] transition-all"
              >
                최대
              </button>
              <button
                onClick={() => setBetAmount("")}
                className="h-[38px] bg-gradient-to-b from-[#94a3b8] to-[#475569] text-white text-[13px] font-black rounded-lg shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_3px_5px_rgba(0,0,0,0.2)] hover:from-[#cbd5e1] hover:to-[#64748b] transform hover:-translate-y-[1px] transition-all"
              >
                정정
              </button>
            </div>
          </div>

          <button
            disabled
            title="베팅 기능 준비 중"
            className="w-full mt-4 h-[52px] bg-gradient-to-b from-[#94a3b8] to-[#64748b] text-white/60 text-[17px] font-black rounded-xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div className="w-[24px] h-[24px] bg-white/10 rounded-full flex items-center justify-center">
              🛒
            </div>
            베팅 준비 중
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── LIVE RESULT DISPLAYS ───────────────── */
const PowerBallLiveResult = memo(function PowerBallLiveResult({
  currentRound,
}: {
  currentRound: BepickRound | null;
}) {
  const pb = currentRound?.PowerBall;
  if (!pb)
    return (
      <div className="py-12 px-6 flex flex-col items-center opacity-50">
        <Skeleton className="size-16 rounded-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-6 lg:gap-10 sm:flex-row py-4">
      {/* Power ball */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[12px] font-black tracking-widest text-[#64748b] border-b border-[#cbd5e1] pb-1 px-4 mb-1">
          파워볼
        </span>
        <PowerBallDisplay ball={pb.pBall} />
        <div className="flex gap-1 mt-2">
          <Badge
            className={cn(
              "text-[11px] font-black shadow-sm border border-[#e2e8f0] bg-white",
              oddEvenColor(pb.pOddEven),
            )}
          >
            {oddEvenLabel(pb.pOddEven)}
          </Badge>
          <Badge
            className={cn(
              "text-[11px] font-black shadow-sm border border-[#e2e8f0] bg-white",
              underOverColor(pb.pUnderOver),
            )}
          >
            {underOverLabel(pb.pUnderOver)}
          </Badge>
        </div>
      </div>

      <div className="hidden h-24 w-px bg-gradient-to-b from-transparent via-[#cbd5e1] to-transparent sm:block" />

      {/* Normal balls */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[12px] font-black tracking-widest text-[#64748b] border-b border-[#cbd5e1] pb-1 px-4 mb-1">
          일반볼
        </span>
        <div className="flex gap-2">
          <NormalBall number={pb.nBall1} />
          <NormalBall number={pb.nBall2} />
          <NormalBall number={pb.nBall3} />
          <NormalBall number={pb.nBall4} />
          <NormalBall number={pb.nBall5} />
        </div>
        <div className="flex items-center gap-1.5 mt-2 bg-[#f1f5f9] px-3 py-1 rounded-lg border border-[#e2e8f0] shadow-inner">
          <span className="text-[13px] font-extrabold text-[#475569]">
            합{" "}
            <span className="text-[#3b82f6] text-[15px] font-black drop-shadow-sm ml-0.5">
              {pb.nBallSum}
            </span>
          </span>
          <div className="w-px h-4 bg-[#cbd5e1] mx-1" />
          <Badge
            className={cn(
              "text-[11px] font-black shadow-sm bg-white border border-[#e2e8f0]",
              oddEvenColor(pb.nOddEven),
            )}
          >
            {oddEvenLabel(pb.nOddEven)}
          </Badge>
          <Badge
            className={cn(
              "text-[11px] font-black shadow-sm bg-white border border-[#e2e8f0]",
              underOverColor(pb.nUnderOver),
            )}
          >
            {underOverLabel(pb.nUnderOver)}
          </Badge>
          <Badge className="text-[11px] font-black shadow-sm bg-white border border-[#e2e8f0] text-[#64748b]">
            {smlLabel(pb.nSML)}
          </Badge>
        </div>
      </div>
    </div>
  );
});

const PowerLadderLiveResult = memo(function PowerLadderLiveResult({
  currentRound,
}: {
  currentRound: BepickRound | null;
}) {
  const pl = currentRound?.PowerLadder;
  if (!pl)
    return (
      <div className="py-10 grid grid-cols-3 gap-6">
        <Skeleton className="h-[90px] w-[100px] rounded-xl" />
        <Skeleton className="h-[90px] w-[100px] rounded-xl" />
        <Skeleton className="h-[90px] w-[100px] rounded-xl" />
      </div>
    );

  return (
    <div className="grid grid-cols-3 gap-4 lg:gap-8 py-4">
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#d1d7e0] bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-4 lg:p-6 lg:min-w-[120px]">
        <span className="text-[11px] font-extrabold tracking-widest text-[#64748b] bg-white px-3 py-0.5 rounded-full border border-[#e2e8f0] shadow-sm mb-1">
          출발
        </span>
        <span
          className={cn(
            "text-[28px] font-black drop-shadow-sm",
            pl.leftRight === 1 ? "text-[#3b82f6]" : "text-[#ef4444]",
          )}
        >
          {leftRightLabel(pl.leftRight)}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#d1d7e0] bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-4 lg:p-6 lg:min-w-[120px]">
        <span className="text-[11px] font-extrabold tracking-widest text-[#64748b] bg-white px-3 py-0.5 rounded-full border border-[#e2e8f0] shadow-sm mb-1">
          줄수
        </span>
        <span className="text-[28px] font-black text-[#8b5cf6] drop-shadow-sm">
          {ladderCountLabel(pl.ladderCount)}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#d1d7e0] bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-4 lg:p-6 lg:min-w-[120px]">
        <span className="text-[11px] font-extrabold tracking-widest text-[#64748b] bg-white px-3 py-0.5 rounded-full border border-[#e2e8f0] shadow-sm mb-1">
          홀짝
        </span>
        <span
          className={cn(
            "text-[28px] font-black drop-shadow-sm",
            oddEvenColor(pl.oddEven),
          )}
        >
          {oddEvenLabel(pl.oddEven)}
        </span>
      </div>
    </div>
  );
});

/* ───────────────── HISTORY TABLE ───────────────── */
const ResultsTable = memo(function ResultsTable({
  rounds,
  game,
}: {
  rounds: BepickRound[];
  game: string;
}) {
  const safeRounds = Array.isArray(rounds) ? rounds : [];

  if (safeRounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
        <span className="text-4xl mb-3">📊</span>
        <p className="text-sm font-bold">회차 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (game === "powerball") {
    return (
      <div className="overflow-x-auto my-0">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-b border-[#cbd5e1] text-[#475569] text-[11.5px] font-extrabold shadow-[inset_0_1px_0_white]">
              <th className="px-2 py-2 w-[80px]">회차</th>
              <th className="px-2 py-2 bg-white/50 w-[50px]">P볼</th>
              <th className="px-2 py-2">P홀짝</th>
              <th className="px-2 py-2">P언오</th>
              <th className="px-2 py-2 bg-white/50 w-[50px]">일반합</th>
              <th className="px-2 py-2">홀짝</th>
              <th className="px-2 py-2">대중소</th>
            </tr>
          </thead>
          <tbody>
            {safeRounds.slice(0, DISPLAY_ROUNDS).map((r, i) => {
              const p = r.PowerBall;
              if (!p) return null;
              return (
                <tr
                  key={r.ID}
                  className={cn(
                    "border-b border-[#e2e8f0] text-[12px] font-bold transition-colors hover:bg-[#f8fafc]",
                    i % 2 === 0 ? "bg-white" : "bg-[#fbfcfd]",
                  )}
                >
                  <td className="px-2 py-2 text-[#64748b]">{r.Round}</td>
                  <td className="px-2 py-2 bg-white/40">
                    <span
                      className={cn(
                        "inline-flex size-[22px] items-center justify-center rounded-full text-white text-[11px] font-black shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_1px_2px_rgba(0,0,0,0.2)]",
                        p.pBall % 2 === 1 ? "bg-[#ef4444]" : "bg-[#3b82f6]",
                      )}
                    >
                      {p.pBall}
                    </span>
                  </td>
                  <td className={cn("px-2 py-2", oddEvenColor(p.pOddEven))}>
                    {oddEvenLabel(p.pOddEven)}
                  </td>
                  <td className={cn("px-2 py-2", underOverColor(p.pUnderOver))}>
                    {underOverLabel(p.pUnderOver)}
                  </td>
                  <td className="px-2 py-2 bg-white/40">
                    <span className="text-[#334155] font-black tracking-tighter">
                      {p.nBallSum}
                    </span>
                  </td>
                  <td className={cn("px-2 py-2", oddEvenColor(p.nOddEven))}>
                    {oddEvenLabel(p.nOddEven)}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded shadow-sm border",
                        p.nSML === 1
                          ? "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]"
                          : p.nSML === 2
                            ? "bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]"
                            : "bg-[#fef2f2] text-[#ef4444] border-[#fecaca]",
                      )}
                    >
                      {smlLabel(p.nSML)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto my-0">
      <table className="w-full text-center border-collapse">
        <thead>
          <tr className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-b border-[#cbd5e1] text-[#475569] text-[11.5px] font-extrabold shadow-[inset_0_1px_0_white]">
            <th className="px-3 py-2 text-left pl-6">회차</th>
            <th className="px-3 py-2">출발(좌/우)</th>
            <th className="px-3 py-2 bg-white/50">줄수</th>
            <th className="px-3 py-2">결과(홀/짝)</th>
          </tr>
        </thead>
        <tbody>
          {safeRounds.slice(0, DISPLAY_ROUNDS).map((r, i) => {
            const ladder = r.PowerLadder;
            if (!ladder) return null;
            return (
              <tr
                key={r.ID}
                className={cn(
                  "border-b border-[#e2e8f0] text-[12.5px] font-bold transition-colors hover:bg-[#f8fafc]",
                  i % 2 === 0 ? "bg-white" : "bg-[#fbfcfd]",
                )}
              >
                <td className="px-3 py-2 text-left pl-6 text-[#64748b]">
                  {r.Round}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-block px-2.5 py-0.5 rounded-full border shadow-sm",
                      ladder.leftRight === 1
                        ? "bg-[#eff6ff] text-[#3b82f6] border-[#bfdbfe]"
                        : "bg-[#fef2f2] text-[#ef4444] border-[#fecaca]",
                    )}
                  >
                    {leftRightLabel(ladder.leftRight)}
                  </span>
                </td>
                <td className="px-3 py-2 bg-white/40 text-[#8b5cf6] font-black">
                  {ladderCountLabel(ladder.ladderCount)}
                </td>
                <td className={cn("px-3 py-2", oddEvenColor(ladder.oddEven))}>
                  {oddEvenLabel(ladder.oddEven)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

/* ───────────────── STATS PANEL ───────────────── */
function StatBar({
  label,
  items,
}: {
  label: string;
  items: { name: string; pct: number; color: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5 p-3 border border-[#e2e8f0] rounded-xl bg-gradient-to-b from-[#f8fafc] to-white shadow-sm">
      <span className="text-[12px] font-extrabold text-[#64748b]">{label}</span>
      <div className="flex h-6 w-full overflow-hidden rounded-full border border-[#cbd5e1] shadow-inner bg-white">
        {items.map((item) => (
          <div
            key={item.name}
            className={cn(
              "flex items-center justify-center text-[10.5px] font-black text-white transition-all shadow-inner border-r border-white/20 last:border-0",
              item.color,
            )}
            style={{ width: `${Math.max(item.pct, 8)}%` }}
          >
            {item.name} {Math.round(item.pct)}%
          </div>
        ))}
      </div>
    </div>
  );
}

const StatsPanel = memo(function StatsPanel({ rounds, game }: { rounds: BepickRound[]; game: string }) {
  const safeRounds = Array.isArray(rounds) ? rounds : [];

  const stats = useMemo(() => {
    if (safeRounds.length === 0) return null;
    const total = safeRounds.length;

    if (game === "powerball") {
      let pOdd = 0,
        pEven = 0,
        pUnder = 0,
        pOver = 0,
        nOdd = 0,
        nEven = 0,
        nUnder = 0,
        nOver = 0,
        nSmall = 0,
        nMedium = 0,
        nLarge = 0;
      for (const r of safeRounds) {
        const pb = r.PowerBall;
        if (!pb) continue;
        if (pb.pOddEven === 1) pOdd++;
        else pEven++;
        if (pb.pUnderOver === 1) pUnder++;
        else pOver++;
        if (pb.nOddEven === 1) nOdd++;
        else nEven++;
        if (pb.nUnderOver === 1) nUnder++;
        else nOver++;
        if (pb.nSML === 1) nSmall++;
        else if (pb.nSML === 2) nMedium++;
        else nLarge++;
      }
      return [
        {
          label: "파워볼 홀/짝 비율",
          items: [
            { name: "홀", pct: (pOdd / total) * 100, color: "bg-[#ef4444]" },
            { name: "짝", pct: (pEven / total) * 100, color: "bg-[#3b82f6]" },
          ],
        },
        {
          label: "파워볼 언/오 비율",
          items: [
            {
              name: "언더",
              pct: (pUnder / total) * 100,
              color: "bg-[#10b981]",
            },
            { name: "오버", pct: (pOver / total) * 100, color: "bg-[#f97316]" },
          ],
        },
        {
          label: "일반볼 홀/짝 비율",
          items: [
            { name: "홀", pct: (nOdd / total) * 100, color: "bg-[#ef4444]" },
            { name: "짝", pct: (nEven / total) * 100, color: "bg-[#3b82f6]" },
          ],
        },
        {
          label: "일반볼 대/중/소 비율",
          items: [
            { name: "소", pct: (nSmall / total) * 100, color: "bg-[#10b981]" },
            { name: "중", pct: (nMedium / total) * 100, color: "bg-[#f59e0b]" },
            { name: "대", pct: (nLarge / total) * 100, color: "bg-[#ef4444]" },
          ],
        },
      ];
    }

    let left = 0,
      right = 0,
      line3 = 0,
      line4 = 0,
      odd = 0,
      even = 0;
    for (const r of safeRounds) {
      const ladder = r.PowerLadder;
      if (!ladder) continue;
      if (ladder.leftRight === 1) left++;
      else right++;
      if (ladder.ladderCount === 1) line3++;
      else line4++;
      if (ladder.oddEven === 1) odd++;
      else even++;
    }
    return [
      {
        label: "사다리 출발 좌/우 비율",
        items: [
          { name: "좌", pct: (left / total) * 100, color: "bg-[#3b82f6]" },
          { name: "우", pct: (right / total) * 100, color: "bg-[#ef4444]" },
        ],
      },
      {
        label: "사다리 3줄/4줄 비율",
        items: [
          { name: "3줄", pct: (line3 / total) * 100, color: "bg-[#8b5cf6]" },
          { name: "4줄", pct: (line4 / total) * 100, color: "bg-[#06b6d4]" },
        ],
      },
      {
        label: "최종 결과 홀/짝 비율",
        items: [
          { name: "홀", pct: (odd / total) * 100, color: "bg-[#ef4444]" },
          { name: "짝", pct: (even / total) * 100, color: "bg-[#3b82f6]" },
        ],
      },
    ];
  }, [safeRounds, game]);

  if (!stats) return null;
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {stats.map((s) => (
        <StatBar key={s.label} label={s.label} items={s.items} />
      ))}
    </div>
  );
});

/* ───────────────── ROOT PAGE EXPORT ───────────────── */
export default function MinigamePage() {
  const {
    rounds,
    currentRound,
    selectedGame,
    isLoading,
    fetchRounds,
    fetchCurrentRound,
    setSelectedGame,
  } = useMinigameStore();
  const [activeTab, setActiveTab] = useState<"results" | "stats">("results");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCurrentRound();
    fetchRounds();
  }, [selectedGame, fetchCurrentRound, fetchRounds]);

  useEffect(() => {
    const i = setInterval(() => {
      fetchCurrentRound();
      fetchRounds();
    }, REFRESH_INTERVAL);
    return () => clearInterval(i);
  }, [fetchCurrentRound, fetchRounds]);

  const gameTitle =
    selectedGame === "powerball" ? "EOS 파워볼" : "EOS 파워사다리";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-3 border-[#e2e8f0] border-t-[#3b82f6] rounded-full animate-spin" />
          <span className="text-[#64748b] font-bold text-sm">로딩중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#333] font-sans pb-20 lg:pb-10 flex border-t border-[#ddd]">
      <div className="flex-1 max-w-[1300px] mx-auto flex flex-col lg:flex-row gap-4 mt-0 px-2 lg:px-4 pt-3 w-full">
        {/* LEFT/CENTER Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e5e9f0] p-1.5 lg:p-2">
            <Tabs
              value={selectedGame}
              onValueChange={(v) => setSelectedGame(v)}
            >
              <TabsList className="w-full bg-[#f4f6f9] rounded-lg p-1 !h-auto flex text-[#4a5568] shadow-inner border border-[#e8eaef]">
                <TabsTrigger
                  value="powerball"
                  className={cn(
                    "flex-1 text-[13px] lg:text-[15px] font-extrabold py-3 rounded-md transition-all",
                    selectedGame === "powerball"
                      ? "bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_2px_4px_rgba(30,106,219,0.3)] !bg-[#4da1ff]"
                      : "text-[#64748b] hover:bg-white hover:shadow-sm drop-shadow-sm",
                  )}
                >
                  <span className="text-xl mr-1.5">🎱</span>{" "}
                  <span className="font-black">EOS</span> 파워볼
                </TabsTrigger>
                <TabsTrigger
                  value="ladder"
                  className={cn(
                    "flex-1 text-[13px] lg:text-[15px] font-extrabold py-3 rounded-md transition-all",
                    selectedGame === "ladder"
                      ? "bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_2px_4px_rgba(30,106,219,0.3)] !bg-[#4da1ff]"
                      : "text-[#64748b] hover:bg-white hover:shadow-sm drop-shadow-sm",
                  )}
                >
                  <span className="text-xl mr-1.5">🪜</span>{" "}
                  <span className="font-black">EOS</span> 파워사다리
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {!isLoading || rounds.length > 0 ? (
            <>
              {/* Game Video Container */}
              <GameVideoPlayer game={selectedGame} />

              {/* Live Result Container */}
              <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e5e9f0] overflow-hidden">
                <div className="relative bg-gradient-to-r from-[#2c7de0] via-[#4da1ff] to-[#eaf2fc] h-[40px] flex items-center justify-between px-3 lg:px-4 border-b border-[#1e6adb]">
                  <div className="absolute inset-0 h-[50%] bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 font-extrabold text-white text-[13px] lg:text-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] lg:text-[12px] border border-white/20 shadow-inner">
                      {gameTitle}
                    </span>{" "}
                    현재 결과
                  </div>
                  <div className="relative z-10 text-[11px] lg:text-[12px] font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded-md border border-white/10 shadow-inner tracking-widest">
                    {currentRound
                      ? `${currentRound.AllRound.toLocaleString()}회차`
                      : "---"}
                  </div>
                </div>
                <div className="p-4 lg:p-6 bg-gradient-to-b from-[#f8fafc] to-white flex justify-center border-b border-[#e5e9f0]">
                  {selectedGame === "powerball" ? (
                    <PowerBallLiveResult currentRound={currentRound} />
                  ) : (
                    <PowerLadderLiveResult currentRound={currentRound} />
                  )}
                </div>
              </div>

              {/* History & Stats Container */}
              <div className="bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#e5e9f0] overflow-hidden flex-1 flex flex-col relative">
                <div className="flex items-center justify-between px-2 py-2 bg-gradient-to-b from-white to-[#fcfcfd] border-b border-[#e5e9f0]">
                  <div className="flex gap-1.5 p-1 bg-[#f4f6f9] rounded-lg border border-[#e8eaef]">
                    <button
                      className={cn(
                        "px-3 lg:px-4 py-1.5 text-[11px] lg:text-[12px] font-extrabold rounded-md shadow-sm transition-all",
                        activeTab === "results"
                          ? "bg-gradient-to-b from-white to-[#f0f3f6] text-[#4a5568] border border-[#d1d7e0] shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]"
                          : "bg-transparent text-[#94a3b8] hover:text-[#64748b] border border-transparent hover:bg-white/50",
                      )}
                      onClick={() => setActiveTab("results")}
                    >
                      최근 결과
                    </button>
                    <button
                      className={cn(
                        "px-3 lg:px-4 py-1.5 text-[11px] lg:text-[12px] font-extrabold rounded-md shadow-sm transition-all",
                        activeTab === "stats"
                          ? "bg-gradient-to-b from-white to-[#f0f3f6] text-[#4a5568] border border-[#d1d7e0] shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]"
                          : "bg-transparent text-[#94a3b8] hover:text-[#64748b] border border-transparent hover:bg-white/50",
                      )}
                      onClick={() => setActiveTab("stats")}
                    >
                      최근 통계
                    </button>
                  </div>
                  <span className="text-[10px] lg:text-[11px] font-bold text-[#8995a5] px-2">
                    {DISPLAY_ROUNDS}회 기준
                  </span>
                </div>
                <div className="bg-white min-h-[300px]">
                  {activeTab === "results" ? (
                    <ResultsTable rounds={rounds} game={selectedGame} />
                  ) : (
                    <div className="p-4 lg:p-6">
                      <StatsPanel rounds={rounds} game={selectedGame} />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          )}
        </div>

        {/* RIGHT: BETTING PANEL */}
        <div className="w-full lg:w-[320px] shrink-0 mt-2 lg:mt-0">
          <div className="lg:sticky lg:top-[80px]">
            <BettingPanel game={selectedGame} currentRound={currentRound} />
          </div>
        </div>
      </div>
    </div>
  );
}
