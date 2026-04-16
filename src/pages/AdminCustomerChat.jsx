
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MessageSquare, Package, ShoppingBag, User, Clock, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminCustomerChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const messagesEndRef = useRef(null);

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

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-last_message_time"),
    refetchInterval: 5000,
    enabled: !isCheckingAuth
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", selectedConversation?.id],
    queryFn: () => base44.entities.ChatMessage.filter(
      { conversation_id: selectedConversation.id },
      "created_date"
    ),
    enabled: !!selectedConversation,
    refetchInterval: 3000,
  });

  const { data: customerOrders = [] } = useQuery({
    queryKey: ["customer-orders", selectedConversation?.customer_email],
    queryFn: () => base44.entities.Order.filter(
      { customer_email: selectedConversation.customer_email },
      "-created_date"
    ),
    enabled: !!selectedConversation,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.ChatMessage.create(data);
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: data.message,
        last_message_time: new Date().toISOString(),
        unread_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setMessageInput("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId) => {
      const unreadMessages = messages.filter(m => m.sender_type === "customer" && !m.is_read);
      await Promise.all(
        unreadMessages.map(msg => base44.entities.ChatMessage.update(msg.id, { is_read: true }))
      );
      await base44.entities.Conversation.update(conversationId, { unread_count: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation.id,
      sender_type: "seller",
      sender_name: "Yến Sào Khang Long",
      sender_email: "support@yensaokhanglong.com",
      message: messageInput.trim()
    });
  };

  const getCustomerProductInterests = () => {
    const productIds = new Set();
    customerOrders.forEach(order => {
      order.items?.forEach(item => {
        productIds.add(item.product_id);
      });
    });
    return allProducts.filter(p => productIds.has(p.id));
  };

  const filteredConversations = conversations.filter(conv =>
    conv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const interestedProducts = getCustomerProductInterests();

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-3xl">
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex flex-col">
            <Link to={createPageUrl("AdminDashboard")}>
              <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 backdrop-blur-md">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Chat Khách Hàng</h1>
            <p className="text-gray-200">Hỗ trợ khách hàng qua chat</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
            <CardHeader className="border-b bg-white/60 backdrop-blur-sm">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                Cuộc trò chuyện
              </CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="divide-y">
                {filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-[#F5E6D3]/50 backdrop-blur-sm transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-[#F5E6D3]/70" : ""
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center text-white font-bold shadow-lg">
                          {conv.customer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#4A3F35]">{conv.customer_name}</p>
                          <p className="text-xs text-gray-500">{conv.customer_email}</p>
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white shadow-lg">{conv.unread_count}</Badge>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-sm text-gray-600 truncate mt-2">{conv.last_message}</p>
                    )}
                    {conv.last_message_time && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.last_message_time).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </motion.button>
                ))}
                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Chưa có cuộc trò chuyện</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {selectedConversation ? (
            <div className="lg:col-span-2 grid gap-6">
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl flex flex-col">
                <CardHeader className="border-b bg-gradient-to-r from-[#F8F5F0]/80 to-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {selectedConversation.customer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-[#4A3F35]">
                          {selectedConversation.customer_name}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{selectedConversation.customer_email}</p>
                      </div>
                    </div>
                    <Badge className={selectedConversation.status === "open" ? "bg-green-500/90 backdrop-blur-sm" : "bg-gray-500/90 backdrop-blur-sm"}>
                      {selectedConversation.status === "open" ? "Đang mở" : "Đã đóng"}
                    </Badge>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-6 bg-white/40 backdrop-blur-sm">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${
                            message.sender_type === "seller" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.sender_type === "customer" && (
                            <div className="w-8 h-8 rounded-full bg-gray-200/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                              message.sender_type === "seller"
                                ? "bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md text-white border border-white/20"
                                : "bg-white/80 backdrop-blur-sm border border-gray-200/50"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender_type === "seller" ? "text-white/70" : "text-gray-400"
                              }`}
                            >
                              {new Date(message.created_date).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t p-4 bg-white/60 backdrop-blur-sm">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Nhập tin nhắn của bạn..."
                      className="flex-1 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                    />
                    <Button
                      type="submit"
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      className="bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md text-white border border-white/20 shadow-lg"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </Card>

              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <Tabs defaultValue="orders" className="h-full flex flex-col">
                  <TabsList className="w-full bg-white/60 backdrop-blur-sm">
                    <TabsTrigger value="orders" className="flex-1">
                      <Package className="w-4 h-4 mr-2" />
                      Đơn hàng
                    </TabsTrigger>
                    <TabsTrigger value="products" className="flex-1">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Sản phẩm
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-350px)] px-4">
                      <div className="mb-4">
                        <div className="bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md p-4 rounded-lg mb-4 shadow-lg border border-white/30">
                          <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                          <p className="text-2xl font-bold text-[#D4AF37]">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {customerOrders.length} đơn hàng
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {customerOrders.map((order) => (
                          <Card key={order.id} className="overflow-hidden bg-white/60 backdrop-blur-sm border border-white/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <Badge className={
                                  order.status === "delivered" ? "bg-green-100/80 text-green-800 backdrop-blur-sm" :
                                  order.status === "pending" ? "bg-yellow-100/80 text-yellow-800 backdrop-blur-sm" :
                                  "bg-blue-100/80 text-blue-800 backdrop-blur-sm"
                                }>{order.status}</Badge>
                                <p className="text-sm font-bold text-[#D4AF37]">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                {order.items?.slice(0, 2).map((item, idx) => (
                                  <p key={idx} className="text-xs text-gray-600">
                                    • {item.product_name} (x{item.quantity})
                                  </p>
                                ))}
                                {order.items?.length > 2 && (
                                  <p className="text-xs text-gray-400">
                                    +{order.items.length - 2} sản phẩm khác
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(order.created_date).toLocaleDateString('vi-VN')}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                        {customerOrders.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Chưa có đơn hàng</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="products" className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[calc(100vh-350px)] px-4">
                      <div className="space-y-3">
                        {interestedProducts.map((product) => (
                          <Card key={product.id} className="overflow-hidden bg-white/60 backdrop-blur-sm border border-white/30">
                            <CardContent className="p-3">
                              <div className="flex gap-3">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm flex-shrink-0 border border-white/30">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-2xl text-[#D4AF37]/30">燕</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-[#4A3F35] mb-1">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {product.description}
                                  </p>
                                  <p className="text-sm font-bold text-[#D4AF37] mt-1">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {interestedProducts.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Chưa có lịch sử mua hàng</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          ) : (
            <Card className="lg:col-span-2 shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
              <CardContent className="p-20 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/30">
                  <MessageSquare className="w-12 h-12 text-[#D4AF37]/30" />
                </div>
                <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Chọn cuộc trò chuyện</h3>
                <p className="text-[#6B5742]">Chọn một cuộc trò chuyện để bắt đầu</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
