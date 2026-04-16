import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, CheckCircle, Truck, Clock, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderTracking() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const { data: customerOrders = [], isLoading, refetch } = useQuery({
    queryKey: ["customer-orders", searchEmail],
    queryFn: () => base44.entities.Order.filter({ customer_email: searchEmail }, "-created_date"),
    enabled: searchSubmitted && !!searchEmail,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchSubmitted(true);
    refetch();
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: "Chờ Xử Lý", icon: Clock, color: "bg-yellow-100/80 text-yellow-800" },
      processing: { label: "Đang Xử Lý", icon: Package, color: "bg-blue-100/80 text-blue-800" },
      shipped: { label: "Đang Giao", icon: Truck, color: "bg-purple-100/80 text-purple-800" },
      delivered: { label: "Đã Giao", icon: CheckCircle, color: "bg-green-100/80 text-green-800" },
      cancelled: { label: "Đã Hủy", icon: XCircle, color: "bg-red-100/80 text-red-800" }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getStatusProgress = (status) => {
    const progress = {
      pending: 25,
      processing: 50,
      shipped: 75,
      delivered: 100,
      cancelled: 0
    };
    return progress[status] || 0;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37]/80 to-[#B8941E]/80 backdrop-blur-md rounded-full mb-6 shadow-2xl border border-white/30">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">
            Theo Dõi Đơn Hàng
          </h1>
          <p className="text-lg text-[#6B5742]">
            Nhập email để kiểm tra trạng thái đơn hàng của bạn
          </p>
        </motion.div>

        {/* Search Form */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Đặt Hàng</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3] focus:border-[#D4AF37]"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-xl text-white py-6 rounded-full transition-all duration-300 hover:scale-105 border border-white/20"
              >
                <Search className="w-5 h-5 mr-2" />
                Tìm Kiếm Đơn Hàng
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence mode="wait">
          {isLoading && searchSubmitted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#6B5742]">Đang tìm kiếm đơn hàng...</p>
            </motion.div>
          )}

          {searchSubmitted && !isLoading && customerOrders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <CardContent className="p-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-[#F8F5F0]/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/30">
                    <Search className="w-12 h-12 text-[#D4AF37]/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Không tìm thấy đơn hàng</h3>
                  <p className="text-[#6B5742]">Vui lòng kiểm tra lại email của bạn</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {searchSubmitted && !isLoading && customerOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">
                Tìm thấy {customerOrders.length} đơn hàng
              </h2>
              
              {customerOrders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                const progress = getStatusProgress(order.status);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                      <CardHeader className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-md border-b border-white/30">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl text-[#4A3F35]">
                              Đơn hàng #{order.id.slice(0, 8)}
                            </CardTitle>
                            <p className="text-sm text-[#6B5742] mt-1">
                              {new Date(order.created_date).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <Badge className={`${statusInfo.color} backdrop-blur-sm flex items-center gap-1`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Progress Bar */}
                        {order.status !== 'cancelled' && (
                          <div className="mb-6">
                            <div className="h-2 bg-gray-200/80 backdrop-blur-sm rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Order Details */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-[#4A3F35] mb-2">Sản phẩm:</h4>
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm text-[#6B5742] mb-1">
                                <span>{item.product_name} x {item.quantity}</span>
                                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="border-t border-[#F5E6D3]/50 pt-3">
                            <div className="flex justify-between">
                              <span className="font-bold text-[#4A3F35]">Tổng cộng:</span>
                              <span className="text-xl font-bold text-[#D4AF37]">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-[#F8F5F0]/50 to-[#F5E6D3]/50 backdrop-blur-sm rounded-lg p-4 mt-4">
                            <p className="text-sm text-[#6B5742]">
                              <strong>Địa chỉ giao hàng:</strong> {order.delivery_address}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}