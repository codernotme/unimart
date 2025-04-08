"use client";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, Share2, Star } from "lucide-react";

import { Button } from "@heroui/react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const product = useQuery(api.products.getProductById, {
    productId: productId as Id<"products">,
  }) as {
    colors: never[];
    reviews: number;
    _id: Id<"products">;
    id?: string;
    name?: string;
    price?: number;
    originalPrice?: number;
    imageUrls?: string[];
    rating?: number;
    ratingCount?: number;
    inStock?: boolean;
    isNew?: boolean;
    isFeatured?: boolean;
    isSale?: boolean;
    category?: string;
    school?: string;
    description?: string;
    sizes?: string[];
    gender?: "boy" | "girl" | "unisex";
    classLevel?: string;
    stock?: number;
    allowCustomSize?: boolean;
  } | null;

  if (!product) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/schools/1`}
          className="flex items-center text-sm text-default-500 hover:text-primary"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to {product.school}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-default-100">
            <Image
              src={product.imageUrls?.[0] || "/placeholder.svg"}
              alt={product.name || "Product Image"}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.imageUrls?.map((image, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg border bg-default-100 cursor-pointer"
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} - Image ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <p className="text-sm text-default-500 mb-1">{product.category}</p>
            <h1 className="text-3xl font-bold text-default-900">
              {product.name}
            </h1>
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating ?? 0)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-default-200 text-default-200"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-default-500">
                {product.rating} ({product.reviews ?? 0} reviews)
              </span>
            </div>
            <p className="text-2xl font-bold mt-4 text-primary">
              £{product.price?.toFixed(2)}
            </p>
          </div>
          <Separator className="my-6" />
          <AddToCartForm
            product={{
              ...product,
              id: product._id.toString(),
              sizes: product.sizes || [],
              colors: product.colors || [],
              name: product.name || "Unnamed Product",
              price: product.price ?? 0,
              school: product.school || "Unknown School",
            }}
          />

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-default-600">School: {product.school}</p>
            <Button variant="light" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
          <TabsTrigger
            value="description"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
          >
            Description
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
          >
            Details & Care
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary h-10"
          >
            Reviews ({product.reviews})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="pt-4">
          <p className="text-default-600">{product.description}</p>
        </TabsContent>
        <TabsContent value="details" className="pt-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-default-900">Materials</h3>
              <p className="text-default-600">65% Polyester, 35% Viscose</p>
            </div>
            <div>
              <h3 className="font-medium text-default-900">
                Care Instructions
              </h3>
              <ul className="list-disc list-inside text-default-600">
                <li>Machine washable at 40°C</li>
                <li>Do not bleach</li>
                <li>Iron on medium heat</li>
                <li>Do not tumble dry</li>
                <li>Dry clean if necessary</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-default-900">Features</h3>
              <ul className="list-disc list-inside text-default-600">
                <li>Embroidered school logo on breast pocket</li>
                <li>Two front pockets</li>
                <li>Fully lined</li>
                <li>Button fastening</li>
              </ul>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="reviews" className="pt-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-default-900">
                  Customer Reviews
                </h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating ?? 0)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-default-200 text-default-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-default-500">
                    Based on {product.reviews} reviews
                  </span>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary-dark">
                Write a Review
              </Button>
            </div>

            <Separator />

            {/* Sample reviews */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-default-900">Jane Doe</h4>
                  <span className="text-sm text-default-500">2 weeks ago</span>
                </div>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${
                        j < 4 + (i % 2)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-default-200 text-default-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-default-600">
                  Great quality blazer. Fits well and looks smart. My child is
                  very happy with it.
                </p>
                <Separator />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/*<div>
        <h2 className="text-2xl font-bold mb-6 text-default-900">
          You May Also Like
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>*/}
    </div>
  );
}
