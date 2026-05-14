'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);

    // Trigger admin notification for unhandled errors
    fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'system-error@axiscap.internal',
          subject: 'CRITICAL: Unhandled Application Error',
          message: `An unhandled error occurred in the AXIS CAP Terminal.\n\nError Message: ${error.message}\nDigest: ${error.digest}\nStack: ${error.stack}`
        })
    }).catch(e => console.error("Failed to notify admin of error:", e));

  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white">
      <h2 className="text-2xl font-bold mb-4 text-[#d73434]">Something went wrong!</h2>
      <p className="text-gray-400 mb-8 max-w-md text-center text-sm">
        A system error has been detected and logged for the AXIS CAP engineering team.
      </p>
      <button
        onClick={() => reset()}
        className="bg-[#34d74a] text-black px-6 py-2 rounded-lg font-bold tracking-wider uppercase text-sm hover:bg-[#2bc43f]"
      >
        Try again
      </button>
    </div>
  );
}
