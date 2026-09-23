import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import Loader from './components/common/Loader/Loader';
import AuthProvider from './context/auth/AuthProvider';

/**
 * App
 *
 * Boots the application: shows the BuildOpt 5.0 loading screen first, then
 * reveals the routed website and web app, with the auth session available to
 * every route.
 */
function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
