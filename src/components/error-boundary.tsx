import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
              <h2 className="text-lg font-semibold text-destructive">出错了 / Something went wrong</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                重试 / Try Again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
