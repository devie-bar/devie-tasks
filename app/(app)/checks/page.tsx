import { Suspense } from "react";
import { ChecksManage, ChecksManageFallback } from "@/components/ChecksManage";

export default function ChecksPage() {
  return (
    <Suspense fallback={<ChecksManageFallback />}>
      <ChecksManage />
    </Suspense>
  );
}
