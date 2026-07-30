import React, { ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle, RotateCcw, Bug } from "lucide-react";

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
  }

  private handleReset = () => {
    sessionStorage.clear();
    localStorage.removeItem("pixelisolate_upscale_trial_used");
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || String(this.state.error || "Unknown Error");
      const errStack = this.state.error?.stack || "";

      return (
        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 m-4 rounded-3xl bg-gray-900/95 border border-gray-800 text-center shadow-2xl backdrop-blur-xl animate-fade-in max-w-3xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-400">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mb-2">
            Application Rendering Warning
          </h3>
          <p className="text-gray-400 text-xs max-w-md mb-4 leading-relaxed">
            A component threw a runtime exception. Details below:
          </p>

          {/* Diagnostic Details */}
          <div className="w-full bg-gray-950 p-4 rounded-2xl border border-gray-850 text-left font-mono text-xs text-rose-400 mb-6 overflow-auto max-h-40">
            <div className="flex items-center gap-2 font-bold mb-1 text-rose-300">
              <Bug className="h-4 w-4" />
              <span>{errMsg}</span>
            </div>
            {errStack && <pre className="text-[10px] text-gray-500 whitespace-pre-wrap">{errStack}</pre>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleTryAgain}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-semibold text-xs transition duration-200 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Component</span>
            </button>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition duration-200 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset & Clear Session</span>
            </button>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}

export default ErrorBoundary;
