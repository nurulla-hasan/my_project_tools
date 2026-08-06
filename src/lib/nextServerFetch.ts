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
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

export type ApiFailure = {
  success: false;
  statusCode: number;
  message: string;
  errorDetails?: unknown;
  stack?: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/**
 * The backend normally returns ApiResult<T>.
 *
 * A proxy, rate limiter, or external server may also return plain text
 * or an empty response. Those values are returned without modification.
 */
export type BackendResponse<T> = ApiResult<T> | string | null;

type RequestTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type RefreshResult =
  | {
      success: true;
      accessToken: string;
      refreshToken?: string;
      responseBody: unknown;
      status: number;
    }
  | {
      success: false;
      responseBody: unknown;
      status: number;
    };

const isObject = (
  value: unknown,
): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> => {
  if (!isObject(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
};

const getBaseUrl = (): string => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_BASE_API;

  if (!baseUrl) {
    /**
     * This is an application configuration error, not a backend response.
     * Throw the original error instead of returning a fabricated API failure.
     */
    throw new Error(
      "NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BASE_API is not defined",
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

/**
 * cookies() is intentionally not wrapped in try/catch.
 *
 * If Next.js throws a dynamic-rendering bailout during static prerendering,
 * the framework must receive and handle that error itself.
 */
const getRequestTokens = async (): Promise<RequestTokens> => {
  const cookieStore = await cookies();

  return {
    accessToken:
      cookieStore.get("accessToken")?.value ?? null,
    refreshToken:
      cookieStore.get("refreshToken")?.value ?? null,
  };
};

const isExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);

    return (
      typeof exp !== "number" ||
      exp * 1000 <= Date.now()
    );
  } catch {
    /**
     * A malformed token cannot be used safely,
     * so it is intentionally treated as expired.
     */
    return true;
  }
};

/**
 * Reads the backend response body without changing its semantic shape.
 *
 * JSON response -> parsed JSON value
 * Plain text    -> original string
 * Empty body    -> null
 *
 * If the backend declares JSON but sends invalid JSON,
 * the original JSON.parse error is allowed to throw.
 */
const readBackendBody = async (
  response: Response,
): Promise<unknown> => {
  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return null;
  }

  const responseText = await response.text();

  if (responseText.length === 0) {
    return null;
  }

  const contentType =
    response.headers
      .get("content-type")
      ?.toLowerCase() ?? "";

  const isJsonResponse =
    contentType.includes("application/json") ||
    contentType.includes("+json");

  if (isJsonResponse) {
    return JSON.parse(responseText);
  }

  /**
   * Plain text is returned as-is.
   * It is not converted into an artificial { message } object.
   */
  return responseText;
};

const prepareBody = (
  body: unknown,
  headers: Headers,
  method: string,
): BodyInit | undefined => {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (method === "GET" || method === "HEAD") {
    /**
     * This is a caller/programming error, not a backend API failure.
     */
    throw new TypeError(
      `${method} requests cannot include a body`,
    );
  }

  if (body instanceof FormData) {
    /**
     * Do not manually set Content-Type for FormData.
     * The runtime must generate the multipart boundary automatically.
     */
    headers.delete("Content-Type");

    return body;
  }

  if (
    isPlainObject(body) ||
    Array.isArray(body)
  ) {
    if (!headers.has("Content-Type")) {
      headers.set(
        "Content-Type",
        "application/json",
      );
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

  throw new TypeError(
    "Unsupported request body type",
  );
};

/**
 * Refreshes the access token without modifying the backend response body.
 *
 * Network errors, fetch errors, and Next.js framework errors are not caught.
 * They propagate to the original caller unchanged.
 */
const refreshAccessToken = async (
  refreshToken: string,
  baseUrl: string,
): Promise<RefreshResult> => {
  const response = await fetch(
    `${baseUrl}/refresh-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    },
  );

  const responseBody =
    await readBackendBody(response);

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      responseBody,
    };
  }

  const data =
    isObject(responseBody) &&
    isObject(responseBody.data)
      ? responseBody.data
      : null;

  const newAccessToken =
    data &&
    typeof data.accessToken === "string"
      ? data.accessToken
      : null;

  const newRefreshToken =
    data &&
    typeof data.refreshToken === "string"
      ? data.refreshToken
      : undefined;

  /**
   * If the backend returns a successful HTTP status without an access token,
   * return the original backend body instead of creating a custom error body.
   */
  if (!newAccessToken) {
    return {
      success: false,
      status: response.status,
      responseBody,
    };
  }

  return {
    success: true,
    status: response.status,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    responseBody,
  };
};

export const nextServerFetch = async <T>(
  endpoint: string,
  options: NextServerFetchOptions = {},
): Promise<BackendResponse<T>> => {
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

  const body = prepareBody(
    rawBody,
    headers,
    normalizedMethod,
  );

  const baseUrl = getBaseUrl();

  let accessToken: string | null = null;

  if (auth !== "none") {
    const tokens = await getRequestTokens();

    accessToken = tokens.accessToken;

    const accessTokenIsUsable =
      accessToken !== null &&
      !isExpired(accessToken);

    if (!accessTokenIsUsable) {
      accessToken = null;

      if (tokens.refreshToken) {
        const refreshResult =
          await refreshAccessToken(
            tokens.refreshToken,
            baseUrl,
          );

        if (refreshResult.success) {
          /**
           * The refreshed access token is used for the current backend request.
           *
           * Cookies are not written here because this utility may run during
           * Server Component rendering. Cookie persistence should be handled
           * by Proxy, a Route Handler, or a Server Action.
           */
          accessToken =
            refreshResult.accessToken;
        } else if (auth === "required") {
          /**
           * Return the refresh endpoint's original backend response body.
           * Do not replace it with a custom 401 or 500 response.
           */
          return refreshResult.responseBody as BackendResponse<T>;
        }
      }
    }
  }

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  const normalizedEndpoint =
    endpoint.replace(/^\/+/, "");

  /**
   * No try/catch is used here.
   *
   * The following errors therefore propagate unchanged:
   * - Next.js dynamic-rendering bailouts
   * - Network failures
   * - Abort errors
   * - Native fetch errors
   * - Runtime errors
   */
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

  /**
   * The response body is returned without checking response.ok.
   *
   * Whether the backend responds with 200, 400, 401, 404, or 500,
   * the original response body is returned without modification.
   */
  return (await readBackendBody(
    response,
  )) as BackendResponse<T>;
};
