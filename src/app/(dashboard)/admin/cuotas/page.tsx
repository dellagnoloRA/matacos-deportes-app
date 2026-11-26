import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminCuotasPage() {
  redirect("/admin?tab=cuotas");
}
