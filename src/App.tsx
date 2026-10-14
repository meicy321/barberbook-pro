import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, Outlet, RouterProvider, createBrowserRouter, useRouteError } from "react-router";

import { reportLovableError } from "@/lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Barbers from "@/pages/Barbers";
import BarberDetail from "@/pages/BarberDetail";
import MyBookings from "@/pages/MyBookings";
import Dashboard from "@/pages/Dashboard";
import ShopSetup from "@/pages/ShopSetup";
import ShopBookings from "@/pages/ShopBookings";
import { ShopLayout } from "@/components/ShopLayout";

const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent() {
  const error = useRouteError();
  console.error(error);
  useEffect(() => {
    reportLovableError(error, { boundary: "react_router_root_error_element" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function RootLayout() {
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

export const routes = [
  {
    element: <RootLayout />,
    errorElement: <ErrorComponent />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/barbers", element: <Barbers /> },
      { path: "/barbers/:id", element: <BarberDetail /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/bookings", element: <MyBookings /> },
          {
            element: <ShopLayout />,
            children: [
              { path: "/shop", element: <ShopSetup /> },
              { path: "/shop/bookings", element: <ShopBookings /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundComponent /> },
    ],
  },
];

const router = createBrowserRouter(routes);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
