import { Suspense } from "react";
import { TodayView, TodaySkeletonPage } from "@/components/TodayView";

export default function TodayPage() {
  return (
    <Suspense fallback={<TodaySkeletonPage />}>
      <TodayView />
    </Suspense>
  );
}
