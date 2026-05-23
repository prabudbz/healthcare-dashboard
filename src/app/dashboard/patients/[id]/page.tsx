import { Suspense } from "react";
import { PatientDetailClient } from "./patient-detail-client";
import { Loader2 } from "lucide-react";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      }
    >
      <PatientDetailClient id={id} />
    </Suspense>
  );
}
