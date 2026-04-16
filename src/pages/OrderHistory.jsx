import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const STATUS_CONFIG = {
  pending:    { label: "Chờ xử lý",   className: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Đang xử lý",  className: "bg-yellow-100 text-yellow-800" },
  shipped:    { label: "Đang giao",    className: "bg-blue-100 text-blue-800" },
  delivered:  { label: "Đã giao",      className: "bg-green-100 text-green-800" },
  cancelled:  { label: "Đã hủy",       className: "bg-red-100 text-red-800" },
};

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function OrderHistory() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then((auth) => {
      if (!auth) {
        base44.auth.redirectToLogin(window.location.pathname);
      } else {
        setIsAuth(true);
      }
      setAuthChecked(true);
    });
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => base44.entities.Order.list("-created_date"),
    enabled: isAuth,
  });

  if (!authChecked || !isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5] to-white py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link to={createPageUrl("Home")}>
          <Button variant="ghost" className="mb-6 hover:bg-amber-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-[#4A3F35] mb-8">Lịch Sử Đơn Hàng</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/80">
            <CardContent className="p-16 text-center">
              <ShoppingBag className="w-16 h-16 text-[#D4AF37]/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#4A3F35] mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-gray-500 mb-6">Hãy khám phá sản phẩm và đặt đơn hàng đầu tiên của bạn!</p>
              <Link to={createPageUrl("Products")}>
                <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
                  Xem Sản Phẩm
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order, i) => {
              const status = STATUS_CONFIG[order.status] || { label: order.status, className: "bg-gray-100 text-gray-800" };
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-xl bg-white/90">
                    <CardHeader className="bg-gradient-to-r from-[#F8F5F0] to-[#F5E6D3] p-4 rounded-t-xl">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-[#D4AF37]" />
                          <span className="font-bold text-[#4A3F35]">
                            Mã đơn: #{order.id.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-gray-500">
                            {new Date(order.created_date).toLocaleDateString("vi-VN", {
                              year: "numeric", month: "long", day: "numeric"
                            })}
                          </span>
                          <Badge className={status.className}>{status.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            {!item.image_url && (
                              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xl text-[#D4AF37]/40">燕</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#4A3F35] truncate">{item.product_name}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantity} × {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold text-[#D4AF37] flex-shrink-0">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-amber-200">
                        <span className="font-bold text-[#4A3F35]">Tổng cộng</span>
                        <span className="text-xl font-bold text-[#D4AF37]">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}