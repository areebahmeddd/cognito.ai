import { redirect } from "next/navigation";

export default function AppPage() {
  // Redirect to dashboard when accessing the app root
  redirect("/dashboard");
}
