import ContactHero from '../../../components/website/contact/ContactHero/ContactHero';
import ContactFormSection from '../../../components/website/contact/ContactFormSection/ContactFormSection';
import FaqSection from '../../../components/website/contact/FaqSection/FaqSection';

/**
 * Contact Us page — public website.
 *
 * Composed of standalone sections (see components/website/contact), reusing the
 * site's construction-blueprint language: intro with quick contact channels →
 * a work-order styled request form with a "what happens next" sidebar →
 * frequently asked questions.
 */
function Contact() {
  return (
    <>
      <ContactHero />
      <ContactFormSection />
      <FaqSection />
    </>
  );
}

export default Contact;
