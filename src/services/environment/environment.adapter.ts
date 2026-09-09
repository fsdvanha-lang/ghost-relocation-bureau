import { useState, useEffect, useCallback } from 'react';
import type { EnvironmentData } from './environment.types';
import { DEFAULT_ENVIRONMENT_FALLBACK } from './environment.config';
import { fetchAtmosphereData, getCachedEnvironment } from './astronomy.service';

/**
 * Hook providing access to the decoupled atmospheric environment layer.
 * The UI consumes EnvironmentData without knowing the external origin.
 */
export function useEnvironment() {
  const [data, setData] = useState<EnvironmentData>(() => {
    // Immediate hydration from cache or default fallback: zero UI shift
    return getCachedEnvironment() || DEFAULT_ENVIRONMENT_FALLBACK;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    // Async background sync on initial mount
    fetchAtmosphereData(false)
      .then(result => {
        if (isMounted) setData(result);
      })
      .catch(() => {
        if (isMounted) {
          setData(prev => ({
            ...prev,
            status: 'fallback',
            statusMessage: 'Автономный режим'
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await fetchAtmosphereData(true);
      setData(result);
    } catch {
      setData(prev => ({
        ...prev,
        status: 'fallback',
        statusMessage: 'Автономный режим'
      }));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    data,
    isSyncing,
    refresh
  };
}
