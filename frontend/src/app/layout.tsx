import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NotificationContainer, ErrorBoundary } from "@/components/ui";
import ModalManager from "@/components/modals/ModalManager";
import RealtimeProvider from "@/components/providers/RealtimeProvider";
import SEOHead, { SEOConfigs } from "@/components/seo/SEOHead";
import { basicPerformanceMonitor as performanceMonitor } from "@/lib/performance";
import { LazyComponent } from "@/components/lazy/LazyComponents";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

export const metadata: Metadata = {
  title: "Collaborative Publishing Platform",
  description: "A modern platform for collaborative content creation and publishing",
  keywords: ["collaborative", "publishing", "content", "writing", "team"],
  authors: [{ name: "Your Organization" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#3B82F6",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Collaborative Publishing Platform",
    description: "A modern platform for collaborative content creation and publishing",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Collaborative Publishing Platform",
    description: "A modern platform for collaborative content creation and publishing",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize performance monitoring
  if (typeof window !== 'undefined') {
    performanceMonitor.init();
  }

  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//localhost" />
        
        {/* Preload critical CSS */}
        <link rel="preload" href="/globals.css" as="style" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          {children}
          <LazyComponent>
            <NotificationContainer />
          </LazyComponent>
          <LazyComponent>
            <ModalManager />
          </LazyComponent>
          <LazyComponent>
            <RealtimeProvider />
          </LazyComponent>
        </ErrorBoundary>
      </body>
    </html>
  );
}
