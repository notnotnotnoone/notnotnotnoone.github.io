import { Box } from "@/components/ui/box";
import { Reveal } from "./reveal";
import { SectionTitle } from "./section-title";

export function PlainWords() {
  return (
    <section className="wrap section" id="what">
      <Reveal>
        <Box lift className="plain">
          <SectionTitle>What is flexrouter?</SectionTitle>
          <p className="plain-short">
            <strong>Short answer:</strong> a tool that lets apps run on free AI without hitting the limits.
          </p>
          <p>
            Google, Groq, Mistral and a few other AI companies give developers free access to their models, but the
            limits are tight. Some of Google&apos;s newest models allow 20 requests a day. Groq&apos;s free tier stops at
            around 30 a minute. That sounds like plenty until you realise a modern AI app, like a coding assistant or
            anything that uses tools, can fire off a dozen requests for a single thing you ask it. On one free account,
            it stalls within minutes.
          </p>
          <p>
            flexrouter pools them. It runs in the background on your computer, and every app sends its AI requests to
            it instead of to one company. It tracks how much free usage is left everywhere and sends each request to
            the best model that still has room. When one hits its limit, the next one takes over, so the app keeps
            working and the bill stays at zero.
          </p>
          <p>A dashboard shows where every request went, what&apos;s left for the day, and what broke and why.</p>
          <p className="plain-asof">Limits as of September 2026.</p>
        </Box>
      </Reveal>
    </section>
  );
}
