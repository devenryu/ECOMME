'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  Archive, 
  RefreshCw, 
  Filter, 
  Search, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ArrowUpDown,
  CheckSquare,
  Square,
  MoreHorizontal,
  Tag,
  Check
} from 'lucide-react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  view_count?: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'title' | 'price' | 'status' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [batchActionInProgress, setBatchActionInProgress] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const router = useRouter();

  // Filter products based on archived status and search term
  const filteredProducts = products
    .filter(product => showArchived ? product.is_deleted : !product.is_deleted)
    .filter(product => 
      searchTerm === '' || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortField === 'price') {
        return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
      } else if (sortField === 'created_at') {
        return sortDirection === 'asc' 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortField === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortField === 'status') {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      return 0;
    });

  // Effect to clear selected products when toggling between archived/active views
  useEffect(() => {
    setSelectedProducts([]);
    setIsAllSelected(false);
  }, [showArchived]);

  // Check if all products are selected
  useEffect(() => {
    if (filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length) {
      setIsAllSelected(true);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedProducts, filteredProducts]);

  // Helper to toggle selection of all products
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  // Helper to toggle selection of a single product
  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

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

  // Batch Actions
  const handleBatchArchive = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      setBatchActionInProgress(true);
      setError(null);
      
      const action = showArchived ? 'unarchive' : 'archive';
      const response = await fetch('/api/products/batch-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          action
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to batch ${action} products`);
      }
      
      // Optimistically update UI
      setProducts(currentProducts => 
        currentProducts.map(p => 
          selectedProducts.includes(p.id) 
            ? { ...p, is_deleted: !showArchived } 
            : p
        )
      );
      
      setSelectedProducts([]);
      
      // Show success message
      setError(`Successfully ${action}d ${selectedProducts.length} product(s)`);
      
      // Fetch fresh data after a delay
      setTimeout(() => {
        fetchProducts();
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBatchActionInProgress(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      setBatchActionInProgress(true);
      setError(null);
      
      const response = await fetch('/api/products/batch-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete products');
      }
      
      const result = await response.json();
      
      // Handle mixed results (some deleted, some archived)
      if (result.archivedCount > 0 && result.deletedCount > 0) {
        setError(`Deleted ${result.deletedCount} product(s) and archived ${result.archivedCount} product(s) that had orders.`);
      } else if (result.archivedCount > 0) {
        setError(`All ${result.archivedCount} product(s) were archived instead of deleted because they have orders.`);
      } else {
        setError(`Successfully deleted ${result.deletedCount} product(s).`);
      }
      
      // Update UI - remove deleted products, mark archived ones
      setProducts(currentProducts => 
        currentProducts.filter(p => {
          // If in deleted list, remove from UI
          if (result.deletedIds?.includes(p.id)) {
            return false;
          }
          
          // If in archived list, mark as archived
          if (result.archivedIds?.includes(p.id)) {
            p.is_deleted = true;
          }
          
          return true;
        })
      );
      
      setSelectedProducts([]);
      setShowBatchDeleteConfirm(false);
      
      // Fetch fresh data after a delay
      setTimeout(() => {
        fetchProducts();
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBatchActionInProgress(false);
    }
  };

  const handleBatchUpdateStatus = async (status: 'active' | 'inactive' | 'draft') => {
    if (selectedProducts.length === 0) return;
    
    try {
      setBatchActionInProgress(true);
      setError(null);
      
      const response = await fetch('/api/products/batch-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          status
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update product status`);
      }
      
      // Optimistically update UI
      setProducts(currentProducts => 
        currentProducts.map(p => 
          selectedProducts.includes(p.id) 
            ? { ...p, status } 
            : p
        )
      );
      
      // Show success message
      setError(`Successfully updated ${selectedProducts.length} product(s) to ${status}`);
      
      // Fetch fresh data after a delay
      setTimeout(() => {
        fetchProducts();
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBatchActionInProgress(false);
      setSelectedProducts([]);
    }
  };

  const handleSort = (field: 'title' | 'price' | 'status' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'title' | 'price' | 'status' | 'created_at') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronDown className="h-4 w-4 ml-1 text-indigo-600" /> : 
      <ChevronDown className="h-4 w-4 ml-1 text-indigo-600 rotate-180" />;
  };

  // Helper to get batch action button state
  const getBatchActionButtonProps = (disabled = false) => ({
    disabled: selectedProducts.length === 0 || batchActionInProgress || disabled,
    className: selectedProducts.length === 0 ? "opacity-50 cursor-not-allowed" : ""
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">
              Manage and organize your product catalog
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              {showArchived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
            <Button 
              onClick={fetchProducts} 
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link href="/dashboard/products/new" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex-1">{error}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-amber-800 hover:text-amber-900 hover:bg-amber-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center text-sm text-gray-500 ml-auto">
              <span>{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        
        {/* Batch actions toolbar */}
        {selectedProducts.length > 0 && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-between">
            <div className="flex items-center text-indigo-700 text-sm font-medium">
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProducts([])}
                className="text-indigo-700 border-indigo-200 hover:bg-indigo-100"
              >
                Deselect All
              </Button>
              
              {!showArchived ? (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        {...getBatchActionButtonProps()}
                        className="text-indigo-700 border-indigo-200 hover:bg-indigo-100 gap-2"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        Set Status
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0">
                      <div className="py-1">
                        <button
                          onClick={() => handleBatchUpdateStatus('active')}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          disabled={batchActionInProgress}
                        >
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2 flex-shrink-0"></span>
                          Set Active
                        </button>
                        <button
                          onClick={() => handleBatchUpdateStatus('inactive')}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          disabled={batchActionInProgress}
                        >
                          <span className="h-2 w-2 rounded-full bg-red-500 mr-2 flex-shrink-0"></span>
                          Set Inactive
                        </button>
                        <button
                          onClick={() => handleBatchUpdateStatus('draft')}
                          className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                          disabled={batchActionInProgress}
                        >
                          <span className="h-2 w-2 rounded-full bg-amber-500 mr-2 flex-shrink-0"></span>
                          Set Draft
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBatchArchive}
                    {...getBatchActionButtonProps(batchActionInProgress)}
                    className="text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 gap-2"
                    
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </Button>
                  
                  <AlertDialog open={showBatchDeleteConfirm} onOpenChange={setShowBatchDeleteConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        {...getBatchActionButtonProps(batchActionInProgress)}
                        className="text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedProducts.length} products?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the selected products. Products with orders will be archived instead.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={batchActionInProgress}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handleBatchDelete();
                          }}
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                          disabled={batchActionInProgress}
                        >
                          {batchActionInProgress ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  {...getBatchActionButtonProps(batchActionInProgress)}
                  onClick={handleBatchArchive}
                  className="text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restore
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10">
                  <button 
                    className="flex items-center justify-center hover:text-indigo-600 transition-colors focus:outline-none"
                    onClick={toggleSelectAll}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-indigo-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="font-medium">
                  <button 
                    className="flex items-center hover:text-indigo-600 transition-colors focus:outline-none"
                    onClick={() => handleSort('title')}
                  >
                    Title
                    {getSortIcon('title')}
                  </button>
                </TableHead>
                <TableHead className="font-medium">
                  <button 
                    className="flex items-center hover:text-indigo-600 transition-colors focus:outline-none"
                    onClick={() => handleSort('price')}
                  >
                    Price
                    {getSortIcon('price')}
                  </button>
                </TableHead>
                <TableHead className="font-medium">
                  <button 
                    className="flex items-center hover:text-indigo-600 transition-colors focus:outline-none"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </TableHead>
                <TableHead className="font-medium">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">View Count</span>
                  </div>
                </TableHead>
                <TableHead className="font-medium">Template</TableHead>
                <TableHead className="font-medium">
                  <button 
                    className="flex items-center hover:text-indigo-600 transition-colors focus:outline-none"
                    onClick={() => handleSort('created_at')}
                  >
                    Created
                    {getSortIcon('created_at')}
                  </button>
                </TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex justify-center">
                      <RefreshCw className="h-5 w-5 text-indigo-600 animate-spin" />
                    </div>
                    <p className="text-gray-500 mt-2">Loading products...</p>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    {searchTerm ? (
                      <div>
                        <p className="text-gray-500 font-medium">No matching products found</p>
                        <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
                      </div>
                    ) : showArchived ? (
                      <div>
                        <p className="text-gray-500 font-medium">No archived products found</p>
                        <p className="text-gray-400 text-sm mt-1">When you archive products, they'll appear here</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 font-medium">No products found</p>
                        <p className="text-gray-400 text-sm mt-1">Get started by adding your first product</p>
                        <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                          <Link href="/dashboard/products/new" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Product
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(product => (
                  <TableRow 
                    key={product.id} 
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      selectedProducts.includes(product.id) && "bg-indigo-50",
                      product.is_deleted && "bg-gray-50/50"
                    )}
                  >
                    <TableCell>
                      <button 
                        className="flex items-center justify-center focus:outline-none"
                        onClick={() => toggleSelectProduct(product.id)}
                      >
                        {selectedProducts.includes(product.id) ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {product.image_url ? (
                          <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            <img 
                              src={product.image_url} 
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                            {product.title.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(product.price, product.currency)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!product.is_deleted ? (
                        <StatusToggle 
                          productId={product.id} 
                          initialStatus={product.status} 
                          onStatusChange={(productId, newStatus) => {
                            setProducts(currentProducts => 
                              currentProducts.map(p => p.id === productId ? { ...p, status: newStatus } : p)
                            );
                          }}
                        />
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                          Archived
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{product.view_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                        product.template_type === 'premium' && "bg-purple-100 text-purple-800",
                        product.template_type === 'standard' && "bg-blue-100 text-blue-800",
                        product.template_type === 'minimal' && "bg-gray-100 text-gray-800"
                      )}>
                        {product.template_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/p/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <ExternalLink className="h-5 w-5" />
                          <span className="sr-only">View Product</span>
                        </Link>
                        
                        {!product.is_deleted ? (
                          <>
                            <Link
                              href={`/dashboard/products/${product.id}`}
                              className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Pencil className="h-5 w-5" />
                              <span className="sr-only">Edit Product</span>
                            </Link>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="p-1 h-auto rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  onClick={() => setDeleteProductId(product.id)}
                                >
                                  <Trash2 className="h-5 w-5" />
                                  <span className="sr-only">Delete Product</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{product.title}". This action cannot be undone.
                                    {/* Note: If product has orders, it will be archived instead. */}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteProduct(product.id);
                                    }}
                                  >
                                    {isDeleting && deleteProductId === product.id ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="p-1 h-auto rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              disabled={isArchiving}
                              onClick={() => handleToggleArchive(product.id, false)}
                            >
                              <Archive className="h-5 w-5" />
                              <span className="sr-only">Archive</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="p-1 h-auto rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            disabled={isArchiving}
                            onClick={() => handleToggleArchive(product.id, true)}
                          >
                            <RefreshCw className="h-5 w-5" />
                            <span className="sr-only">Restore</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}