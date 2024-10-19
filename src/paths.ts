export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/event-studio/events',
    account: '/event-studio/events/dashboard/account',
    customers: '/event-studio/events/dashboard/transactions',
    integrations: '/event-studio/events/dashboard/configuration',
    settings: '/event-studio/events/dashboard/settings',
  },
  errors: { notFound: '/errors/not-found' },
} as const;
