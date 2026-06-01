import { Skeleton } from "@/components/ui/skeleton";

export default function BookLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
      </div>
    </div>
  );
}
