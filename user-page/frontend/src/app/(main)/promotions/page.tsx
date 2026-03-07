'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

type PromoCard = {
  id: number;
  title: string;
  subtitle: string;
  href: string;
  category: string;
  gradient: string;
  emoji: string;
  dark: boolean;
};

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All Promotions' },
  { value: 'checkin', label: '7 Days Check-in Bonus' },
  { value: 'deposit', label: 'Deposit Bonus' },
  { value: 'event', label: 'General Activity' },
  { value: 'payback', label: 'Cashback' },
];

const CATEGORY_STYLES: Record<string, { gradient: string; emoji: string; defaultHref: string }> = {
  checkin: { gradient: 'from-[#2c2d33] to-blue-900/40', emoji: '📅', defaultHref: '/promotions/attendance' },
  deposit: { gradient: 'from-amber-600 via-yellow-500 to-orange-500', emoji: '🎁', defaultHref: '#' },
  event: { gradient: 'from-indigo-900 via-purple-800 to-blue-700', emoji: '🚀', defaultHref: '/promotions/missions' },
  payback: { gradient: 'from-emerald-700 via-green-600 to-teal-600', emoji: '💰', defaultHref: '#' },
};
const DEFAULT_CATEGORY_STYLE = { gradient: 'from-gray-900 via-gray-800 to-gray-700', emoji: '🎉', defaultHref: '#' };

const FALLBACK_PROMO_CARDS: PromoCard[] = [
  {
    id: 1,
    title: 'Check-in',
    subtitle: 'and earn up to $50,000\nRewards!',
    href: '/promotions/attendance',
    category: 'checkin',
    gradient: 'from-[#2c2d33] to-blue-900/40',
    emoji: '📅',
    dark: true,
  },
  {
    id: 2,
    title: '40,000',
    subtitle: 'GOLDEN FORTUNE\nTOURNAMENT',
    href: '/promotions/missions',
    category: 'event',
    gradient: 'from-indigo-900 via-purple-800 to-blue-700',
    emoji: '🚀',
    dark: true,
  },
  {
    id: 3,
    title: '1,000,000',
    subtitle: 'CASH BOMBS',
    href: '#',
    category: 'event',
    gradient: 'from-purple-900 via-violet-800 to-purple-700',
    emoji: '👻',
    dark: true,
  },
  {
    id: 4,
    title: '40,000',
    subtitle: 'HOLIDAY SPIRIT',
    href: '#',
    category: 'event',
    gradient: 'from-sky-400 via-cyan-300 to-blue-400',
    emoji: '🧜‍♀️',
    dark: true,
  },
  {
    id: 5,
    title: '100%',
    subtitle: 'FIRST DEPOSIT\nBONUS',
    href: '#',
    category: 'deposit',
    gradient: 'from-amber-600 via-yellow-500 to-orange-500',
    emoji: '🎁',
    dark: true,
  },
  {
    id: 6,
    title: 'KZ',
    subtitle: 'ANNIVERSARY\nTREASURE HUNT!',
    href: '#',
    category: 'event',
    gradient: 'from-yellow-600 via-amber-500 to-yellow-400',
    emoji: '👑',
    dark: true,
  },
  {
    id: 7,
    title: '5%',
    subtitle: 'DAILY CASHBACK',
    href: '#',
    category: 'payback',
    gradient: 'from-emerald-700 via-green-600 to-teal-600',
    emoji: '💰',
    dark: true,
  },
  {
    id: 8,
    title: '10%',
    subtitle: 'WEEKLY CASHBACK',
    href: '#',
    category: 'payback',
    gradient: 'from-rose-700 via-pink-600 to-red-600',
    emoji: '🎯',
    dark: true,
  },
  {
    id: 9,
    title: 'Gifts',
    subtitle: 'REWARD\nExchange Now',
    href: '#',
    category: 'event',
    gradient: 'from-gray-900 via-gray-800 to-gray-700',
    emoji: '🎁',
    dark: true,
  },
];

export default function PromotionsHubPage() {
  const { fetchPromotions, setPromotionCategory, promotions } = useEventStore();

  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchPromotions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayCards: PromoCard[] = useMemo(() => {
    if (promotions.length === 0) return FALLBACK_PROMO_CARDS;
    return promotions
      .filter((p) => p.isActive)
      .map((p) => {
        const style = CATEGORY_STYLES[p.category] || DEFAULT_CATEGORY_STYLE;
        return {
          id: p.id,
          title: p.title,
          subtitle: p.description,
          href: style.defaultHref,
          category: p.category,
          gradient: style.gradient,
          emoji: style.emoji,
          dark: true,
        };
      });
  }, [promotions]);

  const handleFilter = (value: string) => {
    setActiveFilter(value);
    setPromotionCategory(value);
  };

  const filteredCards = activeFilter === 'all'
    ? displayCards
    : displayCards.filter((c) => c.category === activeFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* Category tab filter - kzkzb style */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2 border-b border-[#e8e8e8]/50">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilter(filter.value)}
            className={cn(
              'shrink-0 px-4 py-2 text-[15px] font-bold transition-all whitespace-nowrap',
              activeFilter === filter.value
                ? 'bg-[#feb614] text-white rounded-full shadow-sm'
                : 'text-[#6b7280] hover:text-[#252531]'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 2-column promotion cards grid - kzkzb style */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group relative overflow-hidden rounded-[16px] shadow-sm transition-transform hover:scale-[1.02]"
          >
            <div
              className={cn(
                'relative flex min-h-[180px] flex-col justify-center bg-gradient-to-br px-8 py-6',
                card.gradient
              )}
            >
              {/* Large emoji decoration */}
              <div className="absolute right-4 bottom-4 text-[100px] opacity-20 drop-shadow-md">
                {card.emoji}
              </div>

              {/* Card content */}
              <div className={cn(
                'relative z-10 w-[70%]',
                card.dark ? 'text-white' : 'text-white'
              )}>
                {card.id === 1 ? (
                  <>
                    <h3 className="text-[40px] font-black leading-tight tracking-tight">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[15px] font-medium opacity-80 leading-snug">
                      {card.subtitle}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[28px] font-black tracking-tight leading-none mb-1">
                      {card.title.match(/^\d/) ? `$ ${card.title}` : card.title}
                    </p>
                    <p className="whitespace-pre-line text-[14px] font-bold uppercase tracking-wide leading-tight">
                      {card.subtitle}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl">🎉</span>
          <p className="mt-2 text-sm text-[#6b7280]">
            해당 카테고리에 프로모션이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
