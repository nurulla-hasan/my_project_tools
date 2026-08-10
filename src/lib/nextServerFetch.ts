import "server-only";

import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

type AuthMode = "required" | "optional" | "none";

type NextServerFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: AuthMode;
  next?: NextFetchRequestConfig;
};

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
  errorDetails?: unknown;
  stack?: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

type RequestTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type RefreshTokenData = {
  accessToken: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isObject(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isApiResult = <T>(value: unknown): value is ApiResult<T> => {
  if (
    !isObject(value) ||
    typeof value.success !== "boolean" ||
    typeof value.statusCode !== "number" ||
    typeof value.message !== "string"
  ) {
    return false;
  }

  return value.success === false || "data" in value;
};

const getBaseUrl = (): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BASE_API;

  if (!baseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BASE_API is not defined",
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

// Keep cookies() outside try/catch so Next.js can handle dynamic rendering.
const getRequestTokens = async (): Promise<RequestTokens> => {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get("accessToken")?.value ?? null,
    refreshToken: cookieStore.get("refreshToken")?.value ?? null,
  };
};

const isExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return typeof exp !== "number" || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const prepareBody = (
  body: unknown,
  headers: Headers,
  method: string,
): BodyInit | undefined => {
  if (body == null) return undefined;

  if (method === "GET" || method === "HEAD") {
    throw new TypeError(`${method} requests cannot include a body`);
  }

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

  if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  ) {
    return body as BodyInit;
  }

  throw new TypeError("Unsupported request body type");
};

// Returns valid backend JSON unchanged. Invalid response contracts throw.
const readApiResult = async <T>(
  response: Response,
): Promise<ApiResult<T>> => {
  const body: unknown = await response.json();

  if (!isApiResult<T>(body)) {
    throw new TypeError(
      `Backend response does not match ApiResult contract (HTTP ${response.status})`,
    );
  }

  return body;
};

const refreshAccessToken = async (
  refreshToken: string,
  baseUrl: string,
): Promise<ApiResult<RefreshTokenData>> => {
  const response = await fetch(
    `${baseUrl}/api/auth/refresh-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    },
  );

  return readApiResult<RefreshTokenData>(response);
};

/**
 * Returns the backend ApiResult unchanged.
 * Network, malformed-response, runtime, and Next.js framework errors may throw.
 */
export const nextServerFetch = async <T>(
  endpoint: string,
  options: NextServerFetchOptions = {},
): Promise<ApiResult<T>> => {
  const {
    auth = "required",
    body: rawBody,
    headers: customHeaders,
    method = "GET",
    next,
    ...requestOptions
  } = options;

  const normalizedMethod = method.toUpperCase();
  const headers = new Headers(customHeaders);
  const body = prepareBody(rawBody, headers, normalizedMethod);
  const baseUrl = getBaseUrl();

  let accessToken: string | null = null;

  if (auth !== "none") {
    const tokens = await getRequestTokens();
    accessToken = tokens.accessToken;

    if (!accessToken || isExpired(accessToken)) {
      accessToken = null;

      if (tokens.refreshToken) {
        const refreshResult = await refreshAccessToken(
          tokens.refreshToken,
          baseUrl,
        );

        if (refreshResult.success) {
          const refreshedAccessToken =
            refreshResult.data.accessToken;

          if (typeof refreshedAccessToken !== "string") {
            throw new TypeError(
              "Refresh response does not contain a valid accessToken",
            );
          }

          // Used for this request only. Cookie persistence is handled by Proxy.
          accessToken = refreshedAccessToken;
        } else if (auth === "required") {
          return refreshResult;
        }
      }
    }
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const normalizedEndpoint = endpoint.replace(/^\/+/, "");

  // No try/catch: network, runtime, abort and Next.js errors stay real.
  const response = await fetch(
    `${baseUrl}/${normalizedEndpoint}`,
    {
      ...requestOptions,
      method: normalizedMethod,
      headers,
      ...(body !== undefined ? { body } : {}),
      ...(next ? { next } : {}),
    },
  );

  // Both backend success and failure responses follow ApiResult.
  return readApiResult<T>(response);
};
