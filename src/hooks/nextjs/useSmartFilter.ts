"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useEffect, useState } from "react";

// ============================================
// Type Definitions
// ============================================

export interface SmartFilterOptions {
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Reset pagination to page 1 when filter changes */
  resetPage?: boolean;
  /** Enable scroll restoration after navigation */
  scroll?: boolean;
  /** Navigation method - push adds to history, replace does not */
  method?: "push" | "replace";
}

export interface SmartFilterConfig {
  /** URL parameter key for pagination (default: "page") */
  paginationKey?: string;
  /** Default debounce delay for all updates (default: 0) */
  defaultDebounce?: number;
}

export interface ClearAllOptions {
  /** Keys to exclude from clearing */
  exclude?: ReadonlyArray<string>;
  /** Enable scroll restoration */
  scroll?: boolean;
  /** Navigation method */
  method?: "push" | "replace";
}

// ============================================
// Main Hook
// ============================================

/**
 * A powerful hook for managing URL search parameters in Next.js App Router.
 * Features Optimistic UI updates to eliminate input lag.
 */
export const useSmartFilter = <T extends string = string>(
  config: SmartFilterConfig = {}
) => {
  const { paginationKey = "page", defaultDebounce = 0 } = config;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Use ReturnType to avoid environment conflicts (Browser vs Node) for setTimeout
  const timeoutRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Optimistic UI State to keep input response instantaneous
  const [optimisticParams, setOptimisticParams] = useState(() => 
    new URLSearchParams(searchParams.toString())
  );

  // Sync optimistic state when URL actually changes (e.g. back/forward button)
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (optimisticParams.toString() !== currentParams) {
      setOptimisticParams(new URLSearchParams(currentParams));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  // ============================================
  // Update Single Filter
  // ============================================
  const updateFilter = useCallback(
    (
      key: T,
      value: string | number | null | undefined,
      options: SmartFilterOptions | number = {}
    ) => {
      const opt = typeof options === "number" ? { debounce: options } : options;
      const {
        debounce = defaultDebounce,
        resetPage = true,
        scroll = false,
        method = "push",
      } = opt;

      // 1. Update UI state immediately (Optimistic Update)
      setOptimisticParams((prev) => {
        const next = new URLSearchParams(prev.toString());
        if (value !== null && value !== undefined && value !== "") {
          next.set(key, String(value));
        } else {
          next.delete(key);
        }
        if (resetPage && key !== paginationKey) {
          next.set(paginationKey, "1");
        }
        return next;
      });

      // 2. Clear existing debounce timeout for this key
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
      }

      // 3. Update Real URL (Debounced)
      const executeUpdate = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (value !== null && value !== undefined && value !== "") {
          // Validate pagination
          if (key === paginationKey && (Number(value) < 1 || isNaN(Number(value)))) return;
          params.set(key, String(value));
        } else {
          params.delete(key);
        }

        if (resetPage && key !== paginationKey) {
          params.set(paginationKey, "1");
        }

        const url = `${pathname}?${params.toString()}`;
        if (method === "replace") {
          router.replace(url, { scroll });
        } else {
          router.push(url, { scroll });
        }
        
        delete timeoutRefs.current[key];
      };

      if (debounce > 0) {
        timeoutRefs.current[key] = setTimeout(executeUpdate, debounce);
      } else {
        executeUpdate();
      }
    },
    [searchParams, pathname, router, paginationKey, defaultDebounce]
  );

  // ============================================
  // Update Multiple Filters (Batch)
  // ============================================
  const updateBatch = useCallback(
    (
      updates: Partial<Record<T, string | number | null | undefined>>,
      options: SmartFilterOptions | number = {}
    ) => {
      const opt = typeof options === "number" ? { debounce: options } : options;
      const {
        debounce = defaultDebounce,
        resetPage = true,
        scroll = false,
        method = "push",
      } = opt;

      // 1. Update UI state immediately (Optimistic)
      setOptimisticParams((prev) => {
        const next = new URLSearchParams(prev.toString());
        let changed = false;
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            next.set(key, String(value));
          } else {
            next.delete(key);
          }
          if (key !== paginationKey) changed = true;
        });
        if (resetPage && changed) next.set(paginationKey, "1");
        return next;
      });

      // 2. Clear existing timeouts
      const batchKey = `__batch_${Math.random()}`;
      if (timeoutRefs.current[batchKey]) {
        clearTimeout(timeoutRefs.current[batchKey]);
      }

      const executeUpdate = () => {
        const params = new URLSearchParams(searchParams.toString());
        let hasFilterChanged = false;

        Object.entries(updates).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            // Validate pagination
            if (key === paginationKey && (Number(value) < 1 || isNaN(Number(value)))) return;
            params.set(key, String(value));
          } else {
            params.delete(key);
          }
          if (key !== paginationKey) hasFilterChanged = true;
        });

        if (resetPage && hasFilterChanged) {
          params.set(paginationKey, "1");
        }

        const url = `${pathname}?${params.toString()}`;
        if (method === "replace") {
          router.replace(url, { scroll });
        } else {
          router.push(url, { scroll });
        }
        
        delete timeoutRefs.current[batchKey];
      };

      if (debounce > 0) {
        timeoutRefs.current[batchKey] = setTimeout(executeUpdate, debounce);
      } else {
        executeUpdate();
      }
    },
    [searchParams, pathname, router, paginationKey, defaultDebounce]
  );

  // ============================================
  // Toggle Filter (Multi-Select)
  // ============================================
  const toggleFilter = useCallback(
    (key: T, value: string, options?: SmartFilterOptions) => {
      const currentVal = optimisticParams.get(key);
      let newValues = currentVal ? currentVal.split(",") : [];

      if (newValues.includes(value)) {
        newValues = newValues.filter((v) => v !== value);
      } else {
        newValues.push(value);
      }

      const finalValue = newValues.length > 0 ? newValues.join(",") : null;
      updateFilter(key, finalValue, options);
    },
    [optimisticParams, updateFilter]
  );

  // ============================================
  // Clear All Filters
  // ============================================
  const clearAll = useCallback(
    (options: ClearAllOptions = {}) => {
      const { exclude = [], scroll = false, method = "push" } = options;
      
      // 1. Update UI immediately
      setOptimisticParams(prev => {
        const next = new URLSearchParams(prev.toString());
        Array.from(next.keys()).forEach(key => {
          if (!exclude.includes(key)) next.delete(key);
        });
        return next;
      });

      // 2. Update URL
      const params = new URLSearchParams(searchParams.toString());
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};

      Array.from(params.keys()).forEach((key) => {
        if (!exclude.includes(key)) params.delete(key);
      });

      const url = `${pathname}?${params.toString()}`;
      if (method === "replace") {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    },
    [searchParams, pathname, router]
  );

  // ============================================
  // Read Methods (Always from Optimistic State)
  // ============================================
  const getFilter = useCallback((key: T, defaultValue = "") => {
    return optimisticParams.get(key) ?? defaultValue;
  }, [optimisticParams]);

  const getArrayFilter = useCallback((key: T) => {
    const val = optimisticParams.get(key);
    return val ? val.split(",").filter(Boolean) : [];
  }, [optimisticParams]);

  const isSelected = useCallback((key: T, value: string) => {
    const val = optimisticParams.get(key);
    return val ? val.split(",").includes(value) : false;
  }, [optimisticParams]);

  const isFilterActive = useCallback((keys?: ReadonlyArray<T>) => {
    if (keys && keys.length > 0) return keys.some((key) => optimisticParams.has(key));
    const allKeys = Array.from(optimisticParams.keys());
    return allKeys.some((key) => key !== paginationKey);
  }, [optimisticParams, paginationKey]);

  const getAllFilters = useCallback(() => 
    Object.fromEntries(optimisticParams.entries()), 
  [optimisticParams]);

  const getActiveCount = useCallback((keys?: ReadonlyArray<T>) => {
    const activeKeys = keys || Array.from(optimisticParams.keys()).filter(k => k !== paginationKey);
    return activeKeys.filter(k => optimisticParams.has(k)).length;
  }, [optimisticParams, paginationKey]);

  return {
    // Update methods
    updateFilter,
    updateBatch,
    toggleFilter,
    clearAll,

    // Read methods
    getFilter,
    getArrayFilter,
    isSelected,
    getAllFilters,

    // Status methods
    isFilterActive,
    getActiveCount,
  };
};
