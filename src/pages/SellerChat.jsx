import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Package, ShoppingBag, User, Mail, Phone, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SellerChat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => base44.entities.Conversation.list("-updated_date"),
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedConversation?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ 
      conversation_id: selectedConversation.id 
    }, "created_date"),
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Real-time updates
  });

  const { data: customerOrders = [] } = useQuery({
    queryKey: ["customer-orders", selectedConversation?.customer_email],
    queryFn: () => base44.entities.Order.filter({ 
      customer_email: selectedConversation.customer_email 
    }, "-created_date"),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await base44.entities.ChatMessage.create(messageData);
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: messageData.message,
        unread_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNewMessage("");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId) => {
      const unreadMessages = messages.filter(m => 
        m.sender_type === "customer" && !m.read
      );
      await Promise.all(
        unreadMessages.map(msg => 
          base44.entities.ChatMessage.update(msg.id, { read: true })
        )
      );
      await base44.entities.Conversation.update(conversationId, { 
        unread_count: 0 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const hasUnread = messages.some(m => 
        m.sender_type === "customer" && !m.read
      );
      if (hasUnread) {
        markAsReadMutation.mutate(selectedConversation.id);
      }
    }
  }, [messages, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    sendMessageMutation.mutate({
      conversation_id: selectedConversation.id,
      sender_email: "seller@yensaokhanglong.com",
      sender_name: "Yến Sào Khang Long",
      sender_type: "seller",
      message: newMessage.trim()
    });
  };

  const totalOrders = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Trò Chuyện Với Khách Hàng</h1>
          <p className="text-gray-200 mt-2">Quản lý và trả lời tin nhắn từ khách hàng</p>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="shadow-xl lg:col-span-1">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                Cuộc Trò Chuyện ({conversations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {conversations.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <motion.button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full p-4 text-left hover:bg-[#FFFBF5] transition-colors ${
                          selectedConversation?.id === conversation.id ? "bg-[#F5E6D3]" : ""
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[#4A3F35] truncate">
                                {conversation.customer_name}
                              </h3>
                              <p className="text-sm text-[#6B5742] truncate">
                                {conversation.last_message || "Bắt đầu cuộc trò chuyện"}
                              </p>
                            </div>
                          </div>
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-red-500 text-white">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500">Chưa có cuộc trò chuyện nào</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="shadow-xl lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-[#F8F5F0] to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-[#4A3F35]">
                          {selectedConversation.customer_name}
                        </CardTitle>
                        <p className="text-sm text-[#6B5742]">
                          {selectedConversation.customer_email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <div className="grid lg:grid-cols-3 h-[calc(100vh-350px)]">
                  {/* Messages */}
                  <div className="lg:col-span-2 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${
                              message.sender_type === "seller" ? "justify-end" : ""
                            }`}
                          >
                            {message.sender_type === "customer" && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                message.sender_type === "seller"
                                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white"
                                  : "bg-white border border-gray-200 text-[#4A3F35]"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender_type === "seller" ? "text-white/70" : "text-gray-400"
                              }`}>
                                {new Date(message.created_date).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex items-center gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          className="flex-1 border-[#F5E6D3] focus:border-[#D4AF37]"
                        />
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Customer Info Sidebar */}
                  <div className="border-l border-gray-200 bg-[#FFFBF5] p-4 overflow-y-auto">
                    <h3 className="font-semibold text-[#4A3F35] mb-4">Thông Tin Khách Hàng</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-[#6B5742] mb-1">
                          <Mail className="w-4 h-4 text-[#D4AF37]" />
                          Email
                        </div>
                        <p className="text-[#4A3F35] font-medium text-sm">
                          {selectedConversation.customer_email}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-[#6B5742] mb-2">
                          <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                          Thống Kê Mua Hàng
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#6B5742]">Tổng đơn hàng:</span>
                            <span className="font-semibold text-[#4A3F35]">{totalOrders}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#6B5742]">Tổng chi tiêu:</span>
                            <span className="font-semibold text-[#D4AF37]">
                              ${totalSpent.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {customerOrders.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-[#6B5742] mb-3">
                            <Package className="w-4 h-4 text-[#D4AF37]" />
                            Đơn Hàng Gần Đây
                          </div>
                          <div className="space-y-2">
                            {customerOrders.slice(0, 3).map((order) => (
                              <div key={order.id} className="bg-[#FFFBF5] rounded p-2">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs text-[#6B5742]">
                                    #{order.id.slice(-6)}
                                  </span>
                                  <Badge className={`text-xs ${
                                    order.status === "delivered" ? "bg-green-100 text-green-800" :
                                    order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                                    order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {order.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-[#4A3F35] space-y-1">
                                  {order.items?.slice(0, 2).map((item, idx) => (
                                    <div key={idx}>• {item.product_name}</div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-[#6B5742]">
                                    {new Date(order.created_date).toLocaleDateString('vi-VN')}
                                  </span>
                                  <span className="text-sm font-semibold text-[#D4AF37]">
                                    ${order.total_amount?.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-[#4A3F35] mb-2">
                  Chọn Cuộc Trò Chuyện
                </h3>
                <p className="text-[#6B5742]">
                  Chọn một cuộc trò chuyện bên trái để bắt đầu trò chuyện với khách hàng
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}