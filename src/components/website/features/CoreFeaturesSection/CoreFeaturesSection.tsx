/**
 * CoreFeaturesSection
 *
 * The heart of the Features page: each of the four BuildOpt modules gets a
 * full-width, alternating row (copy + a schematic "screen" built in CSS, not a
 * stock image) so the page shows the product rather than just describing it.
 */
import type { ReactNode } from 'react';

/* ---- Small schematic panels (one per module) --------------------------- */

/** Reusable chrome so every schematic reads like the same product. */
function ScreenFrame({
  tag,
  status,
  children,
}: {
  tag: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className="absolute -inset-6 rounded-3xl bg-blueprint-grid opacity-60"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-blue-900/5">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <span className="font-mono text-xs tracking-widest text-gray-400">
            {tag}
          </span>
          <span className="flex items-center gap-2 font-mono text-xs tracking-widest text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {status}
          </span>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const crew = [
  { name: 'M. Silva', role: 'Foreman', match: 96, tone: 'bg-blue-600' },
  { name: 'R. Perera', role: 'Steel fixer', match: 88, tone: 'bg-blue-500' },
  { name: 'T. Khan', role: 'Mason', match: 81, tone: 'bg-blue-400' },
];

function LaborScreen() {
  return (
    <ScreenFrame tag="ASSIGN CREW · FOUNDATION POUR" status="MATCHING">
      <ul className="space-y-3">
        {crew.map((c) => (
          <li
            key={c.name}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {c.name.split(' ')[1].slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {c.name}
              </p>
              <p className="text-xs text-gray-500">{c.role}</p>
            </div>
            <div className="w-24">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-400">
                  MATCH
                </span>
                <span className="font-mono text-xs font-bold text-blue-600">
                  {c.match}%
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${c.tone}`}
                  style={{ width: `${c.match}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScreenFrame>
  );
}

const stock = [
  { item: 'Cement (50kg)', level: 64, low: false },
  { item: 'Rebar 12mm', level: 22, low: true },
  { item: 'Aggregate', level: 88, low: false },
  { item: 'Formwork ply', level: 47, low: false },
];

function MaterialScreen() {
  return (
    <ScreenFrame tag="STORE 01 · LIVE STOCK" status="IN SYNC">
      <ul className="space-y-3.5">
        {stock.map((s) => (
          <li key={s.item}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">
                {s.item}
              </span>
              {s.low ? (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide text-amber-700">
                  LOW · REORDER
                </span>
              ) : (
                <span className="font-mono text-xs text-gray-400">
                  {s.level}%
                </span>
              )}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full ${
                  s.low ? 'bg-amber-400' : 'bg-blue-500'
                }`}
                style={{ width: `${s.level}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </ScreenFrame>
  );
}

const fleet = [
  { id: 'TC-1', name: 'Tower crane', state: 'Active', util: 74, active: true },
  { id: 'EX-3', name: 'Excavator', state: 'Idle', util: 12, active: false },
  { id: 'MX-2', name: 'Concrete mixer', state: 'Active', util: 91, active: true },
];

function EquipmentScreen() {
  return (
    <ScreenFrame tag="FLEET STATUS · SITE A" status="TRACKING">
      <ul className="space-y-3">
        {fleet.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3"
          >
            <span className="font-mono text-xs font-bold tracking-widest text-gray-500">
              {f.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {f.name}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    f.active ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
                {f.state}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-mono text-sm font-bold ${
                  f.active ? 'text-blue-600' : 'text-amber-600'
                }`}
              >
                {f.util}%
              </p>
              <p className="font-mono text-[10px] text-gray-400">UTIL</p>
            </div>
          </li>
        ))}
      </ul>
    </ScreenFrame>
  );
}

const program = [
  { label: 'Substructure', offset: 0, width: 34, tone: 'bg-blue-300' },
  { label: 'Superstructure', offset: 24, width: 46, tone: 'bg-blue-500' },
  { label: 'MEP first fix', offset: 52, width: 30, tone: 'bg-blue-700' },
  { label: 'Finishes', offset: 74, width: 26, tone: 'bg-amber-400' },
];

function TimelineScreen() {
  return (
    <ScreenFrame tag="PROGRAM · BLOCK B" status="ON TRACK">
      <div className="mb-3 flex justify-between font-mono text-[10px] text-gray-400">
        {['W1', 'W4', 'W7', 'W10', 'W13'].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <ul className="space-y-3">
        {program.map((p) => (
          <li key={p.label}>
            <span className="text-xs font-medium text-gray-700">{p.label}</span>
            <div className="mt-1 h-3 w-full">
              <div
                className={`h-full rounded-full ${p.tone}`}
                style={{ marginLeft: `${p.offset}%`, width: `${p.width}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        <span className="h-1.5 w-1.5 rotate-45 bg-amber-400" />
        Delay on MEP first fix shifts Finishes by 3 days — flagged automatically.
      </p>
    </ScreenFrame>
  );
}

/* ---- Section data ------------------------------------------------------ */

type Feature = {
  code: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  screen: ReactNode;
};

const features: Feature[] = [
  {
    code: 'FEAT-01',
    eyebrow: '· LABOR & CREWS',
    title: 'Put the right people on every task',
    description:
      'A living roster of every worker — their skills, certifications, attendance and rate — so assigning a crew takes seconds and never breaks a compliance rule.',
    points: [
      'Skill & certification registry with expiry alerts',
      'SmartMatch ranks your workforce against each task',
      'Attendance, shifts and overtime captured per site',
      'Payroll-ready hours, no double entry',
    ],
    screen: <LaborScreen />,
  },
  {
    code: 'FEAT-02',
    eyebrow: '· MATERIALS & STOCK',
    title: 'Know what you have before you run out',
    description:
      'Track every material from purchase order to pour. Live stock levels across stores, automatic low-stock alerts and wastage analysis keep the budget honest.',
    points: [
      'Live inventory across multiple stores & sites',
      'Auto reorder points and low-stock alerts',
      'Procurement, supplier history and pricing',
      'Wastage and consumption analytics per phase',
    ],
    screen: <MaterialScreen />,
  },
  {
    code: 'FEAT-03',
    eyebrow: '· EQUIPMENT & MACHINES',
    title: 'Stop paying for idle iron',
    description:
      'See where every crane, mixer and excavator is, who is operating it and when it sits idle — so utilization goes up and surprise breakdowns go down.',
    points: [
      'Live utilization and idle-time alerts',
      'Preventive maintenance scheduling & logs',
      'Operator assignment with certification checks',
      'Hire vs. own cost tracking per machine',
    ],
    screen: <EquipmentScreen />,
  },
  {
    code: 'FEAT-04',
    eyebrow: '· PROCESS & TIMELINE',
    title: 'Watch delays before they spread',
    description:
      'Plan phases on an interactive Gantt, link dependencies and see a slip in one place ripple through the whole program the moment it happens.',
    points: [
      'Interactive Gantt with linked dependencies',
      'Milestones, critical path and delay alerts',
      'Daily progress logs from the field',
      'Resources synced to the program automatically',
    ],
    screen: <TimelineScreen />,
  },
];

function CoreFeaturesSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs tracking-widest text-blue-600">
            · MODULE BREAKDOWN
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Four modules, explored in detail
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Each module is powerful on its own — but the real gain is that they
            share one set of data. A worker, a machine or a delay updates
            everywhere at once.
          </p>
        </div>

        <div className="mt-16 space-y-20 lg:space-y-28">
          {features.map((feature, index) => (
            <div
              key={feature.code}
              className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
            >
              {/* Copy */}
              <div className={index % 2 === 1 ? 'lg:order-last' : ''}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-widest text-blue-600">
                    {feature.eyebrow}
                  </span>
                  <span className="font-mono text-xs tracking-widest text-gray-300">
                    {feature.code}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-4 text-lg text-gray-600">
                  {feature.description}
                </p>

                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-sm text-gray-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-amber-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Schematic screen */}
              {feature.screen}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CoreFeaturesSection;
