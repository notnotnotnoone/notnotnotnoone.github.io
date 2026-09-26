import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { PlainWords } from "@/components/site/plain-words";
import { Spotlight } from "@/components/site/spotlight";
import { Hero } from "@/components/ui/animated-hero";

export default function Home() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main">
        <Hero />
        <PlainWords />
      </main>
      <Footer />
    </>
  );
}
