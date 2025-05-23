"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Upload,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { GenericId } from "convex/values";
import imageCompression from "browser-image-compression";
import { useUser } from "@clerk/nextjs";

export default function ProductsPage() {
  const products = useQuery(api.products.getAll) || [];
  const schools = useQuery(api.schools.getAll) || [];
  const categories = useQuery(api.categories.getAllCategories) || [];
  const addProduct = useMutation(api.products.add);
  const updateProduct = useMutation(api.products.modify);
  const deleteProduct = useMutation(api.products.remove);
  const notify = useMutation(api.notifications.add);
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<null | (typeof products)[0]>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Extended form state to cover all product attributes
  const [formState, setFormState] = useState({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    stock: "",
    description: "",
    schoolId: "",
    inStock: true,
    isNew: false,
    isFeatured: false,
    isSale: false,
    sizes: [] as string[],
    gender: "unisex" as "boy" | "girl" | "unisex",
    classLevel: "",
    allowCustomSize: false,
    detailsAndCare: {
      materials: "",
      careInstructions: [] as string[],
      additionalInfo: ""
    }
  });

  const handleInputChange = (e: { target: { name: string; value: any; type?: string; checked?: boolean } }) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormState((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSizeToggle = (size: string) => {
    setFormState(prev => {
      const sizes = [...prev.sizes];
      if (sizes.includes(size)) {
        return { ...prev, sizes: sizes.filter(s => s !== size) };
      } else {
        return { ...prev, sizes: [...sizes, size] };
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Image compression failed:", error);
      }
    }
  };

  const openAddProductModal = () => {
    setIsNewProduct(true);
    setSelectedProduct(null);
    setFormState({
      name: "",
      price: "",
      originalPrice: "",
      category: "",
      stock: "",
      description: "",
      schoolId: "",
      inStock: true,
      isNew: true,
      isFeatured: false,
      isSale: false,
      sizes: [],
      gender: "unisex",
      classLevel: "",
      allowCustomSize: false,
      detailsAndCare: {
        materials: "",
        careInstructions: [],
        additionalInfo: ""
      }
    });
    setSelectedImage(null);
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: (typeof products)[0]) => {
    setIsNewProduct(false);
    setSelectedProduct(product);
    setFormState({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || "",
      category: product.category || "",
      stock: product.stock.toString(),
      description: product.description,
      schoolId: product.schoolId,
      inStock: product.inStock !== undefined ? product.inStock : true,
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
      isSale: product.isSale || false,
      sizes: product.sizes || [],
      gender: product.gender,
      classLevel: product.classLevel || "",
      allowCustomSize: product.allowCustomSize,
      detailsAndCare: {
        materials: product.detailsAndCare?.materials || "",
        careInstructions: product.detailsAndCare?.careInstructions || [],
        additionalInfo: product.detailsAndCare?.additionalInfo || ""
      }
    });
    setSelectedImage(product.imageUrls[0] || null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      // Prepare imageUrls array
      let imageUrls: string[] = [];
      if (selectedImage) {
        imageUrls = [selectedImage];
      }

      const productData = {
        id: crypto.randomUUID(), // Generate a unique ID for the product
        name: formState.name,
        price: parseFloat(formState.price),
        originalPrice: formState.originalPrice ? parseFloat(formState.originalPrice) : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : [],
        inStock: formState.inStock,
        isNew: formState.isNew,
        isFeatured: formState.isFeatured,
        isSale: formState.isSale,
        category: formState.category || undefined,
        description: formState.description || "",
        detailsAndCare: {
          materials: formState.detailsAndCare.materials || undefined,
          careInstructions: formState.detailsAndCare.careInstructions.length > 0 
            ? formState.detailsAndCare.careInstructions 
            : undefined,
          additionalInfo: formState.detailsAndCare.additionalInfo || undefined
        },
        sizes: formState.sizes.length > 0 ? formState.sizes : undefined,
        gender: formState.gender,
        classLevel: formState.classLevel || "",
        stock: parseInt(formState.stock, 10),
        allowCustomSize: formState.allowCustomSize,
        schoolId: formState.schoolId as GenericId<"schools"> || "",
        ...(isNewProduct ? { createdAt: Date.now() } : {}),
      };

      if (isNewProduct) {
        await addProduct({ 
          ...productData, 
          sizes: productData.sizes || [], 
          schoolId: productData.schoolId as GenericId<"schools">, 
          createdAt: productData.createdAt || Date.now() 
        });
      } else if (selectedProduct) {
        await updateProduct({ productId: selectedProduct._id, ...productData });
        if (user) {
          await notify({ userId: user.id as GenericId<"users">, message: "Product updated successfully!", type: "success" });
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save product:", error);
      if (user) {
        await notify({ userId: user.id as GenericId<"users">, message: "Failed to save product. Please try again.", type: "error" });
      }
    }
  };

  const handleDeleteProduct = async (productId: GenericId<"products">) => {
    await deleteProduct({ productId });
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Available sizes for the size selector
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <Button className="w-full sm:w-auto" onClick={openAddProductModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>
                Manage your product catalog and inventory levels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                  <Button type="submit" size="icon" variant="ghost">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead>On Sale</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          {product.imageUrls && product.imageUrls[0] && (
                            <div className="h-10 w-10 relative overflow-hidden rounded">
                              <img 
                                src={product.imageUrls[0]} 
                                alt={product.name}
                                className="object-cover h-full w-full"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category || "N/A"}</TableCell>
                        <TableCell>₹{product.price.toFixed(2)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={product.isFeatured || false}
                              onCheckedChange={async (checked) => {
                                await updateProduct({
                                  productId: product._id,
                                  isFeatured: checked === true
                                });
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={product.inStock !== false} 
                              onCheckedChange={async (checked) => {
                                await updateProduct({
                                  productId: product._id,
                                  inStock: checked === true
                                });
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Checkbox 
                              checked={product.isSale || false}
                              onCheckedChange={async (checked) => {
                                await updateProduct({
                                  productId: product._id,
                                  isSale: checked === true
                                });
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEditProductModal(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600" 
                              onClick={() => handleDeleteProduct(product._id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Management Modal */}
      <Modal isOpen={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)} size="3xl">
        <ModalContent className="max-h-[90vh] flex flex-col">
          <>
            <ModalHeader className="sticky top-0 z-10 bg-background border-b">
              <h3 className="text-xl font-semibold">
                {isNewProduct ? "Add New Product" : "Edit Product"}
              </h3>
            </ModalHeader>
            <ModalBody className="overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-4">
                {/* Left column - Basic info */}
                <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleInputChange}
                        placeholder="Product name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          value={formState.price}
                          onChange={handleInputChange}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="originalPrice">Original Price (₹)</Label>
                        <Input
                          id="originalPrice"
                          name="originalPrice"
                          type="number"
                          value={formState.originalPrice}
                          onChange={handleInputChange}
                          placeholder="0.00 (for discounts)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          name="category"
                          value={formState.category}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select category</option>
                          {categories?.map((category) => (
                            <option key={category._id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          name="stock"
                          type="number"
                          value={formState.stock}
                          onChange={handleInputChange}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="school">School</Label>
                      <select
                        id="school"
                        name="schoolId"
                        value={formState.schoolId}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select a school</option>
                        {schools?.map((school) => (
                          <option key={school._id} value={school._id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="classLevel">Class Level</Label>
                      <Input
                        id="classLevel"
                        name="classLevel"
                        value={formState.classLevel}
                        onChange={handleInputChange}
                        placeholder="e.g., Primary, Secondary"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="gender"
                            value="boy"
                            checked={formState.gender === "boy"}
                            onChange={handleInputChange}
                          />
                          Boy
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="gender"
                            value="girl"
                            checked={formState.gender === "girl"}
                            onChange={handleInputChange}
                          />
                          Girl
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="gender"
                            value="unisex"
                            checked={formState.gender === "unisex"}
                            onChange={handleInputChange}
                          />
                          Unisex
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <textarea
                        id="description"
                        name="description"
                        value={formState.description}
                        onChange={handleInputChange}
                        className="w-full min-h-[80px] max-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Product description"
                      ></textarea>
                    </div>
                    
                    <div>
                      <Label>Details & Care</Label>
                      <div className="space-y-2 mt-2">
                        <div>
                          <Label htmlFor="materials" className="text-sm">Materials</Label>
                          <Input
                            id="materials"
                            value={formState.detailsAndCare.materials}
                            onChange={(e) => setFormState(prev => ({
                              ...prev,
                              detailsAndCare: {
                                ...prev.detailsAndCare,
                                materials: e.target.value
                              }
                            }))}
                            placeholder="e.g., 65% Polyester, 35% Viscose"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="careInstructions" className="text-sm">Care Instructions</Label>
                          <textarea
                            id="careInstructions"
                            value={formState.detailsAndCare.careInstructions.join('\n')}
                            onChange={(e) => setFormState(prev => ({
                              ...prev,
                              detailsAndCare: {
                                ...prev.detailsAndCare,
                                careInstructions: e.target.value.split('\n').filter(line => line.trim() !== '')
                              }
                            }))}
                            className="w-full min-h-[60px] max-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Enter one instruction per line, e.g.&#10;Machine washable at 40°C&#10;Do not bleach"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="additionalInfo" className="text-sm">Additional Information</Label>
                          <textarea
                            id="additionalInfo"
                            value={formState.detailsAndCare.additionalInfo}
                            onChange={(e) => setFormState(prev => ({
                              ...prev,
                              detailsAndCare: {
                                ...prev.detailsAndCare,
                                additionalInfo: e.target.value
                              }
                            }))}
                            className="w-full min-h-[60px] max-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Any additional product information"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column - Product attributes */}
                  <div className="space-y-3">
                    <div>
                      <Label>Product Image</Label>
                      <div className="mt-2">
                        <Input id="image" type="file" onChange={handleImageUpload} />
                        {selectedImage && (
                          <div className="mt-2 relative">
                            <img
                              src={selectedImage}
                              alt="Product preview"
                              className="h-40 w-auto object-contain border rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Product Status</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <label className="flex items-center gap-2">
                          <Checkbox
                            name="inStock"
                            checked={formState.inStock}
                            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, inStock: checked === true }))}
                          />
                          In Stock
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            name="isNew"
                            checked={formState.isNew}
                            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isNew: checked === true }))}
                          />
                          New Arrival
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            name="isFeatured"
                            checked={formState.isFeatured}
                            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isFeatured: checked === true }))}
                          />
                          Featured
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            name="isSale"
                            checked={formState.isSale}
                            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, isSale: checked === true }))}
                          />
                          On Sale
                        </label>
                        <label className="flex items-center gap-2">
                          <Checkbox
                            name="allowCustomSize"
                            checked={formState.allowCustomSize}
                            onCheckedChange={(checked) => setFormState(prev => ({ ...prev, allowCustomSize: checked === true }))}
                          />
                          Allow Custom Size
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label>Available Sizes</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                        {availableSizes.map((size) => (
                          <label key={size} className="flex items-center gap-2">
                            <Checkbox
                              checked={formState.sizes.includes(size)}
                              onCheckedChange={() => handleSizeToggle(size)}
                            />
                            {size}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                  </ModalBody>
                </>
              <ModalFooter className="sticky bottom-0 z-10 bg-background border-t mt-auto">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct}>
                  {isNewProduct ? "Add Product" : "Save Changes"}
                </Button>
              </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
