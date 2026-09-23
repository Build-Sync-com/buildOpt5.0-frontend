import { useState } from 'react';
import type { Session } from '../../../../types/auth';

/**
 * DashboardHeader
 *
 * Greeting for the signed-in user with their role and today's date.
 */
function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type DashboardHeaderProps = {
  session: Session;
};

function DashboardHeader({ session }: DashboardHeaderProps) {
  const [now] = useState(() => new Date());
  const { role, username } = session;

  const date = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-600">Dashboard</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {greetingFor(now.getHours())}, {username}
        </h1>
        <p className="mt-1 text-gray-500">
          {role.title}
          {role.qualifier ? ` (${role.qualifier})` : ''} workspace — here's
          where things stand today.
        </p>
      </div>
      <p className="text-sm text-gray-400">{date}</p>
    </div>
  );
}

export default DashboardHeader;
