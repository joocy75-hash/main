import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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

const INFO_LINKS = [
  { name: 'Promotions', href: '/promotions' },
  { name: 'VIP', href: '/promotions/vip' },
  { name: 'Sponsor', href: '/affiliate' },
  { name: 'Affiliate', href: '/affiliate' },
  { name: 'Help Desk', href: '/support' },
  { name: 'Live Support', href: '/support' },
];

const PAYMENT_METHODS = [
  { name: 'Bitcoin', src: '/images/payment-icons/bitcoin.webp' },
  { name: 'Crypto', src: '/images/payment-icons/crypto.webp' },
  { name: 'GPay', src: '/images/payment-icons/gpay.webp' },
  { name: 'Local Bank', src: '/images/payment-icons/local_bank.webp' },
  { name: 'Mastercard', src: '/images/payment-icons/mastercard.webp' },
  { name: 'Net Banking', src: '/images/payment-icons/net_banking.webp' },
  { name: 'UPI', src: '/images/payment-icons/upi.webp' },
  { name: 'VISA', src: '/images/payment-icons/visa.webp' },
];

const CURRENCIES = [
  { name: 'USDT', src: '/images/currency/USDT.webp' },
  { name: 'CNY', src: '/images/currency/CNY.webp' },
  { name: 'PHP', src: '/images/currency/PHP.webp' },
  { name: 'IDR', src: '/images/currency/IDR.webp' },
  { name: 'INR', src: '/images/currency/INR.webp' },
  { name: 'JPY', src: '/images/currency/JPY.webp' },
  { name: 'THB', src: '/images/currency/THB.webp' },
  { name: 'VND', src: '/images/currency/VND.webp' },
  { name: 'MXN', src: '/images/currency/MXN.webp' },
  { name: 'TRY', src: '/images/currency/TRY.webp' },
];

const CRYPTO_ACCEPTED = [
  { name: 'MBTC', src: '/images/currency/MBTC.webp' },
  { name: 'ETH', src: '/images/currency/ETH.webp' },
  { name: 'USDT', src: '/images/currency/USDT.webp' },
];

