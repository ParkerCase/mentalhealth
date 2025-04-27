'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// A much simpler Globe component to avoid JSX transformation issues
const Globe = () => {
  const [mounted, setMounted] = useState(false);

  // Only load Three.js components on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create a simple loading element
  const LoadingElement = () => (
    <div className="h-full w-full flex items-center justify-center bg-[#292929]">
      <div className="text-white opacity-50 animate-pulse">Loading visualization...</div>
    </div>
  );

  // Don't try to render anything on server
  if (!mounted) {
    return <LoadingElement />;
  }

  // Dynamically import only on client side
  const DynamicGlobeContent = dynamic(
    () => import('./GlobeContent'),
    {
      ssr: false,
      loading: () => <LoadingElement />
    }
  );

  return <DynamicGlobeContent />;
};

export default Globe;