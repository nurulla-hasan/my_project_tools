import { 
  useState, 
  useMemo, 
  useTransition, 
  useCallback, 
  useRef, 
  useEffect,
} from 'react';
import type { SetStateAction } from 'react';

/**
 * Standard shape for Meta data in Paginated API Responses
 */
export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

/**
 * Standard shape for Paginated API Responses
 */
export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  meta: TMeta;
};

/**
 * Common query parameters for list-based APIs
 */
type BaseParams = {
  page?: number;
  limit?: number;
  searchTerm?: string;
  [key: string]: unknown;
};

/**
 * Hook Configuration Options
 */
type SmartFetchOptions<P> = Partial<P> & {
  skip?: boolean;
};

/**
 * The interface for the hook's return values
 */
export type UseSmartFetchReturn<P extends BaseParams, T> = {
  data: T[];
  meta: TMeta | undefined;
  isLoading: boolean;
  isInitialLoading: boolean;
  isRefetching: boolean;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  filter: Partial<P>;
  setFilter: (
    update: SetStateAction<Partial<P>>,
    config?: { resetPage?: boolean; debounce?: boolean }
  ) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  refetch: () => void;
};

/**
 * Type definition for the query function (compatible with RTK Query)
 */
type QueryHook<P extends BaseParams, T> = (
  params: P,
  options?: { skip?: boolean }
) => {
  data?: ApiListResponse<T>;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch?: () => void;
};

/**
 * useSmartFetchHook - The Ultimate "Senior Architect" Version
 * Optimized for React 18/19 & Next.js Ecosystem.
 * Handles: Stable Dependencies, Optimistic UI, Smart Debouncing, and Conditional Fetching.
 */
const useSmartFetchHook = <P extends BaseParams, T>(
  queryHook: QueryHook<P, T>,
  options: SmartFetchOptions<P> = {} as SmartFetchOptions<P>,
  initialParams: Partial<P> = {} as Partial<P>
): UseSmartFetchReturn<P, T> => {

  const skip = options.skip ?? false;
  const optionLimit = options.limit;

  // --- THE "PONDITI" LOGIC (Deep Compare initialParams) ---
  // This ensures that even if a new object { status: 'active' } is passed on every render,
  // the hook won't re-trigger unless the values inside actually change.
  const initialParamsRef = useRef(initialParams);
  const initialParamsString = JSON.stringify(initialParams);
  
  const stableInitialParams = useMemo(() => {
    initialParamsRef.current = initialParams;
    return initialParams;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialParamsString]);

  // Memoize default values to maintain reference stability
  const defaultValues = useMemo(() => ({
    page: 1,
    limit: optionLimit ?? 10,
    ...stableInitialParams
  }), [stableInitialParams, optionLimit]);
  // --------------------------------------------------------

  const [filter, setFilterState] = useState<Partial<P>>(defaultValues);
  const [queryParams, setQueryParams] = useState<Partial<P>>(defaultValues);
  const [isPending, startTransition] = useTransition();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Execute query hook with skip support
  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch: originalRefetch
  } = queryHook(queryParams as P, { skip });

  /**
   * Updates filters with optional debouncing and smart pagination reset.
   */
  const setFilter = useCallback((
    update: SetStateAction<Partial<P>>, 
    config?: { resetPage?: boolean; debounce?: boolean }
  ) => {
    const isDebounceRequired = config?.debounce ?? false;

    const resolveNewState = (prev: Partial<P>) => {
      // Logic for functional updates: setFilter(prev => ({...}))
      const next = typeof update === 'function' 
        ? (update as (prev: Partial<P>) => Partial<P>)(prev) 
        : update;
      
      // Auto-reset page to 1 if any filter changes, unless page is provided or disabled in config
      const shouldResetPage = config?.resetPage ?? !('page' in next);
      
      return {
        ...prev,
        ...next,
        page: shouldResetPage ? 1 : (next.page ?? prev.page ?? 1)
      };
    };

    setFilterState(prev => {
      const newState = resolveNewState(prev);
      
      if (isDebounceRequired) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        debounceTimerRef.current = setTimeout(() => {
          startTransition(() => {
            setQueryParams(newState);
          });
        }, 500);
      } else {
        // Instant update for non-debounced fields (like Pagination or Radios)
        startTransition(() => {
          setQueryParams(newState);
        });
      }
      
      return newState;
    });
  }, [setQueryParams, startTransition, setFilterState]);

  /**
   * Specifically for page navigation (Always instant)
   */
  const setPage = useCallback((page: number) => {
    setFilter({ page } as Partial<P>, { resetPage: false, debounce: false });
  }, [setFilter]);

  /**
   * Resets entire UI state and API query to initial values
   */
  const resetFilters = useCallback(() => {
    startTransition(() => {
      setFilterState(defaultValues);
      setQueryParams(defaultValues);
    });
  }, [defaultValues, startTransition, setFilterState, setQueryParams]);

  /**
   * Manual refetch trigger
   */
  const refetch = useCallback(() => {
    if (originalRefetch) {
      originalRefetch();
    } else {
      // Trigger a state change to force the query to run again if refetch is unavailable
      setQueryParams(prev => ({ ...prev }));
    }
  }, [originalRefetch, setQueryParams]);

  const list = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;

  return {
    data: list,
    meta,
    isLoading,
    isInitialLoading: isLoading && !data,
    isRefetching: isFetching && !!data,
    isPending,
    isError,
    isFetching,
    setPage,
    filter,
    setFilter,
    resetFilters,
    refetch
  };
};

export default useSmartFetchHook;
