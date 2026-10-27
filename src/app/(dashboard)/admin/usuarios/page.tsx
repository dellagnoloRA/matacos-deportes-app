import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminUsuariosPage() {
  redirect("/admin?tab=usuarios");
}
