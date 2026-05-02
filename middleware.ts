import { NextRequest, NextResponse } from "next/server";

/**
 * Admin 鉴权中间件
 * - 保护 /admin 页面和 /api/admin/* 接口
 * - 读取 ADMIN_TOKEN 环境变量
 * - 无 token 配置时（开发模式）自动放行
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 仅拦截 admin 相关路由
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const adminToken = process.env.ADMIN_TOKEN;

  // 开发模式：未配置 token 则放行
  if (!adminToken || adminToken.length === 0) {
    return NextResponse.next();
  }

  // 检查 Authorization header
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  // 也支持 cookie 方式（admin 页面访问）
  const cookieToken = request.cookies.get("admin_token")?.value;

  if (token === adminToken || cookieToken === adminToken) {
    return NextResponse.next();
  }

  // API 路由返回 401
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid admin token required" },
      { status: 401 }
    );
  }

  // 页面路由重定向到首页
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
