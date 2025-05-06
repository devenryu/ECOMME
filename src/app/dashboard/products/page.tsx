import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ProductsTable } from "@/components/products/products-table";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "Products - Dashboard",
  description: "Manage your products",
};

export default async function ProductsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch initial products server-side with cache busting
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return <ProductsTable initialProducts={products || []} />;
} 