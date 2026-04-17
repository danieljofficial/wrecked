import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[WRECKED] Uncaught error:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isWasmError =
      this.state.error?.message?.includes("wasm") ||
      this.state.error?.message?.includes("WASM") ||
      this.state.error?.message?.includes("Failed to fetch");

    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#0E0E0E] px-6">
        <div className="flex max-w-md flex-col items-center gap-6 border border-red-800/50 bg-[#0E0E0E] p-10">
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs tracking-widest text-red-800">
              SYSTEM_FAILURE
            </span>
            <h1 className="font-lora text-3xl font-bold text-brand-yellow">
              COMMS DOWN
            </h1>
          </div>

          <div className="h-px w-full bg-[#1a1a1a]" />

          <p className="text-center font-mono text-sm leading-relaxed text-[#A3A3A3]">
            {isWasmError
              ? "Lost connection to the cryptographic engine. This usually resolves on retry."
              : "An unexpected system error occurred during operations."}
          </p>

          {this.state.error && (
            <div className="w-full overflow-hidden bg-[#0a0a0a] p-3">
              <p className="truncate font-mono text-xs text-[#525252]">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="border border-brand-yellow bg-transparent px-6 py-2.5 font-mono text-xs font-bold tracking-widest text-brand-yellow transition-all hover:bg-brand-yellow/5"
            >
              RETRY
            </button>
            <button
              onClick={this.handleReload}
              className="border border-brand-yellow bg-brand-yellow px-6 py-2.5 font-mono text-xs font-bold tracking-widest text-brand-black transition-all hover:bg-yellow-300"
            >
              RELOAD
            </button>
          </div>

          <span className="font-mono text-[10px] tracking-widest text-[#333]">
            YOUR GAME STATE IS PRESERVED ON-CHAIN
          </span>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
