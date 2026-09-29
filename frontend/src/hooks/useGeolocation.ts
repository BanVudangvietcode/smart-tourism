'use client';

import { useState, useEffect } from 'react';
import { D4_CENTER } from '@/lib/map-data';

export function useGeolocation() {
  const safeCenter: [number, number] = (Array.isArray(D4_CENTER) && typeof D4_CENTER[0] === 'number') ? D4_CENTER : [10.7613, 106.7056];
  const [position, setPosition] = useState<[number, number]>(safeCenter);
  const [heading, setHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && !navigator.geolocation) {
      return 'Geolocation not supported';
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        if (pos.coords.heading !== null) {
          setHeading(pos.coords.heading);
        }
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, heading, error };
}
