import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, can, type Role } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Gate for authenticated routes.
 *
 * This is a convenience for the user, not a security boundary — the real
 * check is the role guard on every endpoint in app/auth.py. Hiding a route
 * here without guarding the API would leave the data reachable by anyone
 * who knows the URL.
 */
export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Don't decide until the stored token has been checked, or a refresh would
  // redirect a signed-in user straight back to the login page.
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (roles && !can(user, roles)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Not available to your role</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You're signed in as <strong>{user.role}</strong>. This page needs{" "}
          {roles.length > 1
            ? `${roles.slice(0, -1).join(", ")} or ${roles[roles.length - 1]}`
            : roles[0]}{" "}
          access.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
