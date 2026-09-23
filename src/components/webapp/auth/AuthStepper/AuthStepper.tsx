import Icon from '../../../common/Icon/Icon';

/**
 * AuthStepper
 *
 * Two-step progress marker for the sign-in flow (role → credentials): numbered
 * nodes joined by a thin line.
 */
const steps = ['Select role', 'Sign in'];

type AuthStepperProps = {
  current: 1 | 2;
};

function AuthStepper({ current }: AuthStepperProps) {
  return (
    <ol className="flex items-center gap-3 text-xs font-medium">
      {steps.map((label, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;

        return (
          <li
            key={label}
            className="flex items-center gap-3"
            aria-current={active ? 'step' : undefined}
          >
            {index > 0 && (
              <span
                className={`h-px w-8 sm:w-14 ${active || done ? 'bg-blue-600' : 'bg-gray-300'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                  : done
                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {done ? (
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                step
              )}
            </span>
            <span className={active ? 'text-gray-900' : 'text-gray-400'}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default AuthStepper;
