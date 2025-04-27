
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface TestWrapperProps {
  children: ReactNode;
}

export function TestWrapper({ children }: TestWrapperProps) {
  // Reset query client between tests
  queryClient.clear();
  
  // Create portal root if it doesn't exist
  if (!document.getElementById('radix-portal')) {
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'radix-portal');
    document.body.appendChild(portalRoot);
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
