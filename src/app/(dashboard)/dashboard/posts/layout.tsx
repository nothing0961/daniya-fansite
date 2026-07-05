import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PostsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== process.env.ADMIN_USER_ID) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
