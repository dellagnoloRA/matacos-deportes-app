import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminReviewsPage() {
  redirect("/admin?tab=resenas");
}
