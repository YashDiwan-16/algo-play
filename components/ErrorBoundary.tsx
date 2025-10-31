"use client";

import type { ReactNode } from "react";
import {
  type FallbackProps,
  ErrorBoundary as ReactErrorBoundary,
} from "react-error-boundary";

type ErrorBoundaryProps = {
  children: ReactNode;
};

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content mx-auto max-w-md rounded-lg bg-white p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl">Error occured</h1>
          <p className="py-6">
            {error?.message.includes(
              "Attempt to get default algod configuration"
            )
              ? "Please make sure to set up your environment variables correctly. Create a .env file based on .env.template and fill in the required values. This controls the network and credentials for connections with Algod and Indexer."
              : error?.message}
          </p>
          <button
            className="btn mt-4"
            onClick={() => resetErrorBoundary()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                resetErrorBoundary();
              }
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};

function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}

export default ErrorBoundary;
