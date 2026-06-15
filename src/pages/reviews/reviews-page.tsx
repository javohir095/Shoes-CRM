import { Star, MessageSquareText } from "lucide-react";
import { PageHeader, EmptyState } from "@/shared/ui/page-header";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useReviews } from "@/features/reviews/api/reviews-api";
import { useCompanyUsers } from "@/features/workers/hooks/use-workers";
import { useOrder } from "@/features/orders/hooks/use-orders";
import { formatDate } from "@/shared/lib/utils";

export default function ReviewsPage() {
  const profile = useAuthStore((s) => s.profile);
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: reviews, isLoading } = useReviews(profile?.company_id, isSuperAdmin);
  const { data: users } = useCompanyUsers(profile?.company_id ?? undefined);

  const userMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

  return (
    <div>
      <PageHeader title="Mijozlar fikri" description="Mijozlarning baho va izohlari" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState icon={<MessageSquareText className="h-10 w-10" />} title="Hozircha fikrlar yo'q" />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              workerName={review.worker_id ? userMap.get(review.worker_id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  workerName,
}: {
  review: { id: string; order_id: string; rating: number; comment: string | null; created_at: string };
  workerName?: string;
}) {
  const { data: order } = useOrder(review.order_id);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-muted"}`} />
            ))}
          </div>
          {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {order && <span className="font-mono">{order.order_number}</span>}
            {order && <span>· {order.customer_name}</span>}
            {workerName && <span>· Ishchi: {workerName}</span>}
          </div>
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
      </div>
    </Card>
  );
}
