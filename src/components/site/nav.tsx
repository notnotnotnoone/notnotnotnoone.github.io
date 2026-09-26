"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { GITHUB } from "@/lib/links";
import { Logo } from "./logo";

export function Nav() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, mass: 0.3 });
  return (
    <nav className="site-nav">
      <div className="wrap nav-in">
        <Link href="/" aria-label="flexrouter home" className="nav-home">
          <Logo animate />
        </Link>
        <div className="nav-links">
          <Link href="/quickstart">Quickstart</Link>
          <Link href="/#built" className="nav-hide-sm">
            Other projects
          </Link>
          <a href={GITHUB} target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
      <motion.div className="nav-progress" style={{ scaleX }} aria-hidden />
    </nav>
  );
}
