import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CollectionDemoProvider } from "./contexts/CollectionDemoContext";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const Identify = lazy(() => import("./pages/Identify"));
const PublicCollection = lazy(() => import("./pages/PublicCollection"));
const StampDetail = lazy(() => import("./pages/StampDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Albums = lazy(() => import("./pages/Albums"));

function ComingSoon() {
  return <Home />;
}

function Router() {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f7f5f0] text-sm font-semibold text-[#466a59]">Loading StampAtlas…</div>}><Switch>
      <Route path="/" component={Home} />
      <Route path="/explore" component={Explore} />
      <Route path="/stamps/:slug" component={StampDetail} />
      <Route path="/identify" component={Identify} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/albums" component={Albums} />
      <Route path="/collections/:username/:collectionSlug" component={PublicCollection} />
      <Route path="/collections/:username" component={PublicCollection} />
      <Route path="/404" component={NotFound} />
      <Route path="/guides/:slug" component={ComingSoon} />
      <Route component={NotFound} />
    </Switch></Suspense>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><CollectionDemoProvider><TooltipProvider><Toaster /><Router /></TooltipProvider></CollectionDemoProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
