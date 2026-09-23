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
        <h2 className="font-mono text-xs tracking-widest text-blue-600">
          · YOUR WORKSPACE
        </h2>
        <span
          className="h-px flex-1 border-t border-dashed border-gray-300"
          aria-hidden="true"
        />
        <span className="font-mono text-[11px] tracking-widest text-gray-400">
          {role.title.toUpperCase()}
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {role.workspace.map((item, index) => (
          <div
            key={item}
            className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5"
          >
            <span className="font-mono text-[11px] tracking-widest text-gray-400">
              WS-{String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-2 font-semibold text-gray-900">{item}</h3>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              IN DRAFTING
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WorkspaceModules;
