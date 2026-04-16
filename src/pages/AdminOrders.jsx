import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Mail, Phone, MapPin, Clock, ArrowLeft, ShoppingBag } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== "admin") {
        navigate(createPageUrl("Home"));
        return;
      }
    } catch (error) {
      console.error("Auth error:", error);
      navigate(createPageUrl("Home"));
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => base44.entities.Order.list("-created_date"),
    enabled: !isCheckingAuth
  });

  const orders = allOrders.filter(o => {
    const matchSearch = !searchQuery || 
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.includes(searchQuery);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, order }) => {
      await base44.entities.Order.update(orderId, { status });

      const statusMessages = {
        pending: `Đơn hàng #${orderId.slice(-8)} đang chờ xử lý. Chúng tôi sẽ sớm xem xét đơn hàng của bạn.`,
        processing: `Đơn hàng #${orderId.slice(-8)} của bạn đang được xử lý. Chúng tôi sẽ chuẩn bị sản phẩm cho bạn ngay!`,
        shipped: `Đơn hàng #${orderId.slice(-8)} đã được giao cho đơn vị vận chuyển! Bạn sẽ nhận được hàng trong vài ngày tới.`,
        delivered: `Đơn hàng #${orderId.slice(-8)} đã được giao thành công! Cảm ơn bạn đã mua hàng tại Yến Sào Khang Long.`,
        cancelled: `Đơn hàng #${orderId.slice(-8)} đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ.`
      };

      if (statusMessages[status]) {
        const conversations = await base44.entities.Conversation.filter({
          customer_email: order.customer_email
        });

        let conversation;
        if (conversations.length > 0) {
          conversation = conversations[0];
        } else {
          conversation = await base44.entities.Conversation.create({
            customer_email: order.customer_email,
            customer_name: order.customer_name,
            status: "open",
            unread_count: 1
          });
        }

        await base44.entities.ChatMessage.create({
          conversation_id: conversation.id,
          sender_type: "seller",
          sender_name: "Yến Sào Khang Long",
          sender_email: "system@yensaokhanglong.com",
          message: statusMessages[status]
        });

        await base44.entities.Conversation.update(conversation.id, {
          last_message: statusMessages[status],
          last_message_time: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1
        });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cập nhật đơn hàng', {
          body: `Đơn hàng đã được cập nhật sang: ${variables.status}`,
          icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691041e8b13e0de707277619/68fc593cc_vn-11134216-7r98o-lvndg1x71yt58d11.png',
          tag: 'order-update'
        });
      }
      
      toast.success("Cập nhật trạng thái thành công!", {
        description: `Đơn hàng đã chuyển sang ${variables.status}`
      });
      
      if (variables.order) {
        base44.integrations.Core.SendEmail({
          to: variables.order.customer_email,
          subject: `Cập nhật đơn hàng #${variables.order.id.slice(0, 8)}`,
          body: `Xin chào ${variables.order.customer_name},\n\nĐơn hàng của bạn đã được cập nhật sang: ${variables.status}.\n\nCảm ơn bạn!`
        }).catch(err => console.error("Email error:", err));
      }
    },
    onError: () => {
      toast.error("Lỗi cập nhật đơn hàng");
    }
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (orders && orders.length > 0) {
        const latestOrder = orders[0];
        const lastCheckedOrderId = localStorage.getItem('lastCheckedOrderId');
        
        if (latestOrder.id !== lastCheckedOrderId && latestOrder.status === 'pending') {
          localStorage.setItem('lastCheckedOrderId', latestOrder.id);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Đơn hàng mới! 🎉', {
              body: `${latestOrder.customer_name} vừa đặt đơn hàng ${formatPrice(latestOrder.total_amount)}`,
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691041e8b13e0de707277619/68fc593cc_vn-11134216-7r98o-lvndg1x71yt58d11.png',
              tag: 'new-order',
              requireInteraction: true
            });
          }
          
          toast.success("Đơn hàng mới!", {
            description: `${latestOrder.customer_name} vừa đặt hàng`,
            duration: 5000
          });
        }
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [orders]);

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-3xl">
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <Link to={createPageUrl("AdminDashboard")}>
                <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 backdrop-blur-md">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Quản Lý Đơn Hàng</h1>
              <p className="text-gray-200">Xem và cập nhật đơn hàng</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tìm kiếm đơn hàng</Label>
                <Input
                  placeholder="Tìm theo tên, email, hoặc mã đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2 bg-white/80"
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-2 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="processing">Đang xử lý</SelectItem>
                    <SelectItem value="shipped">Đã giao vận chuyển</SelectItem>
                    <SelectItem value="delivered">Đã giao hàng</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Tìm thấy {orders.length} đơn hàng
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="grid gap-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                  <CardHeader className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-md border-b border-white/30">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-[#D4AF37]" />
                      <h3 className="text-xl font-bold text-[#4A3F35]">
                        Đơn hàng #{order.id.slice(-8)}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 bg-white/60 backdrop-blur-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="grid md:grid-cols-2 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-[#6B5742] mb-2">
                              <strong>Khách hàng:</strong> {order.customer_name}
                            </p>
                            <p className="text-[#6B5742] flex items-center gap-2 mb-1">
                              <Mail className="w-4 h-4" />
                              {order.customer_email}
                            </p>
                            <p className="text-[#6B5742] flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {order.customer_phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#6B5742] flex items-start gap-2 mb-2">
                              <MapPin className="w-4 h-4 mt-1" />
                              {order.delivery_address}
                            </p>
                            <p className="text-[#6B5742] flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {new Date(order.created_date).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-sm text-[#6B5742] mb-1">Tổng tiền</p>
                          <p className="text-2xl font-bold text-[#D4AF37]">
                            {formatPrice(order.total_amount)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(status) =>
                              updateOrderMutation.mutate({
                                orderId: order.id,
                                status,
                                order
                              })
                            }
                          >
                            <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 backdrop-blur-xl">
                              <SelectItem value="pending">Chờ xử lý</SelectItem>
                              <SelectItem value="processing">Đang xử lý</SelectItem>
                              <SelectItem value="shipped">Đã giao vận chuyển</SelectItem>
                              <SelectItem value="delivered">Đã giao hàng</SelectItem>
                              <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            onClick={() => setSelectedOrder(order)}
                            variant="outline"
                            className="bg-white/80 backdrop-blur-sm"
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
              <ShoppingBag className="w-12 h-12 text-[#D4AF37]/30" />
            </div>
            <p className="text-gray-500 text-lg">Chưa có đơn hàng nào</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id.slice(-8)}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[#4A3F35] mb-3">Thông tin khách hàng</h3>
                <div className="bg-gradient-to-br from-[#F8F5F0]/50 to-[#F5E6D3]/50 backdrop-blur-sm rounded-lg p-4 space-y-2 border border-white/30">
                  <p><strong>Tên:</strong> {selectedOrder.customer_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                  <p><strong>Số điện thoại:</strong> {selectedOrder.customer_phone}</p>
                  <p><strong>Địa chỉ:</strong> {selectedOrder.delivery_address}</p>
                  <div className="pt-2 mt-2 border-t border-amber-200">
                    <p><strong>Phương thức thanh toán:</strong> {
                      selectedOrder.payment_method === 'cod' ? '💵 COD' :
                      selectedOrder.payment_method === 'vnpay' ? '💳 VNPAY' :
                      selectedOrder.payment_method === 'momo' ? '📱 MoMo' :
                      selectedOrder.payment_method === 'bank_transfer' ? '🏦 Chuyển khoản' : 'Không xác định'
                    }</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#4A3F35] mb-3">Sản phẩm</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="bg-white/50 backdrop-blur-sm rounded-lg p-4 flex justify-between items-center border border-white/30">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[#D4AF37]">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    {formatPrice(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-[#4A3F35] mb-2">Ghi chú</h3>
                  <p className="bg-gradient-to-br from-[#F8F5F0]/50 to-[#F5E6D3]/50 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}