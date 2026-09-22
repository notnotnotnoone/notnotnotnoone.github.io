import Link from "next/link";
import Nav from "./Nav";
import Demo from "./Demo";

const heroCode = `<span class="prompt">$</span> flexrouter dashboard
<span class="out">#  → http://localhost:4891</span>

<span class="prompt">$</span> curl localhost:4891/v1/chat/completions \\
    -d <span class="c-str">'{"model": "balanced", "messages": [...]}'</span>
<span class="out">#  routed to cerebras/qwen-235b · $0.00</span>

<span class="c-com"># any OpenAI-compatible app or SDK works too — no flexrouter code needed</span>

<span class="prompt">$</span> <span class="cursor">▌</span>`;

const stats = [
  { n: "6", g: false, l: "providers, one API" },
  { n: "MIT", g: true, l: "open source, self-hosted" },
  { n: "1", g: false, l: "shared address, every app" },
  { n: "$0", g: true, l: "spend on free tiers" },
];

const spokes = [
  { consumes: "consumes flexrouter", name: "stash", desc: "Personal AI inventory for storage boxes — 3D map, multi-turn chat, one-liner setup. Launched." },
  { consumes: "same pattern, in TS", name: "agora", desc: "A live demo that re-implements flexrouter's routing in TypeScript to survive free-tier limits in the browser." },
];

