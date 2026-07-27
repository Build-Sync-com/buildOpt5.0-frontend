import { useState } from 'react';

/**
 * FaqSection
 *
 * Common pre-sales questions as an accordion of numbered "drawing sheet" rows
 * (QN-01 … QN-05). One panel open at a time; the first is open by default.
 */
const faqs = [
  {
    code: 'QN-01',
    question: 'Do we need to change how our site already works?',
    answer:
      "No. BuildOpt is built around the way construction actually runs — phases, crews, stores and machines. We map it to your existing process during the walkthrough rather than forcing a new one on you.",
  },
  {
    code: 'QN-02',
    question: 'Can the team use it from the field, not just the office?',
    answer:
      'Yes. Attendance, stock and daily progress can be logged from a phone on site, and everything syncs back the moment a signal returns — so head office sees the same picture as the foreman.',
  },
  {
    code: 'QN-03',
    question: 'How long does it take to get started?',
    answer:
      'Most teams are running a first site within a week. We help import your workforce, materials and program so you start with real data, not an empty system.',
  },
  {
    code: 'QN-04',
    question: 'Who can see what? We have sensitive cost data.',
    answer:
      'Roles and permissions are granular. Foremen, store keepers, QS and directors each see exactly what they need — cost and commercial data stays with the people you choose.',
  },
  {
    code: 'QN-05',
    question: 'Is our data safe and exportable?',
    answer:
      "Your data is yours. Every change is audit-stamped, and you can export reports, cost statements and records to PDF or Excel whenever you want — no lock-in.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · BEFORE YOU ASK
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Questions we hear a lot
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Still unsure about something? Put it in the form above — we're happy
            to get into the detail.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div
                key={faq.code}
                className={`overflow-hidden rounded-2xl border bg-white transition ${
                  isOpen ? 'border-blue-300 shadow-lg shadow-blue-900/5' : 'border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <span className="font-mono text-xs tracking-widest text-amber-600">
                    {faq.code}
                  </span>
                  <span className="flex-1 font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition ${
                      isOpen ? 'rotate-45 border-blue-300 bg-blue-50 text-blue-600' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-[4.25rem] text-gray-600 sm:px-6 sm:pl-[4.75rem]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
