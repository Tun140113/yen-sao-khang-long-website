import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ProductQuickView from "./ProductQuickView";

export default function ProductCard({ product }) {
  const [showQuickView, setShowQuickView] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", product.id],
    queryFn: () => base44.entities.Review.filter({ product_id: product.id, status: "approved" }),
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        freeship: product.category_freeship || false
      });
    }
    
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    
    toast.success("Đã thêm vào giỏ hàng!", {
      description: product.name,
      duration: 3000,
    });
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="group h-full"
        >
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 bg-white h-full flex flex-col">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-amber-400" />
                </div>
              )}
              
              {/* Featured Badge */}
              {product.is_featured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3"
                >
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                    <Star className="w-3 h-3 fill-current mr-1" />
                    Nổi Bật
                  </Badge>
                </motion.div>
              )}
              
              {/* Quick View Button */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute top-3 left-3"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleQuickView}
                  className="bg-white/95 hover:bg-white shadow-lg h-10 w-10 rounded-full backdrop-blur-sm"
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </Button>
              </motion.div>
              
              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            {/* Content */}
            <CardContent className="p-4 sm:p-5 flex-1 flex flex-col">
              <Badge variant="outline" className="mb-3 text-xs font-medium text-amber-700 border-amber-300 bg-amber-50 w-fit">
                {product.category?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 min-h-[3rem]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {product.name}
              </h3>
              
              {/* Rating */}
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${
                          star <= Math.round(averageRating)
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {averageRating.toFixed(1)} ({reviews.length})
                  </span>
                </div>
              )}
              
              <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-1">
                {product.description || "Sản phẩm yến sào chất lượng cao"}
              </p>
              
              {/* Price & Action */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <div>
                  {product.category_freeship && (
                    <div className="mb-1">
                      <span style={{ background: "#38a169", color: "white", borderRadius: "4px", padding: "2px 6px", fontSize: "0.75em", fontWeight: "bold" }}>🚚 Freeship</span>
                    </div>
                  )}
                  {product.discount_type && product.discount_type !== "none" && product.discount_value ? (() => {
                    const orig = product.price;
                    const discounted = product.discount_type === "percentage"
                      ? orig - (orig * product.discount_value / 100)
                      : orig - product.discount_value;
                    return (
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ textDecoration: "line-through", color: "gray", fontSize: "0.85em" }}>{formatPrice(orig)}</span>
                          <span style={{ color: "red", fontWeight: "bold", fontSize: "1.1em" }}>{formatPrice(Math.max(0, discounted))}</span>
                        </div>
                        <div className="mt-1">
                          {product.discount_type === "percentage" ? (
                            <span style={{ background: "#ff4d4d", color: "white", borderRadius: "4px", padding: "2px 6px", fontSize: "0.75em", fontWeight: "bold" }}>-{product.discount_value}%</span>
                          ) : (
                            <span style={{ color: "#e67e00", fontSize: "0.8em" }}>💰 Tiết kiệm {formatPrice(product.discount_value)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {formatPrice(product.price)}
                    </p>
                  )}
                  {product.weight && (
                    <p className="text-xs text-gray-500 mt-0.5">{product.weight}</p>
                  )}
                  </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={addToCart}
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-full px-4 sm:px-5 shadow-lg"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                    Thêm
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>

      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
}