export default function Home() {
  return (
    <>
      <Nav />
      <div className="wrap">
        {/* HERO */}
        <header className="hero">
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="dot" />resilient AI infrastructure</div>
              <h1>Rate limits are <span className="accent">a suggestion.</span></h1>
              <p className="hero-sub">
                flexrouter turns every free API tier into one endpoint that never runs dry. It watches quotas in real
                time and reroutes the instant one caps out — <code>groq</code> exhausted, <code>cerebras</code> already
                answering. Infinite compute, completely free.
              </p>
              <div className="cta-row">
                <Link className="btn primary" href="/quickstart">Quickstart →</Link>
                <Link className="btn ghost" href="#demo">Watch it route</Link>
              </div>
            </div>
            <div className="code-card">
              <div className="code-top">
                <span className="d" /><span className="d" /><span className="d" />
                <span className="fn">terminal</span>
              </div>
              <pre className="code" dangerouslySetInnerHTML={{ __html: heroCode }} />
            </div>
          </div>
        </header>

        {/* INFINITE CLAIM */}
        <section className="claim">
          <div className="inf">∞</div>
          <h2>Infinite compute. <span className="accent">Completely free.</span> Forever.</h2>
          <p className="cl-sub">
            Stack enough free tiers behind one router and you stop running out. No credit card, no spend, no cap you can
            actually hit — flexrouter just keeps finding the next provider with room.
          </p>
        </section>

        {/* FLAGSHIP */}
        <section id="flexrouter">
          <div className="sec-head">
            <div className="eyebrow"><span className="dot" />the flagship</div>
            <h2>flexrouter — the router that never runs out</h2>
            <p className="sec-lead">
              A background server that speaks OpenAI&apos;s API. Point it at every free tier you can get, group models
              into scored buckets, and it keeps your app answering — juggling per-minute and per-day quotas, rotating
              keys, and routing around anything rate-limited. A thin Python client is there too, for code that wants to
              skip the network hop.
            </p>
          </div>
          <div className="flag">
            {stats.map((s) => (
              <div className="stat" key={s.l}>
                <div className={s.g ? "n g" : "n"}>{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PLUG AND PLAY */}
        <section id="plug">
          <div className="sec-head">
            <div className="eyebrow"><span className="dot" />plug and play</div>
            <h2>Running in three lines</h2>
            <p className="sec-lead">
              No model names in your app code, no retry loops, no rate-limit handling. Install, point it at your free
              tiers, start it.
            </p>
          </div>
          <div className="pnp-grid">
            <div className="pnp">
              <span className="pnp-num">01</span><span className="pnp-t">Install</span>
              <div className="pnp-code">pip install git+…/flexrouter</div>
            </div>
            <div className="pnp">
              <span className="pnp-num">02</span><span className="pnp-t">Configure</span>
              <div className="pnp-code">edit config.yaml</div>
            </div>
            <div className="pnp">
              <span className="pnp-num">03</span><span className="pnp-t">Serve</span>
              <div
                className="pnp-code"
                dangerouslySetInnerHTML={{
                  __html: '<span class="c-fn">flexrouter</span> dashboard',
                }}
              />
            </div>
          </div>
          <div className="cta-row" style={{ marginTop: "1.8rem" }}>
            <Link className="btn primary" href="/quickstart">Full quickstart →</Link>
          </div>
        </section>

        {/* CONSUMERS */}
        <section id="consumers">
          <div className="sec-head">
            <div className="eyebrow"><span className="dot" />one engine, many products</div>
            <h2>Everything I build runs on flexrouter</h2>
            <p className="sec-lead">
              flexrouter is the hub. My other projects are its consumers — the same resilient routing under a
              full-stack app and a live demo.
            </p>
          </div>
          <div className="engine-bar">
            <span className="eb-name">flexrouter</span>
            <span className="eb-desc">the routing engine — OpenAI-compatible server · bucket-based · quota-aware</span>
          </div>
          <div className="spokes">
            {spokes.map((s) => (
              <div className="spoke" key={s.name}>
                <span className="spoke-consumes">{s.consumes}</span>
                <span className="spoke-name">{s.name}</span>
                <span className="spoke-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* DEMO */}
        <Demo />

        {/* AGORA */}
        <section id="agora">
          <div className="sec-head">
            <div className="eyebrow"><span className="dot" />see it live</div>
            <h2>agora — two models argue, you watch</h2>
            <p className="sec-lead">
              The live demo. Give it a moral dilemma and two AI models debate opposite sides in real time — kept online
              by the same free-tier routing, right in the browser.
            </p>
          </div>
          <div className="agora-card">
            <div className="agora-top">
              <div className="agora-dilemma">
                <span className="q">the dilemma</span>
                A runaway trolley will kill five. Pull the lever to divert it, killing one?
              </div>
            </div>
            <div className="agora-debate">
              <div className="arg pull">
                <div className="arg-side">pull the lever · <span className="arg-model">cerebras/qwen-235b</span></div>
                <p className="arg-text">
                  Five lives outweigh one. Inaction is still a choice, and the math is unambiguous — minimizing death is
                  the only defensible outcome.
                </p>
              </div>
              <div className="arg dont">
                <div className="arg-side">don&apos;t · <span className="arg-model">groq/llama-3.3-70b</span></div>
                <p className="arg-text">
                  Pulling the lever makes you the direct cause of a death. There&apos;s a moral line between letting harm
                  happen and actively killing someone.
                </p>
              </div>
            </div>
            <div className="agora-cta">
              <span className="note">runs on flexrouter&apos;s free-tier juggling + a rate limit so nobody can flood it</span>
              <a className="btn primary" href="https://github.com/notnotnotnoone/agora">Launch agora →</a>
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects">
          <div className="sec-head">
            <div className="eyebrow"><span className="dot" />the products</div>
            <h2>Built on the engine</h2>
          </div>
          <div className="proj-grid">
            <div className="proj">
              <div className="proj-head">
                <span className="proj-name">stash</span>
                <span className="proj-status flagship">launched</span>
              </div>
              <p className="proj-desc">
                Personal AI inventory for storage boxes. Photograph your boxes, ask questions in natural language,
                browse your stuff on a 3D map. One-liner setup, free Groq API for chat.
              </p>
              <div className="proj-tags">
                <span className="ptag">python</span><span className="ptag">react</span>
                <span className="ptag">3d</span><span className="ptag on-fr">↑ flexrouter</span>
              </div>
              <div className="proj-links">
                <a href="https://github.com/notnotnotnoone/stash">github ↗</a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer>
        <div className="wrap foot-grid">
          <div>
            <Link className="brand" href="/"><span className="mark" />notnotnotnoone</Link>
            <p className="foot-note" style={{ marginTop: "1rem" }}>
              I build <span className="b">resilient AI infrastructure</span> — engines that keep LLM apps alive on free
              tiers forever.
            </p>
          </div>
          <div className="foot-repos">
            <a href="https://github.com/notnotnotnoone/flexrouter">flexrouter — the engine</a>
            <a href="https://github.com/notnotnotnoone/stash">stash — AI inventory</a>
            <a href="https://github.com/notnotnotnoone/agora">agora — live demo</a>
            <a href="https://github.com/notnotnotnoone/funaithings" className="archived">funaithings — archived</a>
          </div>
        </div>
      </footer>
    </>
  );
}
