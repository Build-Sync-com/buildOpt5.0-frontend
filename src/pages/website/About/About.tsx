import AboutHero from '../../../components/website/about/AboutHero/AboutHero';
import MissionSection from '../../../components/website/about/MissionSection/MissionSection';
import ValuesSection from '../../../components/website/about/ValuesSection/ValuesSection';
import JourneySection from '../../../components/website/about/JourneySection/JourneySection';
import CtaSection from '../../../components/website/home/CtaSection/CtaSection';

/**
 * About Us page — public website.
 *
 * Composed of standalone sections (see components/website/about), reusing the
 * site's construction-blueprint language: intro with a drawing title block →
 * mission / status-quo panel → principle cards → milestone timeline → closing
 * CTA (shared with the home page).
 */
function About() {
  return (
    <>
      <AboutHero />
      <MissionSection />
      <ValuesSection />
      <JourneySection />
      <CtaSection />
    </>
  );
}

export default About;
