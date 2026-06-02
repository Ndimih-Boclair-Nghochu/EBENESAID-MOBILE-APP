import type { UserType } from '@/src/types';

export type PortalRoute =
  | '/(student)'
  | '/(agent)'
  | '/(supplier)'
  | '/(job-partner)'
  | '/(transport)'
  | '/(university)'
  | '/(investor)'
  | '/(staff)'
  | '/(admin)';

export function getPortalRoute(userType: UserType): PortalRoute {
  switch (userType) {
    case 'student':
    case 'resident':
      return '/(student)';
    case 'agent':
      return '/(agent)';
    case 'supplier':
      return '/(supplier)';
    case 'job_partner':
      return '/(job-partner)';
    case 'transport':
      return '/(transport)';
    case 'university':
      return '/(university)';
    case 'investor':
      return '/(investor)';
    case 'staff':
      return '/(staff)';
    case 'admin':
      return '/(admin)';
    default:
      return '/(student)';
  }
}

