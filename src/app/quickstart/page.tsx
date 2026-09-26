import type { Metadata } from "next";
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { Reveal } from "@/components/site/reveal";
import { Spotlight } from "@/components/site/spotlight";
import { Box } from "@/components/ui/box";
import { CodeBlock } from "@/components/ui/code-block";
import { Fold } from "@/components/ui/fold";
import { GITHUB } from "@/lib/links";

export const metadata: Metadata = {
  title: "flexrouter quickstart",
  description: "Install flexrouter, open the dashboard, add a free provider and point your app at it.",
};

const INSTALL = "pip install git+https://github.com/notnotnotnoone/flexrouter";

const CURL = `curl http://localhost:4891/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model": "smart", "messages": [{"role": "user", "content": "hi"}]}'`;

const OPENAI_SDK = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:4891/v1",
    api_key="your app password from Settings",
)
reply = client.chat.completions.create(
    model="smart",  # a bucket name, not a model
    messages=[{"role": "user", "content": "hi"}],
)
print(reply.choices[0].message.content)`;

const YAML = `providers:
  groq:
    base_url: https://api.groq.com/openai/v1

buckets:
  smart:
    - provider: groq
      model: openai/gpt-oss-120b
      score: 85
      rpm: 30
      tpm: 8000
      context_window: 131072`;

const CLIENT = `from flexrouter import FlexRouter

router = FlexRouter()
reply = router.generate(
    messages=[{"role": "user", "content": "Summarise this in one line."}],
    tier="smart",
)
print(reply["choices"][0]["message"]["content"])`;

const STEPS = [
  {
    title: "Install",
    body: <p>Needs Python 3.11 or newer.</p>,
    code: <CodeBlock label="terminal" code={INSTALL} />,
  },
  {
    title: "Open the dashboard",
    body: <p>This starts flexrouter in the background and opens the dashboard in your browser. Leave it running.</p>,
    code: <CodeBlock label="terminal" code="flexrouter dashboard" />,
  },
  {
    title: "Add a free provider",
    body: (
      <p>
        On the Get started card, pick a provider marked free tier, follow its Get a key link, and paste the key. The step
        ticks itself when the key works. Add a second provider the same way: more providers means more free usage.
      </p>
    ),
  },
  {
    title: "Add models, then Test all",
    body: (
      <p>
        Press Add models with AI to find the models your keys can use and put them in buckets. Then press Test all: it
        says hi to every model once and shows which ones answer.
      </p>
    ),
  },
  {
    title: "Point your app at it",
    body: (
      <p>
        Anything that can talk to OpenAI&apos;s API works. Use <code>http://localhost:4891/v1</code> as the address and a
        bucket name, like <code>smart</code>, wherever it asks for a model.
      </p>
    ),
    code: (
      <div className="grid gap-3">
        <CodeBlock label="curl" code={CURL} />
        <CodeBlock label="python, OpenAI SDK" code={OPENAI_SDK} />
      </div>
    ),
  },
];

export default function Quickstart() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main wrap section">
        <Reveal>
          <h1 className="qs-title">
            <span className="slashes">{"//"}</span>Quickstart
          </h1>
          <p className="section-lead">About ten minutes. Everything after the install happens in the dashboard.</p>
        </Reveal>

        <ol className="qs-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.05}>
                <Box lift title={`${i + 1} · ${s.title}`}>
                  <div className="qs-body">
                    {s.body}
                    {s.code}
                  </div>
                </Box>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal>
          <div className="qs-more">
            <Fold summary="Prefer editing the settings file by hand?">
              <p>
                Run <code>flexrouter doctor</code> to see where your settings file is. flexrouter reads it but never
                rewrites it, and your keys never go in it (save them with <code>flexrouter keys add groq</code>).
              </p>
              <CodeBlock label="config.yaml" code={YAML} />
            </Fold>
            <Fold summary="Calling it from Python without the web address">
              <p>For Python code that would rather call flexrouter directly. It uses the same settings.</p>
              <CodeBlock label="python" code={CLIENT} />
            </Fold>
            <p className="text-ink-3">
              The full guides are in the{" "}
              <a className="text-green underline-offset-4 hover:underline" href={`${GITHUB}/tree/master/docs`}>
                flexrouter repository
              </a>
              .
            </p>
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
