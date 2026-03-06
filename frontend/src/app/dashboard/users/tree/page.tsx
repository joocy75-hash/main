'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Search, Users, Crown, ShieldCheck, Target, TrendingUp, LucideIcon } from 'lucide-react';
import { useUserTree } from '@/hooks/use-users';
import { cn } from '@/lib/utils';

const Tree = dynamic(() => import('react-d3-tree').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-[600px] flex items-center justify-center text-muted-foreground">트리 로딩 중...</div>,
});

const RANK_COLORS: Record<string, { from: string, to: string, shadow: string, icon: LucideIcon }> = {
  sub_hq: { from: 'from-rose-400', to: 'to-rose-600', shadow: 'shadow-[0_4px_8px_rgba(225,29,72,0.3)]', icon: Crown },
  distributor: { from: 'from-amber-400', to: 'to-amber-600', shadow: 'shadow-[0_4px_8px_rgba(217,119,6,0.3)]', icon: Target },
  agency: { from: 'from-emerald-400', to: 'to-emerald-600', shadow: 'shadow-[0_4px_8px_rgba(5,150,105,0.3)]', icon: ShieldCheck },
  user: { from: 'from-blue-400', to: 'to-blue-600', shadow: 'shadow-[0_4px_8px_rgba(37,99,235,0.3)]', icon: Users },
};

const RANK_LABELS: Record<string, string> = {
  sub_hq: '부본사',
  distributor: '총판',
  agency: '대리점',
  user: '일반회원',
};

type TreeNodeData = {
  name: string;
  attributes?: Record<string, string>;
  children?: TreeNodeData[];
  _raw?: { id: number; rank: string; status: string };
};

