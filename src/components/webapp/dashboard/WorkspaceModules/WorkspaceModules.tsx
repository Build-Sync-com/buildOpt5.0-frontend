import type { UserRole } from '../../../../types/auth';

/**
 * WorkspaceModules
 *
 * The areas of BuildOpt the signed-in role works in, drawn as dashed
 * "in drafting" sheets until each module is built.
 */
type WorkspaceModulesProps = {
  role: UserRole;
};

function WorkspaceModules({ role }: WorkspaceModulesProps) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-blue-600">Your workspace</h2>
        <span
          className="h-px flex-1 border-t border-dashed border-gray-300"
          aria-hidden="true"
        />
        <span className="text-xs text-gray-400">{role.title}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {role.workspace.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5"
          >
            <h3 className="font-semibold text-gray-900">{item}</h3>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              In drafting
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WorkspaceModules;
