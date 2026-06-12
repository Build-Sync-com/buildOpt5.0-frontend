/**
 * CapabilityMarquee
 *
 * Slim auto-scrolling strip listing platform capabilities, framed by thin
 * construction hazard stripes. Pauses on hover.
 */
const capabilities = [
  'Smart labor matching',
  'Material inventory & procurement',
  'Equipment telemetry & utilization',
  'Gantt timeline control',
  'Daily site logs',
  'Crew attendance & payroll',
  'Cost & budget tracking',
  'Safety & compliance checks',
];

function CapabilityMarquee() {
  // Content is rendered twice so the -50% translate loops seamlessly.
  const loop = [...capabilities, ...capabilities];

  return (
    <div className="border-y border-gray-100 bg-gray-50">
      <div className="hazard-stripe h-1.5" aria-hidden="true" />
      <div className="overflow-hidden py-4" aria-hidden="true">
        <ul className="animate-marquee flex w-max items-center gap-10">
          {loop.map((capability, i) => (
            <li
              key={`${capability}-${i}`}
              className="flex items-center gap-10 whitespace-nowrap text-sm font-medium text-gray-600"
            >
              {capability}
              <span className="h-1.5 w-1.5 rotate-45 bg-amber-400" />
            </li>
          ))}
        </ul>
      </div>
      <span className="sr-only">{capabilities.join(', ')}</span>
      <div className="hazard-stripe h-1.5" aria-hidden="true" />
    </div>
  );
}

export default CapabilityMarquee;
