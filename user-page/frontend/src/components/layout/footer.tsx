import Link from 'next/link';
import { cn } from '@/lib/utils';

// Matches kzkzb.com footer exactly: Games column
const GAME_LINKS = [
  { name: 'Slots', href: '/games?category=slot' },
  { name: 'Live Casino', href: '/games?category=casino' },
  { name: 'Sports', href: '/sports' },
  { name: 'Fishing', href: '/games?category=shooting' },
  { name: 'Card Game', href: '/games?category=holdem' },
  { name: 'Lottery', href: '/games?category=coin' },
  { name: 'ESports', href: '/esports' },
  { name: '3D', href: '/games?category=mini_game' },
  { name: 'Arcade', href: '/minigame' },
];

// Info column
const INFO_LINKS = [
  { name: 'Promotions', href: '/promotions' },
  { name: 'VIP', href: '/promotions/vip' },
  { name: 'Sponsor', href: '/affiliate' },
  { name: 'Affiliate', href: '/affiliate' },
  { name: 'Help Desk', href: '/support' },
  { name: 'Live Support', href: '/support' },
];

// Payment methods
const PAYMENT_METHODS = [
  { name: 'USDT', icon: '💲' },
  { name: 'Bitcoin', icon: '₿' },
  { name: 'Crypto', icon: '🔗' },
  { name: 'VISA', icon: '💳' },
  { name: 'Mastercard', icon: '💳' },
];

// Currency circles
const CURRENCIES = ['₮', 'R$', '¥', '₱', 'Rp', '₹', '¥', '₩', '₱', '฿', '₫', '₫'];

// Crypto icons
const CRYPTO_ACCEPTED = [
  { name: 'BTC', icon: '₿', color: 'bg-orange-500' },
  { name: 'ETH', icon: '⟠', color: 'bg-blue-500' },
  { name: 'USDT', icon: '₮', color: 'bg-emerald-500' },
];

export const Footer = ({ className }: { className?: string }) => {
  return (
    <footer className={cn('border-t border-[#dddddd] bg-white', className)}>
      <div className="px-6 py-8">
        {/* Main 4-section layout */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Responsible Gambling */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-full border-2 border-[#252531]/30 text-lg font-black text-[#252531]/70">
                21+
              </span>
              <h3 className="text-sm font-semibold text-[#252531]">
                Responsible<br />Gambling
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-[#707070]">
              Please gamble responsibly. Set deposit and loss limits. Take regular breaks from gaming.
            </p>
          </div>

          {/* Games */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#252531]">Games</h3>
            <nav className="flex flex-col gap-1.5">
              {GAME_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[13px] text-[#707070] transition-colors hover:text-[#f4b53e]"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#252531]">Info</h3>
            <nav className="flex flex-col gap-1.5">
              {INFO_LINKS.map((link, i) => (
                <Link
                  key={`${link.name}-${i}`}
                  href={link.href}
                  className="text-[13px] text-[#707070] transition-colors hover:text-[#f4b53e]"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social Network */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#252531]">Social Network</h3>
            <div className="flex gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm" title="Telegram">
                📨
              </span>
            </div>
          </div>
        </div>

        <div className="my-6 border-t border-[#dddddd]" />

        {/* Payment Method / Currency / Crypto - 3 sections in a row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Payment Method */}
          <div>
            <h4 className="mb-3 text-sm font-semibold underline text-[#252531]">
              Payment Method
            </h4>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <span
                  key={m.name}
                  className="flex items-center gap-1 rounded border border-[#dddddd] bg-white px-2 py-1.5 text-xs text-[#707070]"
                >
                  <span>{m.icon}</span>
                  {m.name}
                </span>
              ))}
            </div>
          </div>

          {/* Currency Accepted */}
          <div>
            <h4 className="mb-3 text-sm font-semibold underline text-[#252531]">
              Currency Accepted
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map((c, i) => (
                <span
                  key={i}
                  className="flex size-8 items-center justify-center rounded-full bg-[#edeef3] text-xs font-bold text-[#707070]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Crypto Accepted */}
          <div>
            <h4 className="mb-3 text-sm font-semibold underline text-[#252531]">
              Crypto Accepted
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {CRYPTO_ACCEPTED.map((c) => (
                <span
                  key={c.name}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-sm font-bold text-white',
                    c.color
                  )}
                  title={c.name}
                >
                  {c.icon}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="my-6 border-t border-[#dddddd]" />

        {/* Bottom: Logo + Description + Copyright */}
        <div>
          <div className="mb-3">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-[#ffd651] to-[#fe960e] bg-clip-text text-transparent">
              KZ
            </span>
          </div>
          <p className="mb-4 max-w-3xl text-xs leading-relaxed text-[#707070]">
            KZ Casino is a trustworthy online gaming platform. We are committed to providing honest and reliable services with a wide selection of games, sports betting, and promotions for our valued members.
          </p>
          <p className="text-xs text-[#707070]">
            Copyright &copy; {new Date().getFullYear()} KZ Casino. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
