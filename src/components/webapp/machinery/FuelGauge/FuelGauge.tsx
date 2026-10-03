import { fuelLevels } from '../../../../constants/machinery';
import type { FuelLevel } from '../../../../types/machinery';

/**
 * FuelGauge / FuelPicker
 *
 * Fuel in the tank as four quarter cells, the way it's read off the dash.
 * The picker is the same gauge as a row of radio buttons, Empty to Full.
 */
export function FuelGauge({ level }: { level: FuelLevel }) {
  const label = fuelLevels.find((f) => f.id === level)?.label ?? '';
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Fuel ${label}`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((cell) => (
          <span
            key={cell}
            className={`h-3 w-2 rounded-[2px] ${cell <= level ? 'bg-amber-400' : 'bg-gray-200'}`}
          />
        ))}
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </span>
  );
}

type FuelPickerProps = {
  name: string;
  value: FuelLevel;
  onChange: (level: FuelLevel) => void;
};

export function FuelPicker({ name, value, onChange }: FuelPickerProps) {
  return (
    <div role="radiogroup" className="flex gap-1">
      {fuelLevels.map((level) => {
        const selected = value === level.id;
        return (
          <label
            key={level.id}
            className={`flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-xs transition-colors has-focus-visible:ring-2 has-focus-visible:ring-blue-500/30 ${
              selected
                ? 'border-amber-400 bg-amber-50 font-semibold text-gray-900'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={level.id}
              checked={selected}
              onChange={() => onChange(level.id)}
              className="sr-only"
            />
            <span className="flex gap-px" aria-hidden="true">
              {[1, 2, 3, 4].map((cell) => (
                <span
                  key={cell}
                  className={`h-2 w-1 rounded-[1px] ${cell <= level.id ? 'bg-amber-400' : 'bg-gray-200'}`}
                />
              ))}
            </span>
            {level.label}
          </label>
        );
      })}
    </div>
  );
}
