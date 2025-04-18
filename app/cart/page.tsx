"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CartItemDetails } from "@/components/cart-item-details";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<
    {
      size?: string;
      customSize?: {
        chest?: number;
        waist?: number;
        height?: number;
        notes?: string;
      };
      productId: string;
      quantity: number;
      price: number;
      name: string;
      image?: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const getCart = useQuery(api.carts.getCart, {});
  const addItem = useMutation(api.carts.addItem);
  const updateItem = useMutation(api.carts.updateItem);
  const removeItem = useMutation(api.carts.removeItem);
  const clearCart = useMutation(api.carts.clearCart);

  useEffect(() => {
    setIsLoading(true);
    try {
      if (getCart) {
        // Make sure items is an array
        const items = getCart.items || [];
        
        setCartItems(
          items.map((item) => ({
            ...item,
            price: item.price || 0,
            name: item.name || "Unknown Product",
            image: item.image || "/images/placeholder.webp",
          }))
        );
        setError(null);
      }
    } catch (err) {
      console.error("Error loading cart:", err);
      setError("Failed to load your cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [getCart]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const item = cartItems.find((item) => item.productId === id);
      if (item) {
        await updateItem({ productId: id as Id<"products">, quantity: newQuantity });
        setCartItems(
          cartItems.map((item) =>
            item.productId === id ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("Failed to update quantity. Please try again.");
    }
  };

  const removeItemFromCart = async (id: string) => {
    try {
      await removeItem({ productId: id as Id<"products"> });
      setCartItems(cartItems.filter((item) => item.productId !== id));
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item. Please try again.");
    }
  };

  const clearCartItems = async () => {
    try {
      await clearCart();
      setCartItems([]);
    } catch (err) {
      console.error("Error clearing cart:", err);
      alert("Failed to clear cart. Please try again.");
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const shipping = 4.99;
  const total = subtotal + shipping;

  return (
    <div className="container px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-indigo-900 dark:text-indigo-400">
        Your Cart
      </h1>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-400">
            Loading your cart...
          </h2>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-500">
            {error}
          </h2>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/schools">Continue Shopping</Link>
          </Button>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-400">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/schools">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-indigo-50 dark:bg-indigo-950 px-4 py-3 font-medium text-indigo-900 dark:text-indigo-300">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>
              </div>

              {cartItems.map((item) => (
                <div key={item.productId} className="px-4 py-4 border-t">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <div className="flex items-center">
                        <div className="relative w-16 h-16 rounded overflow-hidden mr-4">
                          <Image
                            src={item.image || "/images/placeholder.webp"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-indigo-900 dark:text-indigo-300">
                            {item.name}
                          </h3>
                          <CartItemDetails item={{...item, productId: item.productId as Id<"products">}} />
                          <button
                            onClick={() => removeItemFromCart(item.productId)}
                            className="text-sm text-red-500 flex items-center mt-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      ₹{item.price.toFixed(2)}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-indigo-200"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Decrease quantity</span>
                        </Button>
                        <div className="w-10 h-8 flex items-center justify-center border-y border-indigo-200">
                          {item.quantity}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-indigo-200"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Increase quantity</span>
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-medium text-indigo-900 dark:text-indigo-300">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Link
                href="/schools"
                className="flex items-center text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Continue Shopping
              </Link>
              <Button
                variant="outline"
                onClick={clearCartItems}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
              >
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-indigo-900 dark:text-indigo-400">
                Order Summary
              </h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-indigo-900 dark:text-indigo-300">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-indigo-900 dark:text-indigo-300">
                    ₹{shipping.toFixed(2)}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold mb-6">
                <span className="text-indigo-900 dark:text-indigo-300">
                  Total
                </span>
                <span className="text-indigo-700 dark:text-indigo-400">
                  ₹{total.toFixed(2)}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="coupon"
                    className="text-sm font-medium mb-1 block text-indigo-900 dark:text-indigo-300"
                  >
                    Coupon Code
                  </label>
                  <div className="flex">
                    <Input
                      id="coupon"
                      placeholder="Enter coupon"
                      className="rounded-r-none"
                    />
                    <Button
                      variant="outline"
                      className="rounded-l-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                  asChild
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
