import "server-only";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

type AuthMode = "auth" | "none";

type NextServerFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth: AuthMode;
  next?: NextFetchRequestConfig;
};

// nextServerFetch returns these verbatim, so callers see the same shape as Postman.
export type ApiSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number };
};

export type ApiFailure = {
  success: false;
  statusCode: number;
  message: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

type RefreshResponse = {
  data?: {
    accessToken?: string;
  };
};

const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  return baseUrl;
};

const isExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const getRequestTokens = async () => {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get("accessToken")?.value ?? null,
    refreshToken: cookieStore.get("refreshToken")?.value ?? null,
  };
};

// Refreshes only for the current request.
// Cookie persistence is handled by Proxy.
const refreshAccessToken = async (
  refreshToken: string,
): Promise<string | null> => {
  const response = await fetch(`${getBaseUrl()}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const result = (await response.json()) as RefreshResponse;
  const accessToken = result.data?.accessToken;

  return typeof accessToken === "string" ? accessToken : null;
};

const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const prepareBody = (
  body: unknown,
  headers: Headers,
): BodyInit | undefined => {
  if (body == null) return undefined;

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }

  if (isPlainObject(body) || Array.isArray(body)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return JSON.stringify(body);
  }

  return body as BodyInit;
};

export const nextServerFetch = async <T = unknown>(
  endpoint: string,
  options: NextServerFetchOptions,
): Promise<ApiResult<T>> => {
  try {
    const {
      auth,
      body: rawBody,
      headers: customHeaders,
      next,
      ...requestOptions
    } = options;

    const headers = new Headers(customHeaders);
    const body = prepareBody(rawBody, headers);

    if (auth === "auth") {
      const tokens = await getRequestTokens();
      let accessToken = tokens.accessToken;

      if (!accessToken || isExpired(accessToken)) {
        accessToken = tokens.refreshToken
          ? await refreshAccessToken(tokens.refreshToken)
          : null;
      }

      if (!accessToken) {
        return {
          success: false,
          statusCode: 401,
          message: "Authentication required",
        };
      }

      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      ...requestOptions,
      headers,
      ...(body !== undefined ? { body } : {}),
      ...(next ? { next } : {}),
    });

    return (await response.json()) as ApiResult<T>;
  } catch (error) {
    return {
      success: false,
      statusCode: 500,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
