"use client";

import { useEffect } from "react";

type Model = {
  name: string;
  tier: string;
  score: number;
  vision: boolean;
  rpmLimit: number;
  tpmLimit: number;
  id: string;
  rpm: number;
  tpm: number;
  capped: boolean;
  resetAt: number;
  load: number;
};

const WINDOW_MS = 60000;
type Provider = { id: string; keys: number; lat: number; key: number; models: Model[] };

const CAPS = [
  { k: "parsing", t: "Pluggable header parsers", d: "per-provider: openai · cerebras · openrouter · google" },
  { k: "config", t: "Hot config reload", d: "edit config.yaml — applies with no restart" },
  { k: "sessions", t: "Session stickiness", d: "a conversation pins to one model for its TTL" },
  { k: "streaming", t: "Structured stream events", d: "content · reasoning · tool calls · usage" },
  { k: "budget", t: "Provider budget caps", d: "stop routing to a provider past $X / day" },
  { k: "health", t: "Health & uptime history", d: "30-day rolling health snapshot per model" },
  { k: "context", t: "Context-window aware", d: "oversized prompts skip small-window models" },
  { k: "retries", t: "Retry policies", d: "conservative · balanced · aggressive backoff" },
  { k: "hooks", t: "Request hooks", d: "pluggable middleware before each call" },
];

