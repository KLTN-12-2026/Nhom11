import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/services/monitoring";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
    reportError(error, info.componentStack ?? undefined);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-neutral-500">
            An unexpected error occurred. Try reloading the page.
          </p>
          <Button className="mt-6" variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
