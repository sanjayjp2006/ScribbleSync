import type { CorsOptions } from 'cors';

import type { Environment } from './environment.js';

export const createCorsOptions = (environmentConfig: Environment): CorsOptions => ({
  origin: environmentConfig.CLIENT_ORIGIN,
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS']
});
