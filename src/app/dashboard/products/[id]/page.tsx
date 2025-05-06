import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";

export const metadata = {
  title: "Edit Product - Dashboard",
  description: "Edit your product",
};

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    notFound();
  }

  // Fetch product data
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .eq("seller_id", session.user.id)
    .single();

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-gray-500 mt-2">
          Update your product information below.
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <ProductForm initialData={product} />
      </div>
    </div>
  );
} 