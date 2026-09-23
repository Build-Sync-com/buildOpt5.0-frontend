import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../common/Icon/Icon';
import { useAuth } from '../../../../context/auth/useAuth';
import type { UserRole } from '../../../../types/auth';

/**
 * SignInForm
 *
 * Username + password for the selected role. Validates inline, warns when
 * Caps Lock is on, and on success opens the web app dashboard. Password resets
 * happen in the admin portal, so "Forgot password?" explains that instead of
 * linking to a reset flow.
 */
type FieldErrors = {
  username?: string;
  password?: string;
};

const labelClass = 'block text-sm font-medium text-gray-700';
const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400 aria-invalid:focus:ring-red-500/20';
const fieldIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400';

type SignInFormProps = {
  role: UserRole;
};

function SignInForm({ role }: SignInFormProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trackCapsLock = (e: KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState('CapsLock'));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {
      username: username.trim() ? undefined : 'Enter your username.',
      password: password ? undefined : 'Enter your password.',
    };
    setErrors(nextErrors);
    setFormError('');
    if (nextErrors.username || nextErrors.password) return;

    setSubmitting(true);
    try {
      await signIn({ roleId: role.id, username, password, remember });
      navigate('/app', { replace: true });
    } catch {
      setFormError('We couldn’t sign you in. Check your details and try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      {/* Username */}
      <div>
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <div className="relative mt-1.5">
          <Icon name="user" className={fieldIconClass} />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            placeholder="Enter your username"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'username-error' : undefined}
            className={`${inputClass} pr-3.5 pl-10`}
          />
        </div>
        {errors.username && (
          <p id="username-error" className="mt-1.5 text-xs text-red-600">
            {errors.username}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowResetHelp((prev) => !prev)}
            aria-expanded={showResetHelp}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative mt-1.5">
          <Icon name="lock" className={fieldIconClass} />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            onKeyDown={trackCapsLock}
            onKeyUp={trackCapsLock}
            onBlur={() => setCapsLock(false)}
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`${inputClass} pr-11 pl-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-4 w-4" />
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-red-600">
            {errors.password}
          </p>
        )}
        {capsLock && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
            <Icon name="info" className="h-3.5 w-3.5" />
            Caps Lock is on
          </p>
        )}
      </div>

      {showResetHelp && (
        <div className="mt-4 flex gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3.5 text-sm text-gray-600">
          <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p>
            Passwords are reset by your company's BuildOpt administrator. Contact
            them to get a new one.
          </p>
        </div>
      )}

      <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
        />
        Keep me signed in
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
      >
        {submitting && (
          <Icon name="loader" className="h-4 w-4 animate-spin" strokeWidth={2.2} />
        )}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default SignInForm;
