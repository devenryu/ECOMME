'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ExternalLink, Pencil, Trash2, Archive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { StatusToggle } from '@/components/products/status-toggle';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'draft';
  template_type: 'minimal' | 'standard' | 'premium';
  image_url?: string;
  features: string[];
  slug: string;
  created_at: string;
  is_deleted?: boolean;
}

interface ProductsTableProps {
  initialProducts?: Product[];
}

export function ProductsTable({ initialProducts = [] }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const router = useRouter();

  // Filter products based on archived status
  const filteredProducts = products.filter(product => 
    showArchived ? product.is_deleted : !product.is_deleted
  );

  // Completely replace the initial products with fetched ones on load
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add a cache-busting query parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/products?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Set products from the API response
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    if (!productId) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      const result = await response.json();
      
      if (result.archived) {
        // Product was archived instead of deleted due to orders
        // Update the product in the list instead of removing it
        setProducts(currentProducts => 
          currentProducts.map(p => p.id === productId ? { ...p, is_deleted: true } : p)
        );
        
        // Show a notification or message about archiving instead of deleting
        setError(`"${products.find(p => p.id === productId)?.title}" was archived instead of deleted because it has orders.`);
      } else {
        // Product was fully deleted, remove from UI
        setProducts(currentProducts => 
          currentProducts.filter(p => p.id !== productId)
        );
      }
      
      // Wait a short time to ensure the delete has propagated
      setTimeout(async () => {
        // Then refetch to make sure we have the latest data
        await fetchProducts();
        
        // Reset delete state
        setDeleteProductId(null);
        
        // Force a refresh of the server components
        router.refresh();
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleArchive = async (productId: string, currentState: boolean) => {
    if (!productId) return;
    
    try {
      setIsArchiving(true);
      const action = currentState ? 'unarchive' : 'archive';
      
      const response = await fetch('/api/products/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          productId,
          action
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} product`);
      }
      
      // Optimistically update the UI
      setProducts(currentProducts => 
        currentProducts.map(p => p.id === productId ? { ...p, is_deleted: !currentState } : p)
      );
      
      // Fetch fresh data after a short delay
      setTimeout(() => {
        fetchProducts();
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-500 mt-2">
            Manage your product listings here.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
          <Button onClick={fetchProducts} variant="outline">
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts?.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className={cn(
                    product.is_deleted && "bg-gray-50 opacity-70"
                  )}
                >
                  <TableCell className="font-medium">
                    {product.title}
                    {product.is_deleted && (
                      <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        Archived
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(product.price, product.currency)}
                  </TableCell>
                  <TableCell>
                    {product.is_deleted ? (
                      <span className="text-gray-500">Inactive</span>
                    ) : (
                      <StatusToggle
                        product={product}
                        initialStatus={product.status}
                      />
                    )}
                  </TableCell>
                  <TableCell>{product.template_type}</TableCell>
                  <TableCell>
                    {new Date(product.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!product.is_deleted && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            asChild
                            title="View product page"
                          >
                            <Link href={`/p/${product.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            asChild
                            title="Edit product"
                          >
                            <Link href={`/dashboard/products/${product.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </>
                      )}
                      
                      {/* Archive/Unarchive button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={product.is_deleted ? 
                          "text-blue-500 hover:text-blue-700 hover:bg-blue-50" : 
                          "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                        }
                        title={product.is_deleted ? "Unarchive product" : "Archive product"}
                        onClick={() => handleToggleArchive(product.id, product.is_deleted || false)}
                        disabled={isArchiving}
                      >
                        {product.is_deleted ? 
                          <RefreshCw className="h-4 w-4" /> : 
                          <Archive className="h-4 w-4" />
                        }
                      </Button>
                      
                      {/* Delete button - only show if not archived */}
                      {!product.is_deleted && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete product"
                              onClick={() => setDeleteProductId(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{product.title}&quot;?
                                {"\n"}
                                If this product has orders, it will be archived instead of deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {showArchived ? (
                    <div className="flex flex-col items-center gap-2">
                      <Archive className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500">No archived products found</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-500">No products found. Click &quot;Add Product&quot; to create one.</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}