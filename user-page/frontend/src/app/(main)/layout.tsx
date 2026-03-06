import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuthGuard } from "@/components/common/auth-guard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-[#f1f2f7]">
        {/* Header: 70px fixed top */}
        <Header />
        <div className="flex flex-1">
          {/* Sidebar: 270px width on desktop */}
          <Suspense>
            <Sidebar className="hidden w-[270px] shrink-0 lg:block" />
          </Suspense>
          {/* Main content: 56px bottom padding on mobile for bottom nav */}
          <main className="flex-1 p-4 pt-4 pb-14 lg:px-4 lg:pt-3 lg:pb-6">{children}</main>
        </div>
        <Footer className="hidden lg:block" />
        {/* Mobile bottom nav: 56px height */}
        <MobileNav className="lg:hidden" />
      </div>
    </AuthGuard>
  );
}
