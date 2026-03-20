import { PageContainer } from "@/components/layout/page-container";
import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <PageContainer className="py-10">
      <LoadingState title="Preparing your VCare workspace..." />
    </PageContainer>
  );
}
