import { Suspense } from "react";
import { AgentsPage } from "@/components/agents/agents-page";

export default function AgentsRoutePage() {
  return (
    <Suspense fallback={null}>
      <AgentsPage />
    </Suspense>
  );
}
