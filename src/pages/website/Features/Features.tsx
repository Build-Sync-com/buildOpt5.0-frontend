import FeaturesHero from '../../../components/website/features/FeaturesHero/FeaturesHero';
import CoreFeaturesSection from '../../../components/website/features/CoreFeaturesSection/CoreFeaturesSection';
import PlatformGridSection from '../../../components/website/features/PlatformGridSection/PlatformGridSection';
import IntegrationSection from '../../../components/website/features/IntegrationSection/IntegrationSection';
import CtaSection from '../../../components/website/home/CtaSection/CtaSection';

/**
 * Features page — public website.
 *
 * Composed of standalone sections (see components/website/features), reusing
 * the site's construction-blueprint language: intro with a drawing legend →
 * per-module deep dive with schematic "screens" → cross-platform capability
 * cards → connected-data wiring diagram → closing CTA (shared with the home
 * page).
 */
function Features() {
  return (
    <>
      <FeaturesHero />
      <CoreFeaturesSection />
      <PlatformGridSection />
      <IntegrationSection />
      <CtaSection />
    </>
  );
}

export default Features;
