import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-card/50 p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-primary">
            GP
          </span>
          <span className="text-xl font-semibold">Game Platform</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
