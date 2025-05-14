import { Metadata } from "next";
import Link from "next/link";
import { Package, ShoppingCart, LogOut, LayoutDashboard, Store, Settings, BarChart2, Users } from "lucide-react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Seller Dashboard - E-commerce Platform",
  description: "Manage your products, track orders, and grow your business",
};

async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SellerDash
            </span>
          </Link>
        </div>
        <nav className="p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-3 pb-2 px-2">
              Main
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-indigo-50 hover:text-indigo-700 text-gray-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-indigo-50 hover:text-indigo-700 text-gray-700"
            >
              <Package className="h-4 w-4" />
              Products
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-indigo-50 hover:text-indigo-700 text-gray-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Orders
            </Link>
            
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-6 pb-2 px-2">
              Account
            </p>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-indigo-50 hover:text-indigo-700 text-gray-700"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
          <div className="pt-6 mt-6 border-t border-gray-200">
            <form action="/api/auth/signout" method="post">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start gap-2 text-gray-700 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
} 