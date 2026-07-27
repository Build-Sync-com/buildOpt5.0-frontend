import type { RouteObject } from 'react-router-dom';
import WebsiteLayout from '../layouts/WebsiteLayout/WebsiteLayout';
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary';
import Home from '../pages/website/Home/Home';
import About from '../pages/website/About/About';
import Features from '../pages/website/Features/Features';
import Contact from '../pages/website/Contact/Contact';
import NotFound from '../pages/website/NotFound/NotFound';

/**
 * Public marketing website routes, all nested under the shared WebsiteLayout
 * (navbar + footer). The trailing `*` route renders a styled 404 for any
 * unmatched URL, while `errorElement` catches unexpected thrown errors.
 */
export const websiteRoutes: RouteObject = {
  path: '/',
  element: <WebsiteLayout />,
  errorElement: <ErrorBoundary />,
  children: [
    { index: true, element: <Home /> },
    { path: 'about', element: <About /> },
    { path: 'features', element: <Features /> },
    { path: 'contact', element: <Contact /> },
    { path: '*', element: <NotFound /> },
  ],
};
