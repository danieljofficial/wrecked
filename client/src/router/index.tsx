import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppPathsEnum } from "./enums";
import ErrorBoundary from "../components/error/ErrorBoundary";

const LandingPage = lazy(() => import("../pages/landing"));
const PlacementPage = lazy(() => import("../pages/placement"));
const GamePage = lazy(() => import("../pages/game"));

const Fallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#0E0E0E]">
    <span className="font-mono text-sm tracking-widest text-brand-yellow animate-proof-pulse">
      LOADING...
    </span>
  </div>
);

const withErrorBoundary = (element: React.ReactNode) => (
  <ErrorBoundary>
    <Suspense fallback={<Fallback />}>{element}</Suspense>
  </ErrorBoundary>
);

const router = createBrowserRouter([
  {
    path: AppPathsEnum.LANDING,
    element: withErrorBoundary(<LandingPage />),
  },
  {
    path: AppPathsEnum.PLACEMENT,
    element: withErrorBoundary(<PlacementPage />),
  },
  {
    path: AppPathsEnum.GAME,
    element: withErrorBoundary(<GamePage />),
  },
]);

export default router;
