import { BuiltWith } from "@/components/site/built-with";
import { DashboardTour } from "@/components/site/dashboard-tour";
import { Footer } from "@/components/site/footer";
import { HowItWorks } from "@/components/site/how-it-works";
import { Nav } from "@/components/site/nav";
import { PlainWords } from "@/components/site/plain-words";
import { Spotlight } from "@/components/site/spotlight";
import { Story } from "@/components/story/Story";
import { Hero } from "@/components/ui/animated-hero";

export default function Home() {
  return (
    <>
      <Spotlight />
      <Nav />
      <main className="site-main">
        <Hero />
        <PlainWords />
        <Story />
        <DashboardTour />
        <HowItWorks />
        <BuiltWith />
      </main>
      <Footer />
    </>
  );
}
