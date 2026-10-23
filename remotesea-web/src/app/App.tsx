import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/router/AppRouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const App = () => (
  <ErrorBoundary>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </ErrorBoundary>
);
