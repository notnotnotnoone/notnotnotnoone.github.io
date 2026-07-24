import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../Nav";

export const metadata: Metadata = {
  title: "flexrouter quickstart — unlimited compute in 3 lines",
  description:
    "Install flexrouter, point it at your free tiers, and call one method. Plug and play.",
};

const configCode = `<span class="c-com"># group models into scored tiers — flexrouter picks the best available</span>
tiers:
  balanced:
    - {provider: cerebras, model: qwen-3-235b, score: 90, rpm: 30, tpm: 60000}
    - {provider: groq, model: llama-3.3-70b, score: 84, rpm: 30, tpm: 30000}
    - {provider: google, model: gemini-2.0-flash, score: 82, rpm: 15, quotas: {rpd: 1500}}

providers:
  cerebras: {base_url: https://api.cerebras.ai/v1, api_keys: [{env: CEREBRAS_API_KEY}]}
  groq:     {base_url: https://api.groq.com/openai/v1, api_keys: [{env: GROQ_API_KEY}]}
  google:   {base_url: https://generativelanguage.googleapis.com/v1beta/openai, header_parser: google, api_keys: [{env: GOOGLE_API_KEY}]}`;

const generateCode = `<span class="c-kw">from</span> flexrouter <span class="c-kw">import</span> FlexRouter

router = <span class="c-fn">FlexRouter</span>()                          <span class="c-com"># reads flexrouter.yaml</span>
reply  = router.<span class="c-fn">generate</span>(
    [{<span class="c-str">"role"</span>: <span class="c-str">"user"</span>, <span class="c-str">"content"</span>: <span class="c-str">"explain rate limits"</span>}],
    tier=<span class="c-str">"balanced"</span>,                      <span class="c-com"># ask for a quality tier, not a model</span>
)
<span class="out">#  routed to cerebras/qwen-3-235b · key #2 · $0.00</span>`;

const streamCode = `<span class="c-kw">async for</span> event <span class="c-kw">in</span> router.<span class="c-fn">agenerate_stream</span>(messages, tier=<span class="c-str">"frontier"</span>):
    <span class="c-kw">match</span> event:
        <span class="c-kw">case</span> DeltaEvent(text): print(text, end=<span class="c-str">""</span>)      <span class="c-com"># the answer, token by token</span>
        <span class="c-kw">case</span> ReasoningDeltaEvent(text): ...             <span class="c-com"># thinking-model tokens</span>
        <span class="c-kw">case</span> ToolCallDeltaEvent(name, arguments): ...   <span class="c-com"># tool calls</span>
        <span class="c-kw">case</span> DoneEvent(result): usage = result[<span class="c-str">"usage"</span>]`;

const freeTiers = [
  { p: "groq", l: "llama · fast, high rpm" },
  { p: "cerebras", l: "qwen · frontier quality" },
  { p: "openrouter", l: ":free model catalog" },
  { p: "google", l: "gemini · huge daily cap" },
  { p: "siliconflow", l: "vision-capable" },
  { p: "+ any OpenAI-compatible", l: "add your own" },
];

export default function Quickstart() {
  return (
    <>
      <Nav />
      <div className="qs">
        <header>
          <div className="eyebrow">
            <span className="dot" />
            quickstart
          </div>
          <h1>
            Unlimited compute in <span className="accent">three lines.</span>
          </h1>
          <p className="sub">
            flexrouter is plug and play. Install it, point it at every free tier
            you have, and call one method — it handles the routing, the rate
            limits, the daily caps, and the key rotation so you never think
            about them again.
          </p>
        </header>

        <div className="steps">
          <div className="step">
            <div className="step-head">
              <span className="step-num">1</span>
              <span className="step-title">
                Install
                <span className="t2">one dependency, zero config to start</span>
              </span>
            </div>
            <div className="code">
              <span className="prompt">$</span> pip install flexrouter
            </div>
          </div>

          <div className="step">
            <div className="step-head">
              <span className="step-num">2</span>
              <span className="step-title">
                Point it at your free tiers
                <span className="t2">flexrouter.yaml</span>
              </span>
            </div>
            <pre
              className="code"
              dangerouslySetInnerHTML={{ __html: configCode }}
            />
            <div className="step-note">
              Multiple keys per provider? List them all — flexrouter rotates
              through them round-robin. Different header format? Set{" "}
              <b>header_parser</b> per provider. That&apos;s the whole config
              surface.
            </div>
          </div>

          <div className="step">
            <div className="step-head">
              <span className="step-num">3</span>
              <span className="step-title">
                Generate<span className="t2">it just works</span>
              </span>
            </div>
            <pre
              className="code"
              dangerouslySetInnerHTML={{ __html: generateCode }}
            />
            <div className="step-note">
              No model names in your app code. No retry loops. No rate-limit
              handling. If a provider is capped, flexrouter has already moved on
              to the next one with headroom — <b>your call still returns.</b>
            </div>
          </div>

          <div className="step">
            <div className="step-head">
              <span className="step-num">+</span>
              <span className="step-title">
                Streaming, too<span className="t2">structured events</span>
              </span>
            </div>
            <pre
              className="code"
              dangerouslySetInnerHTML={{ __html: streamCode }}
            />
          </div>
        </div>

        <div className="free">
          <div className="free-h">What &ldquo;free&rdquo; actually means</div>
          <div className="free-sub">
            a starter pool — every one of these has a no-cost tier
          </div>
          <div className="free-grid">
            {freeTiers.map((f) => (
              <div className="free-item" key={f.p}>
                <div className="fp">{f.p}</div>
                <div className="fl">{f.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="closer">
          <h2>
            Stack enough free tiers and you get{" "}
            <span className="accent">infinite compute.</span>
          </h2>
          <p>
            That&apos;s the whole idea. flexrouter makes a dozen rate-limited
            free tiers behave like one endpoint that never runs out.
          </p>
          <div className="cta-row">
            <a
              className="btn primary"
              href="https://github.com/notnotnotnoone"
            >
              Get flexrouter on GitHub →
            </a>
            <Link className="btn ghost" href="/#demo">
              Watch the live demo
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
