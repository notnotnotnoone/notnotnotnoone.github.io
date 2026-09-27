"use client";

import { ArrowUpRight } from "lucide-react";
import { Box } from "@/components/ui/box";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { AGORA, STASH } from "@/lib/links";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

const PROJECTS = [
  {
    name: "stash",
    href: STASH,
    text: "An AI inventory for storage boxes. Photograph your boxes, ask what is in them, and browse them on a 3D map.",
  },
  {
    name: "agora",
    href: AGORA,
    text: "Two AI models argue opposite sides of a dilemma in real time while you watch.",
  },
];

export function BuiltWith() {
  return (
    <section className="wrap section" id="built">
      <Reveal>
        <SectionTitle>Built with flexrouter</SectionTitle>
      </Reveal>
      <div className="built-grid">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <Box lift className="built-card">
              <div className="flex items-center justify-between gap-3">
                <span className="built-name mono">{p.name}</span>
                <Tag>Being updated</Tag>
              </div>
              <p>{p.text}</p>
              <ButtonLink kind="ghost" size="sm" href={p.href} external icon={ArrowUpRight} label="GitHub" />
            </Box>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
