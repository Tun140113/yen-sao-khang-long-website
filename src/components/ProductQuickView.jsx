import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Plus, Minus, Eye, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VariantSelector from "./VariantSelector";
import { Label } from "@/components/ui/label"; // Assuming you have a Label component

export default function ProductQuickView({ product, isOpen, onClose }) {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedPackaging, setSelectedPackaging] = useState("");

  // Reset states when product changes or dialog opens/closes
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelectedImage(0);
      // Initialize selected variant/packaging if they exist and have default
      if (product.variants?.length > 0) {
        setSelectedVariant(product.variants[0]?.name || "");
      } else {
        setSelectedVariant("");
      }
      if (product.packaging_options?.length > 0) {
        setSelectedPackaging(product.packaging_options[0]?.name || "");
      } else {
        setSelectedPackaging("");
      }
    }
  }, [isOpen, product]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => base44.entities.Review.filter({ product_id: product.id, status: "approved" }),
    enabled: !!product?.id
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  const calculateFinalPrice = () => {
    let finalPrice = product.price || 0;
    
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.name === selectedVariant);
      if (variant) finalPrice += (variant.price_adjustment || 0);
    }
    
    if (selectedPackaging && product.packaging_options) {
      const packaging = product.packaging_options.find(p => p.name === selectedPackaging);
      if (packaging) finalPrice += (packaging.price_adjustment || 0);
    }
    
    return finalPrice;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const addToCart = () => {
    if (!product) return;

    // Validate selections
    if (product.variants?.length > 0 && !selectedVariant) {
      toast.error("Vui lòng chọn vị sản phẩm.");
      return;
    }
    if (product.packaging_options?.length > 0 && !selectedPackaging) {
      toast.error("Vui lòng chọn nhóm sản phẩm.");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const finalPrice = calculateFinalPrice();

    // Generate a unique identifier for the cart item, including variant/packaging
    const cartItemId = `${product.id}-${selectedVariant || ''}-${selectedPackaging || ''}`;

    const existingItemIndex = cart.findIndex(item => item.cartItemId === cartItemId);
    
    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        cartItemId: cartItemId, // Unique ID for this specific configuration
        id: product.id,
        name: product.name,
        price: finalPrice,
        image_url: product.image_url,
        quantity: quantity,
        variant: selectedVariant || null,
        packaging: selectedPackaging || null,
        variantDisplay: selectedVariant || null,
        packagingDisplay: selectedPackaging || null
      });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    
    toast.success("Đã thêm vào giỏ hàng!", {
      description: `${product.name}${selectedVariant ? ` - ${selectedVariant}` : ''}${selectedPackaging ? ` (${selectedPackaging})` : ''}`,
      duration: 3000,
      action: {
        label: "Xem giỏ hàng",
        onClick: () => {
          onClose();
          navigate(createPageUrl("Cart"));
        }
      }
    });
    
    onClose();
  };

  // Ensure selectedImage is always valid (must be before early return)
  useEffect(() => {
    if (!product) return;
    const imgs = [product.image_url, ...(product.images || [])].filter(Boolean);
    if (selectedImage >= imgs.length) {
      setSelectedImage(0);
    }
  }, [product, selectedImage]);

  if (!product) return null;

  let images = [product.image_url, ...(product.images || [])].filter(Boolean);
  
  // Add variant image if selected and it has one
  if (selectedVariant && product.variants) {
    const variant = product.variants.find(v => v.name === selectedVariant);
    if (variant?.image_url && !images.includes(variant.image_url)) {
      images = [variant.image_url, ...images];
      if (selectedImage !== 0) setSelectedImage(0); 
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#4A3F35]">Xem Nhanh Sản Phẩm</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm mb-3 border border-white/30">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/50">
                  <span className="text-9xl text-[#D4AF37]/30">燕</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? "border-[#D4AF37] scale-105" : "border-transparent opacity-60 bg-white/50 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <Badge className="bg-[#F5E6D3]/80 text-[#D4AF37] mb-2 px-3 py-1 text-sm font-semibold">
                {product.category?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <h2 className="text-3xl font-bold text-[#4A3F35] mb-3">{product.name}</h2>
              
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(averageRating)
                            ? "text-[#D4AF37] fill-[#D4AF37]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-[#6B5742]">
                    {averageRating.toFixed(1)} ({reviews.length} đánh giá)
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-4xl font-bold text-[#D4AF37]">
                  {formatPrice(calculateFinalPrice())}
                  {product.weight && (
                    <span className="text-lg text-[#6B5742] ml-2">/ {product.weight}</span>
                  )}
                </p>
                {(selectedVariant || selectedPackaging) && product.price !== calculateFinalPrice() && (
                  <p className="text-sm text-gray-400 line-through mt-1">{formatPrice(product.price)}</p>
                )}
              </div>
              
              <p className="text-[#6B5742] leading-relaxed mb-4">
                {product.description || "Sản phẩm yến sào chất lượng cao"}
              </p>

              {/* Variant & Packaging Selection */}
              <VariantSelector
                product={product}
                selectedVariant={selectedVariant}
                selectedPackaging={selectedPackaging}
                onVariantChange={setSelectedVariant}
                onPackagingChange={setSelectedPackaging}
              />

              {/* Quantity */}
              <div className="mt-4">
                <Label className="block mb-2 text-sm font-semibold text-[#4A3F35]">Số Lượng</Label>
                <div className="flex items-center border-2 border-[#F5E6D3] rounded-full bg-white/50 backdrop-blur-md w-fit shadow-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="rounded-full hover:bg-[#F5E6D3]/50"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-[#4A3F35]">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    className="rounded-full hover:bg-[#F5E6D3]/50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {product.stock !== null && (
                <p className="text-sm text-[#6B5742] mt-2">
                  Còn lại: <span className="font-semibold text-[#D4AF37]">{product.stock}</span> sản phẩm
                </p>
              )}

              {/* Additional Info */}
              {product.ingredients && (
                <div className="mt-6 p-4 bg-gradient-to-br from-[#F8F5F0]/50 to-[#F5E6D3]/50 backdrop-blur-sm rounded-xl border border-white/30">
                  <h4 className="font-semibold text-[#4A3F35] mb-2 text-sm">Thành phần:</h4>
                  <p className="text-sm text-[#6B5742]">{product.ingredients}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={addToCart}
                  className="flex-1 bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md text-white rounded-full py-6 hover:shadow-xl transition-all border border-white/20 text-lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Thêm Vào Giỏ
                </Button>
                <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} onClick={onClose}>
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#F5E6D3]/50 py-6 px-4 rounded-full shadow-lg"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}