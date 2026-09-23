import { Link } from 'react-router-dom';
import Icon from '../../../common/Icon/Icon';
import type { UserRole } from '../../../../types/auth';

/**
 * RoleCard
 *
 * One selectable role on the role picker, treated like an object on a drawing:
 * on hover/focus it picks up a dashed CAD-style selection box with grips at
 * the corners and its icon tile fills blue. Clicking goes straight to the
 * credentials step for that role. On phones it collapses to a compact row so
 * all eleven roles fit without endless scrolling.
 */
const grips = [
  '-left-[3.5px] -top-[3.5px]',
  '-right-[3.5px] -top-[3.5px]',
  '-left-[3.5px] -bottom-[3.5px]',
  '-right-[3.5px] -bottom-[3.5px]',
];

type RoleCardProps = {
  role: UserRole;
};

function RoleCard({ role }: RoleCardProps) {
  return (
    <Link
      to={`/signin/${role.id}`}
      className="group relative flex h-full items-center gap-4 rounded-2xl border border-gray-200 bg-white/90 p-4 backdrop-blur-sm transition-colors hover:border-blue-300 focus-visible:border-blue-300 focus-visible:outline-none sm:flex-col sm:items-stretch sm:gap-0 sm:p-5"
    >
      {/* CAD selection box + corner grips */}
      <span
        className="pointer-events-none absolute -inset-1.5 border border-dashed border-blue-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        aria-hidden="true"
      >
        {grips.map((position) => (
          <span
            key={position}
            className={`absolute h-1.5 w-1.5 bg-blue-600 ${position}`}
          />
        ))}
      </span>

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white group-focus-visible:bg-blue-600 group-focus-visible:text-white">
        <Icon name={role.icon} />
      </span>

      <div className="min-w-0 flex-1 sm:flex-none">
        <h3 className="font-semibold leading-snug text-gray-900 sm:mt-4">
          {role.title}
        </h3>
        {role.qualifier && (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-600">
            {role.qualifier}
          </p>
        )}
      </div>

      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gray-400 transition-colors group-hover:text-blue-600 group-focus-visible:text-blue-600 sm:mt-auto sm:pt-4">
        <span className="hidden sm:inline">Continue</span>
        <Icon
          name="arrowRight"
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

export default RoleCard;
