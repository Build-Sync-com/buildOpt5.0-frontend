import HeroSection from '../../../components/website/home/HeroSection/HeroSection';
import CapabilityMarquee from '../../../components/website/home/CapabilityMarquee/CapabilityMarquee';
import ModulesSection from '../../../components/website/home/ModulesSection/ModulesSection';
import SmartMatchSection from '../../../components/website/home/SmartMatchSection/SmartMatchSection';
import TimelineSection from '../../../components/website/home/TimelineSection/TimelineSection';
import CtaSection from '../../../components/website/home/CtaSection/CtaSection';

/**
 * Home (landing) page — public website.
 *
 * Composed of standalone sections (see components/website/home):
 * hero → capability marquee → core modules → smart matching spotlight →
 * Gantt-style workflow → closing CTA.
 */
function Home() {
  return (
    <>
      <HeroSection />
      <CapabilityMarquee />
      <ModulesSection />
      <SmartMatchSection />
      <TimelineSection />
      <CtaSection />
    </>
  );
}

export default Home;
