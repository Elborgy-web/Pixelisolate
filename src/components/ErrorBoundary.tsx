import React, { ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackText?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// @ts-ignore
export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  state: State = {
    hasError: false,
    error: null,
  };

  // @ts-ignore
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // @ts-ignore
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught component error:", error, errorInfo);

    // Detect dynamic import / chunk load errors (stale deployment)
    const isChunkError = 
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.name === "ChunkLoadError";

    if (isChunkError) {
      const reloaded = sessionStorage.getItem("error_boundary_chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("error_boundary_chunk_reload", "true");
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    sessionStorage.removeItem("error_boundary_chunk_reload");
    sessionStorage.removeItem("page_refreshed_for_new_build");
    window.location.reload();
  };

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 m-4 rounded-3xl bg-gray-900/90 border border-gray-800 text-center shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-400">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mb-2">
            New Application Update Available
          </h3>
          <p className="text-gray-400 text-xs max-w-md mb-6 leading-relaxed">
            {/* @ts-ignore */}
            {this.props.fallbackText || "A new version of Pixel Isolate has been deployed. Please refresh to load the latest components."}
          </p>
          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition duration-200 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Page</span>
          </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

export default ErrorBoundary;
