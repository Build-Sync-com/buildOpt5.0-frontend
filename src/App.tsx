import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import Loader from './components/common/Loader/Loader';

/**
 * App
 *
 * Boots the application: shows the BuildOpt 5.0 loading screen first, then
 * reveals the routed website once the app is ready.
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

  return <RouterProvider router={router} />;
}

export default App;