export default function Demo() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const providers: Provider[] = [
      { id: "groq", keys: 3, lat: 140, key: 0, models: [
        { name: "llama-3.1-8b-instant", tier: "fast", score: 72, vision: false, rpmLimit: 30, tpmLimit: 60000 } as Model,
        { name: "llama-3.3-70b", tier: "balanced", score: 84, vision: false, rpmLimit: 30, tpmLimit: 30000 } as Model,
      ]},
      { id: "cerebras", keys: 2, lat: 220, key: 0, models: [
        { name: "qwen-3-235b", tier: "frontier", score: 94, vision: false, rpmLimit: 30, tpmLimit: 60000 } as Model,
        { name: "gpt-oss-120b", tier: "balanced", score: 86, vision: false, rpmLimit: 30, tpmLimit: 60000 } as Model,
      ]},
      { id: "openrouter", keys: 2, lat: 310, key: 0, models: [
        { name: "nemotron-120b:free", tier: "frontier", score: 90, vision: false, rpmLimit: 20, tpmLimit: 50000 } as Model,
        { name: "deepseek-r1:free", tier: "frontier", score: 92, vision: false, rpmLimit: 20, tpmLimit: 50000 } as Model,
      ]},
      { id: "siliconflow", keys: 1, lat: 260, key: 0, models: [
        { name: "qwen3-vl-30b", tier: "balanced", score: 80, vision: true, rpmLimit: 100, tpmLimit: 100000 } as Model,
        { name: "glm-4-9b", tier: "fast", score: 68, vision: false, rpmLimit: 100, tpmLimit: 100000 } as Model,
      ]},
      { id: "google", keys: 3, lat: 190, key: 0, models: [
        { name: "gemini-2.0-flash", tier: "balanced", score: 82, vision: true, rpmLimit: 15, tpmLimit: 100000 } as Model,
        { name: "gemini-flash-lite", tier: "fast", score: 70, vision: false, rpmLimit: 30, tpmLimit: 100000 } as Model,
      ]},
    ];

    const tiers = ["fast", "balanced", "frontier", "vision"];
    let activeTier = "balanced";
    let total = 0;
    let selId: string | null = null;

    providers.forEach((p) => {
      p.key = 0;
      p.models.forEach((m, i) => {
        m.id = p.id + "-" + i;
        // how hard this model gets hammered — some run hot and cap, some stay cool
        m.load = 0.55 + Math.random() * 1.05;
        // stagger resets so the whole board doesn't snap back at once
        m.resetAt = Date.now() + 8000 + Math.random() * (WINDOW_MS - 8000);
        const elapsed = 1 - (m.resetAt - Date.now()) / WINDOW_MS;
        m.rpm = Math.min(m.rpmLimit, Math.round(m.rpmLimit * elapsed * m.load));
        m.tpm = Math.min(m.tpmLimit, Math.round(m.tpmLimit * elapsed * m.load * 0.9));
        m.capped = m.rpm >= m.rpmLimit || m.tpm >= m.tpmLimit;
      });
    });

    const inTier = (m: Model) => (activeTier === "vision" ? m.vision : m.tier === activeTier);
    const fmtK = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(Math.round(n)));
    const $ = (id: string) => document.getElementById(id);

    const tabsEl = $("tabs");
    const grid = $("grid");
    const cntEl = $("cnt");
    if (!tabsEl || !grid || !cntEl) return;

    const tierCount = (t: string) => {
      let n = 0;
      providers.forEach((p) => p.models.forEach((m) => { if (t === "vision" ? m.vision : m.tier === t) n++; }));
      return n;
    };

    tabsEl.innerHTML = "";
    tiers.forEach((t) => {
      const el = document.createElement("div");
      el.className = "tab" + (t === activeTier ? " active" : "");
      el.dataset.tier = t;
      el.innerHTML = t + ' <span class="tcount">' + tierCount(t) + "</span>";
      tabsEl.appendChild(el);
    });

    const onTabClick = (e: Event) => {
      const tab = (e.target as HTMLElement).closest(".tab") as HTMLElement | null;
      if (!tab || !tab.dataset.tier) return;
      activeTier = tab.dataset.tier;
      Array.from(tabsEl.children).forEach((c) =>
        c.classList.toggle("active", (c as HTMLElement).dataset.tier === activeTier)
      );
      render();
      route();
    };
    tabsEl.addEventListener("click", onTabClick);

    grid.innerHTML = "";
    providers.forEach((p) => {
      const c = document.createElement("div");
      c.className = "card";
      c.id = "card-" + p.id;
      let dots = "";
      for (let i = 0; i < p.keys; i++) dots += '<span class="key-dot" id="kd-' + p.id + "-" + i + '"></span>';
      const models = p.models.map((m) =>
        '<div class="model" id="mrow-' + m.id + '"><div class="model-head"><div class="m-left"><span class="model-name">' +
        m.name + "</span>" + (m.vision ? '<span class="vbadge">vision</span>' : "") +
        '</div><div class="m-right"><span class="score"><span class="sl">score</span> ' + m.score +
        '</span><span class="pill live" id="pill-' + m.id + '">live</span></div></div>' +
        '<div class="mm"><span class="mm-l">rpm</span><div class="bar"><div class="fill" id="rpmb-' + m.id +
        '"></div></div><span class="mm-v" id="rpmv-' + m.id + '"></span></div>' +
        '<div class="mm"><span class="mm-l">tpm</span><div class="bar"><div class="fill" id="tpmb-' + m.id +
        '"></div></div><span class="mm-v" id="tpmv-' + m.id + '"></span></div>' +
        '<div class="rst" id="rst-' + m.id + '"></div></div>'
      ).join("");
      c.innerHTML =
        '<div class="card-head"><span class="prov-name">' + p.id +
        '</span><div class="keys"><span class="keys-label">keys</span><span class="key-dots">' + dots +
        '</span><span class="key-cur" id="keyc-' + p.id + '"></span></div></div>' + models;
      grid.appendChild(c);
    });

    function paintReset(m: Model) {
      const el = $("rst-" + m.id);
      if (!el) return;
      const secs = Math.max(0, Math.ceil((m.resetAt - Date.now()) / 1000));
      el.textContent = "window resets in " + secs + "s";
      el.className = "rst" + (m.capped ? " waiting" : secs <= 8 ? " soon" : "");
    }

    function render() {
      providers.forEach((p) => {
        for (let i = 0; i < p.keys; i++) {
          const kd = $("kd-" + p.id + "-" + i);
          if (kd) kd.className = "key-dot" + (i === p.key ? " active" : "");
        }
        const kc = $("keyc-" + p.id);
        if (kc) kc.textContent = "#" + (p.key + 1) + "/" + p.keys;
        let anySel = false;
        p.models.forEach((m) => {
          const rp = Math.min(100, (m.rpm / m.rpmLimit) * 100);
          const tp = Math.min(100, (m.tpm / m.tpmLimit) * 100);
          const rb = $("rpmb-" + m.id);
          const tb = $("tpmb-" + m.id);
          if (rb) { rb.style.width = rp + "%"; rb.className = "fill" + (rp >= 100 ? " full" : rp >= 75 ? " high" : ""); }
          if (tb) { tb.style.width = tp + "%"; tb.className = "fill" + (tp >= 100 ? " full" : tp >= 75 ? " high" : ""); }
          const rv = $("rpmv-" + m.id);
          const tv = $("tpmv-" + m.id);
          if (rv) rv.textContent = Math.round(m.rpm) + " / " + m.rpmLimit;
          if (tv) tv.textContent = fmtK(m.tpm) + " / " + fmtK(m.tpmLimit);
          const row = $("mrow-" + m.id);
          const pill = $("pill-" + m.id);
          if (row) {
            row.classList.toggle("dim", !inTier(m));
            row.classList.toggle("capped", m.capped);
            row.classList.toggle("selrow", m.id === selId && !m.capped);
          }
          if (m.id === selId && !m.capped) anySel = true;
          if (pill) { pill.className = "pill " + (m.capped ? "capped" : "live"); pill.textContent = m.capped ? "429" : "live"; }
          paintReset(m);
        });
        const card = $("card-" + p.id);
        if (card) card.classList.toggle("sel", anySel);
      });
    }

    function pick() {
      const cands: { p: Provider; m: Model; head: number }[] = [];
      providers.forEach((p) => p.models.forEach((m) => {
        if (inTier(m) && !m.capped) cands.push({ p, m, head: 1 - m.rpm / m.rpmLimit });
      }));
      if (!cands.length) return null;
      let wr = cands.filter((c) => c.head > 0.12);
      if (!wr.length) wr = cands;
      wr.sort((a, b) => b.m.score - a.m.score);
      const top = wr[0].m.score;
      const band = wr.filter((c) => c.m.score >= top - 8);
      return band[Math.floor(Math.random() * band.length)];
    }

    const promptList = [
      "summarize this pull request", "explain how rate limiting works",
      "write unit tests for this module", "refactor this function to async",
      "describe the attached screenshot", "draft a commit message",
      "translate the README to Spanish",
    ];
    const stage = (id: string, on: boolean) => $(id)?.classList.toggle("on", on);
    const resetPipe = () => {
      stage("st-mdl", false); stage("st-rsp", false);
      $("conn1")?.classList.remove("flow"); $("conn2")?.classList.remove("flow");
    };

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    function route() {
      const pk = pick();
      const prompt = promptList[Math.floor(Math.random() * promptList.length)];
      resetPipe();
      stage("st-req", true);
      const reqSub = $("st-req-sub");
      if (reqSub) reqSub.textContent = '"' + prompt + '"';
      if (!pk) {
        timeouts.push(setTimeout(() => {
          $("conn1")?.classList.add("flow"); stage("st-mdl", true);
          const n = $("st-mdl-name"); const s = $("st-mdl-sub");
          if (n) n.textContent = "tier " + activeTier + " — all capped";
          if (s) s.textContent = "waiting for quota reset";
        }, 550));
        return;
      }
      const { p, m } = pk;
      const dtok = 1500 + Math.floor(Math.random() * 4500);
      selId = m.id;
      m.rpm += 1;
      m.tpm = Math.min(m.tpmLimit, m.tpm + dtok);
      p.key = (p.key + 1) % p.keys;
      if (m.rpm >= m.rpmLimit || m.tpm >= m.tpmLimit) m.capped = true;
      total += 1;
      if (cntEl) cntEl.textContent = total.toLocaleString("en-US");
      render();
      timeouts.push(setTimeout(() => {
        $("conn1")?.classList.add("flow"); stage("st-mdl", true);
        const n = $("st-mdl-name"); const s = $("st-mdl-sub");
        if (n) n.textContent = p.id + "/" + m.name;
        if (s) s.textContent = "tier " + activeTier + " · score " + m.score + " · key #" + (p.key + 1);
      }, 550));
      timeouts.push(setTimeout(() => {
        $("conn2")?.classList.add("flow"); stage("st-rsp", true);
        const l = $("st-rsp-label"); const s = $("st-rsp-sub");
        if (l) l.textContent = "✓ " + p.lat + "ms";
        if (s) s.textContent = "+1 req · +" + dtok.toLocaleString("en-US") + " tokens";
      }, 1100));
    }

    // background traffic — usage only ever climbs inside a window
    function hotLoad() {
      providers.forEach((p) => p.models.forEach((m) => {
        if (m.capped) return;
        if (Math.random() < 0.5 * m.load) m.rpm += 1;
        m.tpm += Math.round(m.tpmLimit * (0.006 + Math.random() * 0.016) * m.load);
        if (m.rpm >= m.rpmLimit || m.tpm >= m.tpmLimit) {
          m.rpm = Math.min(m.rpm, m.rpmLimit); m.tpm = Math.min(m.tpm, m.tpmLimit); m.capped = true;
        }
      }));
      render();
    }

    // the real thing: a fixed 60s window that zeroes out on reset
    function tickWindows() {
      const now = Date.now();
      let changed = false;
      providers.forEach((p) => p.models.forEach((m) => {
        if (now >= m.resetAt) {
          m.rpm = 0;
          m.tpm = 0;
          m.capped = false;
          m.resetAt = now + WINDOW_MS;
          changed = true;
        } else {
          paintReset(m);
        }
      }));
      if (changed) render();
    }

    // ---- resilience panel ----
    const pbModels = [
      { name: "google/gemini-2.0-flash", state: "up", until: 0, level: 0 },
      { name: "openrouter/deepseek-r1", state: "up", until: 0, level: 0 },
      { name: "groq/llama-3.3-70b", state: "up", until: 0, level: 0 },
    ];
    const backoffs = [30, 60, 120, 240];
    const rpds = [
      { name: "openrouter/nemotron:free", used: 41, cap: 50 },
      { name: "openrouter/deepseek:free", used: 33, cap: 50 },
      { name: "google/gemini-flash", used: 780, cap: 1500 },
    ];
    const penEl = $("penalties"); const rpdEl = $("rpds"); const logEl = $("log");
    let logLines: string[] = [];

    function renderPB() {
      if (!penEl) return;
      penEl.innerHTML = pbModels.map((m) => {
        let st: string; let cls: string;
        if (m.state === "down") {
          const rem = Math.max(0, Math.ceil((m.until - Date.now()) / 1000));
          st = 'penalized <span class="back">' + rem + "s</span> · lvl " + m.level; cls = "down";
        } else { st = "in rotation"; cls = "up"; }
        return '<div class="pb-row"><span class="pb-name ' + cls + '">' + m.name + '</span><span class="pb-state">' + st + "</span></div>";
      }).join("");
    }
    function renderRPD() {
      if (!rpdEl) return;
      rpdEl.innerHTML = rpds.map((r) => {
        const pct = Math.min(100, (r.used / r.cap) * 100);
        const full = r.used >= r.cap;
        return '<div class="rpd-row"><div class="rpd-head"><span class="nm">' + r.name + '</span><span class="ct">' +
          r.used + " / " + r.cap + ' rpd</span></div><div class="rpd-bar"><div class="rpd-fill' + (full ? " full" : "") +
          '" style="width:' + pct + '%"></div></div></div>';
      }).join("");
    }
    function pushLog(html: string) {
      if (!logEl) return;
      const now = new Date();
      const ts = String(now.getMinutes()).padStart(2, "0") + ":" + String(now.getSeconds()).padStart(2, "0");
      logLines.unshift('<div class="log-line"><span class="t">' + ts + "</span> " + html + "</div>");
      if (logLines.length > 7) logLines.pop();
      logEl.innerHTML = logLines.join("");
    }
    function resilienceTick() {
      const roll = Math.random();
      if (roll < 0.3) {
        const m = pbModels[Math.floor(Math.random() * pbModels.length)];
        if (m.state === "up") {
          m.state = "down";
          m.level = Math.min(m.level + 1, backoffs.length);
          const secs = backoffs[m.level - 1];
          m.until = Date.now() + secs * 1000;
          pushLog('<span class="r-429">429</span> from ' + m.name + ' → penalized <span class="r-warn">' + secs + "s</span>");
        }
      } else if (roll < 0.55) {
        const tgt = ["cerebras/qwen-3-235b", "siliconflow/qwen3-vl-30b", "groq/llama-3.1-8b"][Math.floor(Math.random() * 3)];
        pushLog('retry <span class="r-acc">2/3</span> → rerouted to <span class="r-ok">' + tgt + "</span>");
      } else if (roll < 0.72) {
        const r = rpds[Math.floor(Math.random() * rpds.length)];
        if (r.used < r.cap) {
          r.used += 1; renderRPD();
          if (r.used >= r.cap) pushLog('<span class="r-429">rpd cap</span> ' + r.name + " (" + r.cap + "/" + r.cap + ") → skipped until 00:00 UTC");
        }
      } else if (roll < 0.86) {
        const hp = ["cerebras: x-ratelimit-limit-requests 30", "groq: reset-requests 12s", "openrouter: remaining-tokens 48210"][Math.floor(Math.random() * 3)];
        pushLog('<span class="r-acc">learned</span> ' + hp);
      } else {
        const t2 = ["siliconflow/glm-4-9b", "google/gemini-flash-lite"][Math.floor(Math.random() * 2)];
        pushLog('routed to <span class="r-ok">' + t2 + "</span> · 1 key rotated");
      }
    }
    function pbCountdown() {
      pbModels.forEach((m) => {
        if (m.state === "down" && Date.now() >= m.until) {
          m.state = "up";
          pushLog('<span class="r-ok">recovered</span> ' + m.name + " → back in rotation");
        }
      });
      renderPB();
    }

    render(); renderPB(); renderRPD(); route();

    let intervals: ReturnType<typeof setInterval>[] = [];
    const startDemo = () => {
      intervals = [
        setInterval(route, 4200),
        setInterval(hotLoad, 1700),
        setInterval(tickWindows, 500),
        setInterval(resilienceTick, 3200),
        setInterval(pbCountdown, 1000),
      ];
    };
    const stopDemo = () => { intervals.forEach(clearInterval); intervals = []; };

    const auto = $("auto");
    let autoOn = true;
    const onAutoClick = () => {
      autoOn = !autoOn;
      auto?.classList.toggle("on", autoOn);
      if (autoOn) startDemo(); else stopDemo();
    };
    auto?.addEventListener("click", onAutoClick);

    if (!reduce) startDemo();

    return () => {
      stopDemo();
      timeouts.forEach(clearTimeout);
      tabsEl.removeEventListener("click", onTabClick);
      auto?.removeEventListener("click", onAutoClick);
    };
  }, []);

  return (
    <section id="demo">
      <div className="sec-head">
        <div className="eyebrow"><span className="dot" />flexrouter — under the hood</div>
        <h2>Watch it work</h2>
        <p className="sec-lead">
          Three views of the same engine: how it picks a model, how it survives failure, and everything else it does.
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-h">Tiered routing</h3>
        <div className="tabs" id="tabs" />
        <div className="pipe">
          <div className="stage req" id="st-req">
            <div className="st-kick">01 · request</div>
            <div className="st-label">prompt</div>
            <div className="st-sub" id="st-req-sub">—</div>
          </div>
          <div className="conn" id="conn1"><span className="ar" /></div>
          <div className="stage mdl" id="st-mdl">
            <div className="st-kick">02 · routed to</div>
            <div className="st-label" id="st-mdl-name">—</div>
            <div className="st-sub" id="st-mdl-sub">selecting…</div>
          </div>
          <div className="conn" id="conn2"><span className="ar" /></div>
          <div className="stage rsp" id="st-rsp">
            <div className="st-kick">03 · response</div>
            <div className="st-label" id="st-rsp-label">—</div>
            <div className="st-sub" id="st-rsp-sub">—</div>
          </div>
        </div>
        <div className="grid" id="grid" />
        <div className="footbar">
          <span>
            requests routed this session <b id="cnt">0</b> · live simulation, not production traffic
          </span>
          <span className="auto-toggle on" id="auto"><span className="sw" /><span>auto-demo</span></span>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-h">Resilience</h3>
        <p className="sec-lead">
          A 429 sends a model to the penalty box with exponential backoff; the request retries onto another instantly.
          Daily quotas are persisted to disk, and real limits are learned from response headers.
        </p>
        <div className="res-layout">
          <div className="res-col">
            <div className="box">
              <div className="box-title">penalty box · exponential backoff</div>
              <div id="penalties" />
            </div>
            <div className="box">
              <div className="box-title">daily quota · rpd (persisted)</div>
              <div id="rpds" />
            </div>
          </div>
          <div className="box">
            <div className="box-title">event stream</div>
            <div className="log" id="log" />
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-h">The rest of the toolkit</h3>
        <div className="cap-grid">
          {CAPS.map((c) => (
            <div className="cap" key={c.k}>
              <div className="cap-kick">{c.k}</div>
              <div className="cap-title">{c.t}</div>
              <div className="cap-desc">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
