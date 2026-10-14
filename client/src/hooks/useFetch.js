import { useState, useEffect, useCallback } from 'react';

/**
 * Hook générique pour charger des données async.
 * @param {Function} fetchFn - fonction qui retourne une Promise
 * @param {Array} deps - dépendances (re-fetch si changent)
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
