import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminPerfilesPage() {
  redirect("/admin?tab=perfiles");
}
