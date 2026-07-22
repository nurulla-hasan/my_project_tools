import { jwtDecode } from "jwt-decode";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type UserRole = "USER" | "SURVEYOR" | "ADMIN";

type TokenPayload = {
  exp?: number;
  role?: unknown;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const REFRESH_BUFFER_SECONDS = 30;
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60;

// Temporary: keep route protection off while the authenticated flow is being built.
const ROUTE_PROTECTION_ENABLED = false;

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-code",
] as const;

const PRIVATE_ROUTES = [
  "/tools",
  "/community",
  "/join-as-surveyor",
] as const;

const ROLE_HOME: Record<UserRole, string> = {
  USER: "/dashboard",
  SURVEYOR: "/surveyor/dashboard",
  ADMIN: "/admin/dashboard",
};

const ROLE_ROUTES: Record<UserRole, string> = {
  USER: "/dashboard",
  SURVEYOR: "/surveyor",
  ADMIN: "/admin",
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isUserRole = (value: unknown): value is UserRole => {
  return value === "USER" || value === "SURVEYOR" || value === "ADMIN";
};

const matchesRoute = (
  pathname: string,
  route: string,
): boolean => {
  return pathname === route || pathname.startsWith(`${route}/`);
};

const matchesAnyRoute = (
  pathname: string,
  routes: readonly string[],
): boolean => {
  return routes.some((route) => matchesRoute(pathname, route));
};

const getTokenPayload = (token: string): TokenPayload | null => {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
};

const getTokenExpiry = (token: string): number | null => {
  const payload = getTokenPayload(token);

  return typeof payload?.exp === "number" ? payload.exp : null;
};

const getTokenRole = (token: string): UserRole | null => {
  const payload = getTokenPayload(token);

  return isUserRole(payload?.role) ? payload.role : null;
};

const isTokenExpired = (token: string): boolean => {
  const expiresAt = getTokenExpiry(token);

  if (!expiresAt) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);

  return expiresAt <= currentTime + REFRESH_BUFFER_SECONDS;
};

const getTokenMaxAge = (token: string): number | undefined => {
  const expiresAt = getTokenExpiry(token);

  if (!expiresAt) {
    return undefined;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const maxAge = expiresAt - currentTime;

  return maxAge > 0 ? maxAge : undefined;
};

const getAuthTokens = (responseData: unknown): AuthTokens | null => {
  if (!isObject(responseData) || !isObject(responseData.data)) {
    return null;
  }

  const { accessToken, refreshToken } = responseData.data;

  if (
    typeof accessToken !== "string" ||
    !accessToken ||
    typeof refreshToken !== "string" ||
    !refreshToken
  ) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
};

const refreshAuthTokens = async (
  baseUrl: string,
  refreshToken: string,
  rememberMe: boolean,
): Promise<AuthTokens | null> => {
  try {
    const response = await fetch(
      `${baseUrl}/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
          rememberMe,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const responseData: unknown = await response.json();

    return getAuthTokens(responseData);
  } catch (error: unknown) {
    void error;

    return null;
  }
};

const createForwardedResponse = (request: NextRequest): NextResponse => {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("cookie", request.cookies.toString());

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
};

const setAuthCookies = (
  response: NextResponse,
  tokens: AuthTokens,
  rememberMe: boolean,
): void => {
  const accessTokenMaxAge = getTokenMaxAge(tokens.accessToken);
  const refreshTokenMaxAge = rememberMe
    ? getTokenMaxAge(tokens.refreshToken) ?? REMEMBER_ME_MAX_AGE
    : undefined;

  response.cookies.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(accessTokenMaxAge ? { maxAge: accessTokenMaxAge } : {}),
  });

  response.cookies.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(refreshTokenMaxAge ? { maxAge: refreshTokenMaxAge } : {}),
  });
};

const deleteAuthCookies = (response: NextResponse): void => {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
};

const getRouteRedirect = (
  request: NextRequest,
  role: UserRole | null,
): URL | null => {
  const { pathname, search } = request.nextUrl;
  const isAuthRoute = matchesAnyRoute(pathname, AUTH_ROUTES);
  const isPrivateRoute = matchesAnyRoute(pathname, PRIVATE_ROUTES);
  const requiredRole = (
    Object.entries(ROLE_ROUTES) as Array<[UserRole, string]>
  ).find(([, route]) => matchesRoute(pathname, route))?.[0];

  if (isAuthRoute && role) {
    return new URL(ROLE_HOME[role], request.url);
  }

  if ((isPrivateRoute || requiredRole) && !role) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${search}`,
    );

    return loginUrl;
  }

  if (requiredRole && role && role !== requiredRole) {
    return new URL(ROLE_HOME[role], request.url);
  }

  return null;
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const rememberMe = request.cookies.get("rememberMe")?.value === "true";

  const baseUrl =
    process.env.BASE_API_URL ?? process.env.NEXT_PUBLIC_BASE_API;

  let refreshedTokens: AuthTokens | null = null;
  let shouldClearAuth = false;

  if ((!accessToken || isTokenExpired(accessToken)) && refreshToken && baseUrl) {
    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

    refreshedTokens = await refreshAuthTokens(
      normalizedBaseUrl,
      refreshToken,
      rememberMe,
    );

    if (refreshedTokens) {
      accessToken = refreshedTokens.accessToken;
      request.cookies.set("accessToken", refreshedTokens.accessToken);
      request.cookies.set("refreshToken", refreshedTokens.refreshToken);
    } else {
      accessToken = undefined;
      shouldClearAuth = true;
    }
  } else if (accessToken && isTokenExpired(accessToken)) {
    accessToken = undefined;
    shouldClearAuth = true;
  }

  let role =
    accessToken && !isTokenExpired(accessToken)
      ? getTokenRole(accessToken)
      : null;

  if (accessToken && !role) {
    accessToken = undefined;
    role = null;
    shouldClearAuth = true;
  }

  if (shouldClearAuth) {
    request.cookies.delete("accessToken");
    request.cookies.delete("refreshToken");
  }

  const redirectUrl = ROUTE_PROTECTION_ENABLED
    ? getRouteRedirect(request, role)
    : null;
  const response = redirectUrl
    ? NextResponse.redirect(redirectUrl)
    : refreshedTokens || shouldClearAuth
      ? createForwardedResponse(request)
      : NextResponse.next();

  if (refreshedTokens) {
    setAuthCookies(response, refreshedTokens, rememberMe);
  } else if (shouldClearAuth) {
    deleteAuthCookies(response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)",
  ],
};
