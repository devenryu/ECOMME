import { ProductForm } from "@/components/products/product-form";

export const metadata = {
  title: "New Product - Dashboard",
  description: "Create a new product",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Product</h1>
        <p className="text-gray-500 mt-2">
          Fill out the form below to create a new product.
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <ProductForm />
      </div>
    </div>
  );
} 