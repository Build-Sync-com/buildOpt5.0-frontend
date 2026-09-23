import { Link, Navigate, useParams } from 'react-router-dom';
import Icon from '../../../../components/common/Icon/Icon';
import SignInForm from '../../../../components/webapp/auth/SignInForm/SignInForm';
import { getParty, getRoleById } from '../../../../constants/userRoles';

/**
 * SignIn — sign-in step 2.
 *
 * A single centered card: the role picked in step 1 (taken from the URL, so
 * /signin/project-manager can be bookmarked) with a way to change it, then the
 * username/password form. Unknown roles go back to the role picker.
 */
function SignIn() {
  const { roleId } = useParams();
  const role = roleId ? getRoleById(roleId) : undefined;

  if (!role) {
    return <Navigate to="/signin" replace />;
  }

  const party = getParty(role.party);

  return (
    <div className="flex justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-blue-900/5 sm:px-10 sm:py-9">
          {/* Selected role */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Icon name={role.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-semibold text-gray-900">
                {role.title}
                {role.qualifier && (
                  <span className="font-normal text-gray-500"> · {role.qualifier}</span>
                )}
              </p>
              <p className="truncate text-xs text-gray-500">{party.label}</p>
            </div>
            <Link
              to="/signin"
              className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
            >
              Change
            </Link>
          </div>

          <h1 className="mt-7 text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Enter the username and password issued by your company admin.
          </p>

          <div className="mt-7">
            <SignInForm key={role.id} role={role} />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? Contact your company admin.
        </p>
      </div>
    </div>
  );
}

export default SignIn;