export default function UserTreePage() {
  const router = useRouter();
  const [rootId, setRootId] = useState<number | null>(null);
  const [rootInput, setRootInput] = useState('');

  const { nodes, loading } = useUserTree(rootId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 400, y: 60 });

  const treeData = useMemo(() => {
    if (nodes.length === 0) return null;

    const nodeMap = new Map<number, TreeNodeData>();
    for (const n of nodes) {
      nodeMap.set(n.id, {
        name: n.username,
        attributes: {
          rank: RANK_LABELS[n.rank] || n.rank,
          bal: n.balance.toLocaleString(),
        },
        children: [],
        _raw: { id: n.id, rank: n.rank, status: n.status },
      });
    }

    let root: TreeNodeData | null = null;
    for (const n of nodes) {
      const node = nodeMap.get(n.id)!;
      if (n.referrer_id && nodeMap.has(n.referrer_id)) {
        nodeMap.get(n.referrer_id)!.children!.push(node);
      } else if (rootId && n.id === rootId) {
        root = node;
      }
    }

    if (!root && nodes.length > 0) {
      root = nodeMap.get(nodes[0].id) || null;
    }

    return root;
  }, [nodes, rootId]);

  // Center the entire tree visually after render
  useEffect(() => {
    if (!treeData || !containerRef.current) return;

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const gEl = container.querySelector('.rd3t-g') as SVGGElement | null;
      if (!gEl) return;

      const bbox = gEl.getBBox();
      const containerWidth = container.clientWidth;
      const treeCenterX = bbox.x + bbox.width / 2;

      setTranslate({ x: containerWidth / 2 - treeCenterX, y: 60 });
    }, 400);

    return () => clearTimeout(timer);
  }, [treeData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(rootInput);
    if (val > 0) setRootId(val);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderNodeLabel = ({ nodeDatum, toggleNode }: { nodeDatum: any; toggleNode?: () => void }) => {
    const raw = nodeDatum._raw;
    const rankKey = raw?.rank || 'user';
    const style = RANK_COLORS[rankKey] || RANK_COLORS.user;
    const Icon = style.icon;
    const isInactive = raw?.status !== 'active';
    const hasChildren = (nodeDatum.children && nodeDatum.children.length > 0) || (nodeDatum._children && nodeDatum._children.length > 0);
    const isCollapsed = !!(nodeDatum._children && nodeDatum._children.length > 0);

    return (
      <g>
        <foreignObject x="-110" y="-45" width="220" height="150" style={{ overflow: 'visible' }}>
          <div 
            className={cn(
              "relative rounded-2xl p-0.5 transition-all transform hover:-translate-y-1 hover:scale-105 cursor-pointer z-10",
              isInactive ? "opacity-60 grayscale" : ""
            )}
            onClick={() => {
              // Click main card to go to detail, click expand wrapper to toggle
              if (raw?.id) router.push(`/dashboard/users/${raw.id}`);
            }}
          >
            {/* Outer 3D Glossy Border Effect */}
            <div className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-b opacity-80", 
              style.from, style.to, style.shadow
            )}></div>
            
            {/* Inner White Card */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-[14px] p-3 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_2px_4px_rgba(0,0,0,0.1)] flex flex-col gap-2 h-full border border-white/40">
              
              {/* Header: Rank Badge & Connections */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md shadow-sm", `bg-gradient-to-b ${style.from} ${style.to}`)}>
                  <Icon className="w-3 h-3 text-white drop-shadow-sm" />
                  <span className="text-[10px] font-black text-white tracking-widest drop-shadow-sm">
                    {nodeDatum.attributes?.rank}
                  </span>
                </div>
                {/* Active Indicator */}
                <span className="relative flex h-2.5 w-2.5">
                  {!isInactive && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", `${style.from.replace('from-', 'bg-')}`)}></span>}
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5 shadow-inner", isInactive ? 'bg-slate-300' : `${style.from.replace('from-', 'bg-')}`)}></span>
                </span>
              </div>

              {/* Body: ID & Details */}
              <div className="flex flex-col items-center justify-center pt-1">
                <span className="text-[14px] font-black text-slate-800 tracking-tight truncate w-full flex justify-center drop-shadow-sm">
                  {nodeDatum.name}
                </span>
                <span className="text-[11px] font-extrabold text-slate-400 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 보유: <span className="text-slate-700">{nodeDatum.attributes?.bal}</span>
                </span>
              </div>

            </div>

            {/* Expand / Collapse Button (Absolute positioned at bottom) */}
            {hasChildren && (
              <div 
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 shadow-md border border-slate-200 cursor-pointer z-20 hover:bg-slate-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof toggleNode === 'function') toggleNode();
                }}
              >
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-b text-white font-black text-[12px] shadow-sm", style.from, style.to)}>
                  {isCollapsed ? '+' : '-'}
                </div>
              </div>
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* 3D Glass Header Component */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f7fa] border border-[#e5e9f0] rounded-2xl shadow-[inset_0_-4px_0_rgba(200,205,215,0.4),_inset_0_4px_6px_rgba(255,255,255,1),_0_6px_10px_rgba(0,0,0,0.05)] p-5 px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-gradient-to-b from-white to-[#f0f4f8] border border-[#d1d7e0] shadow-[inset_0_-2px_0_rgba(200,206,214,0.4),_0_2px_4px_rgba(0,0,0,0.05)] flex items-center justify-center hover:to-[#e4e9ef] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-2xl font-black tracking-tight text-slate-800 drop-shadow-sm flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" /> 회원 트리
              </h2>
              <p className="text-[13px] font-extrabold text-slate-500 tracking-tight mt-0.5">최상위 3D 젤리 UI 기반 다단계 구조 시각화 모니터링</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min="1"
                className="w-48 h-10 pl-9 pr-4 rounded-xl border border-[#d1d7e0] bg-white text-[13px] font-bold text-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all placeholder:text-slate-400 placeholder:font-semibold"
                value={rootInput}
                onChange={(e) => setRootInput(e.target.value)}
                placeholder="회원 ID 입력"
              />
            </div>
            <button 
              type="submit" 
              className="px-5 h-10 rounded-xl bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white font-black text-[13px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_6px_rgba(30,106,219,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-transform"
            >
              검색
            </button>
          </form>
        </div>
      </div>

      {/* Legend Map */}
      <div className="flex gap-3 flex-wrap bg-white/50 backdrop-blur-md p-3 px-5 rounded-2xl shadow-sm border border-white/60">
        <span className="text-[12px] font-black text-slate-400 py-1 mr-2">계급도 범례:</span>
        {Object.entries(RANK_COLORS).map(([rank, style]) => {
          const Icon = style.icon;
          return (
            <div key={rank} className={cn("flex items-center gap-1.5 px-3 py-1 rounded-xl shadow-[inset_0_-1px_0_rgba(0,0,0,0.1),_0_2px_3px_rgba(0,0,0,0.05)]", `bg-gradient-to-b ${style.from} ${style.to}`)}>
              <Icon className="w-3 h-3 text-white drop-shadow-sm" />
              <span className="text-[11px] font-black text-white px-0.5 drop-shadow-sm">{RANK_LABELS[rank] || rank}</span>
            </div>
          );
        })}
      </div>

      {/* Massive Tree Canvas Board */}
      <div className="relative bg-gradient-to-b from-[#f8fafc] to-[#eef2f6] border border-[#e2e8f0] rounded-[24px] shadow-[inset_0_4px_6px_rgba(0,0,0,0.02),_0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy-light.png')] opacity-[0.15] mix-blend-multiply pointer-events-none" />
        
        <div className="p-1">
          {!rootId ? (
            <div className="h-[650px] flex flex-col items-center justify-center text-slate-400 z-10 relative bg-white/50 m-2 rounded-[20px] backdrop-blur-sm border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <Users className="w-16 h-16 text-slate-300 mb-4 drop-shadow-sm" />
              <p className="text-[18px] font-black text-slate-600 mb-1">회원 ID를 입력하여 다단계 트리를 조회하세요</p>
              <p className="text-[13px] font-bold text-slate-400">해당 회원을 다단계 조직의 최상위 루트로 시각화합니다.</p>
            </div>
          ) : loading ? (
            <div className="h-[650px] flex items-center justify-center relative z-10">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin drop-shadow-md" />
            </div>
          ) : !treeData ? (
            <div className="h-[650px] flex items-center justify-center text-slate-400 font-black relative z-10">
              데이터가 없거나 트리를 생성할 수 없습니다
            </div>
          ) : (
            <div className="h-[750px] w-full relative z-10 cursor-grab active:cursor-grabbing" ref={containerRef}>
              <Tree
                data={treeData}
                orientation="vertical"
                pathFunc="step"
                translate={translate}
                separation={{ siblings: 1.5, nonSiblings: 2 }}
                nodeSize={{ x: 250, y: 220 }}
                // Override path style globally via CSS or props
                pathClassFunc={() => 'stroke-slate-300 stroke-[3px] opacity-70 drop-shadow-sm'}
                renderCustomNodeElement={renderNodeLabel}
                collapsible={true}
                depthFactor={220}
                zoomable={true}
                scaleExtent={{ min: 0.2, max: 2 }}
                transitionDuration={400}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
