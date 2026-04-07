'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

export default function Providers({ children }) {
  const init = useAuthStore((s) => s.init);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await init();
      await fetchCart();
      setReady(true);
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#0f172a', color: '#f8fafc', borderRadius: '10px', fontSize: '14px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
