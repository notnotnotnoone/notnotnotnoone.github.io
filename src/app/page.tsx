import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { Reveal } from "@/components/site/reveal";
import { SectionTitle } from "@/components/site/section-title";
import { Spotlight } from "@/components/site/spotlight";

export default function Home() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main">
        <section className="wrap section">
          <Reveal>
            <SectionTitle>Redesign in progress</SectionTitle>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
