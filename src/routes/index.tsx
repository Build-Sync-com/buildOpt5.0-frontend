import { createBrowserRouter } from 'react-router-dom';
import { websiteRoutes } from './websiteRoutes';
import { authRoutes } from './authRoutes';
import { webappRoutes } from './webappRoutes';

/**
 * Application router: the public website, the web app sign-in flow
 * (/signin) and the signed-in web app (/app).
 */
export const router = createBrowserRouter([websiteRoutes, authRoutes, webappRoutes]);
