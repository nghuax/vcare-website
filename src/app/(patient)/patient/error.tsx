"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type ErrorPageProps = {
  error: Error;
  reset: () => void;
};

export default function PatientErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="Unable to load patient data"
        description={error.message || "Please try again in a moment."}
      />
      <Button size="lg" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
