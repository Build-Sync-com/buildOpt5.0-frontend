import DashboardHeader from '../../../components/webapp/dashboard/DashboardHeader/DashboardHeader';
import SiteSnapshot from '../../../components/webapp/dashboard/SiteSnapshot/SiteSnapshot';
import WorkspaceModules from '../../../components/webapp/dashboard/WorkspaceModules/WorkspaceModules';
import { useAuth } from '../../../context/auth/useAuth';

/**
 * Dashboard — web app home after sign-in.
 *
 * Kept simple for now: greeting, a site snapshot and the signed-in role's
 * workspace areas (see components/webapp/dashboard).
 */
function Dashboard() {
  const { session } = useAuth();

  // RequireAuth guarantees a session; this just narrows the type.
  if (!session) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <DashboardHeader session={session} />
      <SiteSnapshot />
      <WorkspaceModules role={session.role} />
    </div>
  );
}

export default Dashboard;
