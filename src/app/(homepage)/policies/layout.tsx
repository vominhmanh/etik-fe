// src/app/(homepage)/(default)/layout.tsx
import type { ReactNode } from "react";
import Header from "@/components/homepage/ui/header";
import Footer from "@/components/homepage/ui/footer";
import AosInit from "@/components/homepage/aos-init";

export default function DefaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <AosInit />
      <Header />
      <main className="grow">{children}</main>
      <Footer border />
    </>
  );
}