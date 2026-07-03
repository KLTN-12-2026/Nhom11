import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/router/AppRouter";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}
