'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SecureViewer({ contentUrl }: { contentUrl: string }) {
  const { user } = useAuth();
  const [ip, setIp] = useState('Fetching IP...');
  const [position, setPosition] = useState({ top: 10, left: 10 });

  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // Fetch IP
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => setIp('Unknown IP'));

    // Move watermark randomly every 3 seconds
    const interval = setInterval(() => {
      setPosition({
        top: Math.random() * 80 + 10, // 10% to 90%
        left: Math.random() * 80 + 10,
      });
    }, 3000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      
      {/* The actual content (e.g. video or iframe) */}
      <iframe 
        src={contentUrl} 
        className="w-full h-full border-none pointer-events-none" 
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Floating Watermark */}
      <div 
        className="absolute text-white text-opacity-50 font-bold text-2xl pointer-events-none transition-all duration-1000 ease-in-out z-50 select-none"
        style={{ top: `${position.top}%`, left: `${position.left}%` }}
      >
        <p>{user?.email || 'Unauthorized'}</p>
        <p>{ip}</p>
      </div>

      {/* Optional Overlay to catch clicks if needed */}
      <div className="absolute inset-0 z-40 bg-transparent"></div>
    </div>
  );
}
