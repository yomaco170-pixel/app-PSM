import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "NEXO · Démo",
  description: "Super-app locale centrée sur le chat."
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="fr">
      <body>
        <div className="page-shell">
          <Header />
          <main className="flex-1 space-y-6 px-5 pb-24 pt-6">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
