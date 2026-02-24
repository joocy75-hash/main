import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const FOOTER_LINKS = [
  { name: '이용약관', href: '/terms' },
  { name: '개인정보처리방침', href: '/privacy' },
  { name: '책임감 있는 게임', href: '/responsible-gaming' },
];

export const Footer = ({ className }: { className?: string }) => {
  return (
    <footer className={cn('border-t border-border bg-card/30', className)}>
      <div className="px-6 py-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-primary">GP</span>
            <Separator orientation="vertical" className="h-4" />
            <Badge variant="outline" className="text-xs font-semibold">
              18+
            </Badge>
          </div>

          <nav className="flex flex-wrap items-center gap-4">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="my-4" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Game Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
