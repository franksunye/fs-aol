import { Suspense } from "react";
import { IntegrationsPage } from "@/components/integrations/integrations-page";

export default function IntegrationsRoutePage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsPage />
    </Suspense>
  );
}
