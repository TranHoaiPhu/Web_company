'use client';

import { ReactNode, useEffect, useState } from 'react';

interface NoSSRWrapperProps {
  children: ReactNode;
}

export default function NoSSRWrapper({ children }: NoSSRWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}
