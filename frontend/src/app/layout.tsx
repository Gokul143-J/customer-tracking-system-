import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Royal Jewellers CTS",
  description: "Customer Journey Management System",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
