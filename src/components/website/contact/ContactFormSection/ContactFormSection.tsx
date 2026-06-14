import { useState } from 'react';
import type { FormEvent } from 'react';

/**
 * ContactFormSection
 *
 * The page's centerpiece: a "request a walkthrough" form styled as a site
 * work-order, paired with a sidebar that sets expectations (what happens next,
 * response time, office hours). The form is controlled and, on submit, swaps to
 * a logged-request confirmation — there is no backend yet, so it stays
 * client-side.
 */
type FormState = {
  name: string;
  email: string;
  company: string;
  role: string;
  sites: string;
  message: string;
};

const empty: FormState = {
  name: '',
  email: '',
  company: '',
  role: '',
  sites: '',
  message: '',
};

const roles = [
  'Project / site engineer',
  'Project manager',
  'Quantity surveyor',
  'Director / owner',
  'Other',
];

const sizes = ['1 site', '2–5 sites', '6–15 sites', '15+ sites'];

const nextSteps = [
  {
    code: 'STEP 01',
    title: 'We read your request',
    description: 'A real engineer reviews your project — not an auto-responder.',
  },
  {
    code: 'STEP 02',
    title: 'We map it to BuildOpt',
    description: 'We line up the modules that fit how your team already works.',
  },
  {
    code: 'STEP 03',
    title: 'Walkthrough booked',
    description: 'A 30-minute demo on your schedule, tuned to your sites.',
  },
];

const inputClass =
  'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'font-mono text-xs tracking-widest text-gray-500';

function ContactFormSection() {
  const [form, setForm] = useState<FormState>(empty);
  const [submitted, setSubmitted] = useState(false);

  const update =
    (field: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // No backend yet — acknowledge locally so the form is usable end to end.
    setSubmitted(true);
  };

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:px-8">
        {/* Form / confirmation */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-900/5">
          <div className="hazard-stripe h-1.5" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sm:px-8">
            <span className="font-mono text-xs tracking-widest text-gray-400">
              REQUEST FORM · WO-0001
            </span>
            <span className="flex items-center gap-2 font-mono text-xs tracking-widest text-blue-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {submitted ? 'LOGGED' : 'DRAFT'}
            </span>
          </div>

          {submitted ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h3 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
                Request logged, {form.name.split(' ')[0] || 'thanks'}!
              </h3>
              <p className="mx-auto mt-3 max-w-md text-gray-600">
                We've got your details and will be in touch at{' '}
                <span className="font-semibold text-gray-900">
                  {form.email || 'your email'}
                </span>{' '}
                within one business day to set up your walkthrough.
              </p>
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setSubmitted(false);
                }}
                className="mt-8 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                ← Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-6 py-7 sm:px-8 sm:py-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    FULL NAME
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Enter your name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>
                    WORK EMAIL
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    placeholder="Enter your email"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="company" className={labelClass}>
                    COMPANY
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={form.company}
                    onChange={update('company')}
                    placeholder="Enter your company name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="role" className={labelClass}>
                    YOUR ROLE
                  </label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={update('role')}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className={labelClass}>HOW MANY SITES?</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const active = form.sites === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, sites: size }))}
                        className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                          active
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="message" className={labelClass}>
                  TELL US ABOUT YOUR PROJECT
                </label>
                <textarea
                  id="message"
                  rows={4}
                  required
                  value={form.message}
                  onChange={update('message')}
                  placeholder="What are you managing today, and where does it hurt? Labor, materials, machines, scheduling…"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-blue-700/25 sm:w-auto"
              >
                Send request
              </button>
              <p className="mt-3 font-mono text-xs tracking-wide text-gray-400">
                · NO SPAM · WE NEVER SHARE YOUR DETAILS
              </p>
            </form>
          )}
        </div>

        {/* Sidebar: what happens next */}
        <div>
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · WHAT HAPPENS NEXT
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            From request to walkthrough
          </h2>

          <ol className="mt-8 space-y-7">
            {nextSteps.map((step, index) => (
              <li key={step.code} className="relative flex gap-4">
                {/* Connector line */}
                {index < nextSteps.length - 1 && (
                  <span
                    className="absolute left-4 top-9 h-[calc(100%+0.5rem)] w-px bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-mono text-xs font-bold text-blue-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-gray-400">
                    {step.code}
                  </p>
                  <p className="mt-0.5 font-semibold text-gray-900">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Response SLA card */}
          <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              TYPICAL RESPONSE
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-blue-700">
              &lt; 1 business day
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Reach us Mon–Fri, 8.00–18.00 (GMT+5:30).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactFormSection;
