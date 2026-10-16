import { redirect } from "next/navigation";
import { getTasksUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { PrimaryNav, type NavItem } from "@/components/PrimaryNav";
import { AccountMenu } from "@/components/AccountMenu";
import { EstateNav } from "@/components/EstateNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getTasksUser();
  if (!user) redirect("/login");

  if (!user.hasAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-ink">No access</h1>
          <p className="mt-2 text-sm text-ink-muted">
            You&apos;re signed in as {user.email}, but this account isn&apos;t active yet.
            Ask an admin to add you.
          </p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

  const navItems: NavItem[] = [
    { label: "Team", href: "/" },
    { label: "Mine", href: "/mine" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-paper-line bg-paper/80 backdrop-blur">
        <EstateNav current="tasks">
          <PrimaryNav items={navItems} />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <AccountMenu name={user.fullName || user.email || "Account"} role={user.role} email={user.email} />
          </div>
        </EstateNav>
      </header>
      <main className="mx-auto max-w-[1100px] px-5 py-6">{children}</main>
    </div>
  );
}
