import { Header } from "@/components/ui/Header";
import type { Metadata } from "next";



export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Header />
      <main className="portal-main" id="main-content">
        {children}
      </main>
    </div>
  );
}
