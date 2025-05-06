import { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, LogOut } from "lucide-react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard - E-commerce Landing Page Generator",
  description: "Manage your products and orders",
};

async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Dashboard
          </Link>
        </div>
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <Link
              href="/dashboard/products"
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Package className="h-5 w-5" />
              Products
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Orders
            </Link>
          </div>
          <div className="px-6 mt-auto pt-4 border-t border-gray-800">
            <form action="/api/auth/signout" method="post">
              <Button
                variant="ghost"
                className="w-full flex items-center gap-2 text-gray-300 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 