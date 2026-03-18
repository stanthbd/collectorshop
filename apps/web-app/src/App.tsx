import { useEffect } from 'react';
import { AppRouter } from './router/AppRouter';
import { initAuth } from './lib/auth';

function App() {
  useEffect(() => {
    // Check URL hash for implicit flow access_token and set it into memory
    initAuth();
  }, []);

  return <AppRouter />;
}

export default App;
