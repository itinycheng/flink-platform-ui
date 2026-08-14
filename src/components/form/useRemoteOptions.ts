import { useEffect, useState } from "react";

/** Fetch a list on mount and whenever `deps` change; drop results after unmount. */
export function useRemoteOptions<T>(fetcher: () => Promise<T[]>, deps: unknown[]): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetcher()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setData([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}
