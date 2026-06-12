import { createBrowserRouter } from 'react-router-dom';
import { websiteRoutes } from './websiteRoutes';

/**
 * Application router. The public website routes live here today; app/dashboard
 * routes will be added alongside them as the platform grows.
 */
export const router = createBrowserRouter([websiteRoutes]);
