'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All Promotions' },
  { value: 'checkin', label: '7 Days Check-in Bonus' },
  { value: 'deposit', label: 'Deposit Bonus' },
  { value: 'event', label: 'General Activity' },
  { value: 'payback', label: 'Cashback' },
];

const PROMO_CARDS = [
  {
    id: 1,
    title: 'Check-in',
    subtitle: 'and earn up to $50,000\nRewards!',
    href: '/promotions/attendance',
    category: 'checkin',
    gradient: 'from-white to-blue-50',
    emoji: '📅',
    dark: false,
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
  const {
    promotions,
    promotionCategory,
    fetchPromotions,
    setPromotionCategory,
  } = useEventStore();

  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchPromotions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilter = (value: string) => {
    setActiveFilter(value);
    setPromotionCategory(value);
  };

  const filteredCards = activeFilter === 'all'
    ? PROMO_CARDS
    : PROMO_CARDS.filter((c) => c.category === activeFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* Category tab filter - kzkzb style */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilter(filter.value)}
            className={cn(
              'shrink-0 rounded-2xl px-4 py-1.5 text-xs font-medium transition-all',
              activeFilter === filter.value
                ? 'bg-[#f4b53e] text-black'
                : 'bg-[#edeef3]/50 text-[#707070] hover:bg-[#edeef3]'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* 2-column promotion cards grid - kzkzb style */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredCards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
          >
            <div
              className={cn(
                'relative flex min-h-[200px] flex-col justify-center bg-gradient-to-br p-6',
                card.gradient
              )}
            >
              {/* Large emoji decoration */}
              <div className="absolute right-4 bottom-4 text-6xl opacity-30">
                {card.emoji}
              </div>

              {/* Card content */}
              <div className={cn(
                'relative z-10',
                card.dark ? 'text-white' : 'text-[#252531]'
              )}>
                {card.id === 1 ? (
                  <>
                    <h3 className="text-3xl font-extrabold leading-tight md:text-4xl">
                      {card.title}
                    </h3>
                    <p className="mt-1 whitespace-pre-line text-sm opacity-80 md:text-base">
                      {card.subtitle}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-extrabold md:text-3xl">
                      {card.title.match(/^\d/) ? `₩ ${card.title}` : card.title}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm font-bold uppercase tracking-wide md:text-base">
                      {card.subtitle}
                    </p>
                  </>
                )}
              </div>

              {/* Subtle overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {filteredCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl">🎉</span>
          <p className="mt-2 text-sm text-[#707070]">
            해당 카테고리에 프로모션이 없습니다
          </p>
        </div>
      )}
    </div>
  );
}
