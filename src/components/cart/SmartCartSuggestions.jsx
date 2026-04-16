import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function SmartCartSuggestions({ cartItems, onAddToCart }) {
  const { data: products = [] } = useQuery({
    queryKey: ["products-suggestions"],
    queryFn: () => base44.entities.Product.list("-popularity_score"),
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ["active-vouchers"],
    queryFn: () => base44.entities.Voucher.filter({ is_active: true }),
  });

  // Get products not in cart
  const cartProductIds = cartItems.map(item => item.id);
  const suggestedProducts = products
    .filter(p => !cartProductIds.includes(p.id))
    .slice(0, 3);

  // Get applicable vouchers
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const applicableVouchers = vouchers.filter(v => {
    const now = new Date();
    const validFrom = new Date(v.valid_from);
    const validUntil = new Date(v.valid_until);
    return (
      now >= validFrom &&
      now <= validUntil &&
      (!v.min_order_value || cartTotal >= v.min_order_value) &&
      (!v.usage_limit || v.usage_count < v.usage_limit)
    );
  }).slice(0, 2);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Voucher Suggestions */}
      {applicableVouchers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Mã Giảm Giá Cho Bạn
              </h3>
              <div className="space-y-2">
                {applicableVouchers.map(voucher => (
                  <div
                    key={voucher.id}
                    className="bg-white rounded-lg p-3 border-2 border-dashed border-purple-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="font-bold text-purple-600">{voucher.code}</code>
                        <p className="text-xs text-gray-600 mt-1">{voucher.description}</p>
                      </div>
                      <Badge className="bg-purple-600">
                        {voucher.discount_type === 'percentage' 
                          ? `${voucher.discount_value}%` 
                          : formatPrice(voucher.discount_value)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Product Upsell */}
      {suggestedProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Khách Hàng Cũng Mua
              </h3>
              <div className="space-y-3">
                {suggestedProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex gap-3 bg-white rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-100 flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">燕</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h4>
                      <p className="text-amber-600 font-bold">{formatPrice(product.price)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onAddToCart(product);
                        toast.success("Đã thêm vào giỏ!");
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white self-center"
                    >
                      Thêm
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}