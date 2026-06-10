import { Suspense } from "react";
import { AiInfrastructurePage } from "@/components/settings/ai-infrastructure-page";

export default function AiInfrastructureRoutePage() {
  return (
    <Suspense fallback={null}>
      <AiInfrastructurePage />
    </Suspense>
  );
}
