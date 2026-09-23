import AuthStepper from '../../../../components/webapp/auth/AuthStepper/AuthStepper';
import RoleCard from '../../../../components/webapp/auth/RoleCard/RoleCard';
import RoleGroup from '../../../../components/webapp/auth/RoleGroup/RoleGroup';
import Icon from '../../../../components/common/Icon/Icon';
import { getParty, getRolesByParty } from '../../../../constants/userRoles';
import type { RoleParty } from '../../../../types/auth';

/**
 * RoleSelect — sign-in step 1.
 *
 * The user picks the role they hold on the project; each card continues to the
 * credentials step for that role. Contractor roles fill the first band, then
 * consultant and client share a row with a note on how accounts are issued.
 */
function countLabel(count: number) {
  return `${count} ${count === 1 ? 'role' : 'roles'}`;
}

function PartyGroup({
  party,
  gridClassName,
  className,
}: {
  party: RoleParty;
  gridClassName?: string;
  className?: string;
}) {
  const info = getParty(party);
  const roles = getRolesByParty(party);

  return (
    <RoleGroup
      label={info.label}
      meta={countLabel(roles.length)}
      gridClassName={gridClassName}
      className={className}
    >
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} />
      ))}
    </RoleGroup>
  );
}

function RoleSelect() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <AuthStepper current={1} />

      <div className="mt-6 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Choose your{' '}
          <span className="relative whitespace-nowrap">
            <span className="absolute -inset-x-1 inset-y-1 -skew-y-1 rounded bg-amber-200/70" />
            <span className="relative">role on site</span>
          </span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-600">
          BuildOpt sets up your workspace, tools and permissions around the role
          you hold on this project.
        </p>
      </div>

      <PartyGroup
        party="contractor"
        className="mt-12"
        gridClassName="sm:grid-cols-2 lg:grid-cols-4"
      />

      <div className="mt-12 grid gap-12 lg:grid-cols-4 lg:gap-4">
        <PartyGroup
          party="consultant"
          className="lg:col-span-2"
          gridClassName="sm:grid-cols-2"
        />
        <PartyGroup party="client" />

        {/* No self sign-up: accounts come from the admin portal */}
        <RoleGroup label="No account yet?">
          <div className="flex h-full flex-col rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Icon name="info" />
            </span>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Your company admin creates accounts and assigns roles in the
              BuildOpt admin portal.
            </p>
          </div>
        </RoleGroup>
      </div>
    </div>
  );
}

export default RoleSelect;
