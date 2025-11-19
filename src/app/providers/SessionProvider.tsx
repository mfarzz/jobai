"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Toaster } from "@/app/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      {children}
      <Toaster position="top-right" />
    </NextAuthSessionProvider>
  );
}