export const Footer = ({ className }: { className?: string }) => {
  return (
    <footer className={cn('border-t border-[#3a3a4a] bg-[#1e1e24] shadow-[inset_0_20px_20px_-20px_rgba(0,0,0,0.5)] font-sans', className)}>
      <div className="px-6 py-10">
        {/* --- Main 4-column grid --- */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Responsible Gambling */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#94a3b8]/30 text-[15px] font-black text-[#cbd5e1] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),_0_2px_4px_rgba(0,0,0,0.2)] bg-gradient-to-br from-[#2a2a32] to-[#1e1e24]">
                21+
              </span>
              <h3 className="text-[15px] font-bold tracking-wide text-white drop-shadow-md">
                Responsible<br />Gambling
              </h3>
            </div>
            <p className="text-[13px] font-medium leading-relaxed text-[#94a3b8]">
              Please gamble responsibly. Set deposit and loss limits. Take regular breaks from gaming.
            </p>
          </div>

          {/* Games */}
          <div>
            <h3 className="mb-4 text-[15px] font-bold tracking-wide text-white drop-shadow-md">Games</h3>
            <nav className="flex flex-col gap-2">
              {GAME_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[14px] font-medium text-[#94a3b8] transition-all hover:text-[#f4b53e] hover:translate-x-1 inline-block w-fit"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 text-[15px] font-bold tracking-wide text-white drop-shadow-md">Info</h3>
            <nav className="flex flex-col gap-2">
              {INFO_LINKS.map((link, i) => (
                <Link
                  key={`${link.name}-${i}`}
                  href={link.href}
                  className="text-[14px] font-medium text-[#94a3b8] transition-all hover:text-[#f4b53e] hover:translate-x-1 inline-block w-fit"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social Network */}
          <div>
            <h3 className="mb-4 text-[15px] font-bold tracking-wide text-white drop-shadow-md">Social Network</h3>
            <div className="flex gap-2">
              <Link
                href="#"
                className="flex size-11 items-center justify-center rounded-full bg-gradient-to-b from-[#32323e] to-[#202028] shadow-[0_4px_6px_rgba(0,0,0,0.3),_inset_0_-3px_0_rgba(20,20,25,0.8),_inset_0_2px_3px_rgba(255,255,255,0.05)] transition-all hover:-translate-y-1 hover:brightness-110 active:translate-y-0 active:shadow-[0_2px_3px_rgba(0,0,0,0.3),_inset_0_-1px_0_rgba(20,20,25,0.8),_inset_0_1px_2px_rgba(255,255,255,0.02)]"
                title="Telegram"
              >
                <div className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-white/5 to-transparent">
                  <Image
                    src="/images/social/telegram.webp"
                    alt="Telegram"
                    width={24}
                    height={24}
                    className="object-contain opacity-90 drop-shadow-md"
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* --- Separator --- */}
        <div className="my-8 border-t border-white/5 shadow-[0_1px_0_rgba(0,0,0,0.4)]" />

        {/* --- Payment / Currency / Crypto --- */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h4 className="mb-4 text-[15px] font-bold tracking-wide text-white drop-shadow-sm">Payment Method</h4>
            <div className="flex flex-wrap gap-2.5">
              {PAYMENT_METHODS.map((m) => (
                <span 
                  key={m.name} 
                  className="flex items-center justify-center rounded-md border-none bg-gradient-to-b from-[#2a2a35] to-[#1e1e26] px-3 py-2 shadow-[0_3px_5px_rgba(0,0,0,0.2),_inset_0_-2px_0_rgba(15,15,20,0.6),_inset_0_1px_1px_rgba(255,255,255,0.05)] transition-transform hover:-translate-y-0.5 relative overflow-hidden group" 
                  title={m.name}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Image src={m.src} alt={m.name} width={32} height={22} className="object-contain drop-shadow-sm relative z-10" unoptimized />
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-[15px] font-bold tracking-wide text-white drop-shadow-sm">Currency Accepted</h4>
            <div className="flex flex-wrap gap-2.5">
              {CURRENCIES.map((c) => (
                <span 
                  key={c.name} 
                  className="group flex size-[38px] items-center justify-center rounded-full bg-gradient-to-b from-[#2a2a35] to-[#1e1e26] shadow-[0_3px_5px_rgba(0,0,0,0.2),_inset_0_-2px_0_rgba(15,15,20,0.6),_inset_0_1px_2px_rgba(255,255,255,0.08)] transition-transform hover:-translate-y-1 relative" 
                  title={c.name}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Image src={c.src} alt={c.name} width={30} height={30} className="object-contain drop-shadow-md relative z-10" unoptimized />
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-4 text-[15px] font-bold tracking-wide text-white drop-shadow-sm">Crypto Accepted</h4>
            <div className="flex flex-wrap gap-2.5">
              {CRYPTO_ACCEPTED.map((c) => (
                <span 
                  key={c.name} 
                  className="group flex size-[38px] items-center justify-center rounded-full bg-gradient-to-b from-[#2a2a35] to-[#1e1e26] shadow-[0_3px_5px_rgba(0,0,0,0.2),_inset_0_-2px_0_rgba(15,15,20,0.6),_inset_0_1px_2px_rgba(255,255,255,0.08)] transition-transform hover:-translate-y-1 relative" 
                  title={c.name}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Image src={c.src} alt={c.name} width={30} height={30} className="object-contain drop-shadow-md relative z-10" unoptimized />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* --- Separator --- */}
        <div className="my-8 border-t border-white/5 shadow-[0_1px_0_rgba(0,0,0,0.4)]" />

        {/* --- Bottom: Logo + Description + Copyright --- */}
        <div>
          <div className="mb-4">
            <span className="bg-gradient-to-b from-[#ffd651] to-[#fe960e] bg-clip-text text-4xl tracking-tight font-black text-transparent drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] filter">
              KZ
            </span>
          </div>
          <p className="mb-5 max-w-3xl text-[13px] font-medium leading-relaxed text-[#94a3b8]">
            KZ Casino is a trustworthy online gaming platform. We are committed to providing honest and reliable services with a wide selection of games, sports betting, and promotions for our valued members.
          </p>
          <p className="text-xs font-semibold tracking-wide text-[#64748b]">
            Copyright &copy; {new Date().getFullYear()} KZ Casino. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
