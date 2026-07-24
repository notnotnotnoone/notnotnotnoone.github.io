import type { Metadata } from "next";
import "./globals.css";
import Motion from "./Motion";

export const metadata: Metadata = {
  title: "notnotnotnoone — resilient AI infrastructure",
  description:
    "flexrouter turns every free API tier into one endpoint that never runs dry. Infinite compute, completely free.",
};

// Reveal everything if JS is disabled (GSAP normally does the revealing).
const noscriptReveal = `html.motion .hero .eyebrow,html.motion .hero h1,html.motion .hero-sub,html.motion .hero .cta-row,html.motion .code-card,html.motion .qs header,html.motion .sec-head,html.motion .flag,html.motion .pnp,html.motion .engine-bar,html.motion .spoke,html.motion .panel,html.motion .agora-card,html.motion .proj,html.motion .step,html.motion .free,html.motion .closer,html.motion .claim{opacity:1!important;transform:none!important}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="motion">
      <head>
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: noscriptReveal }} />
        </noscript>
      </head>
      <body>
        {children}
        <Motion />
      </body>
    </html>
  );
}
