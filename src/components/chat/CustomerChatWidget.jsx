import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Minimize2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: ""
  });
  const [showInfoForm, setShowInfoForm] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Load or create conversation
  useEffect(() => {
    if (isOpen && !conversation) {
      const savedInfo = localStorage.getItem("customerChatInfo");
      if (savedInfo) {
        const info = JSON.parse(savedInfo);
        setCustomerInfo(info);
        loadOrCreateConversation(info);
      } else {
        setShowInfoForm(true);
      }
    }
  }, [isOpen]);

  const loadOrCreateConversation = async (info) => {
    try {
      const conversations = await base44.entities.Conversation.filter({
        customer_email: info.email
      });
      
      if (conversations.length > 0) {
        setConversation(conversations[0]);
      } else {
        const newConv = await base44.entities.Conversation.create({
          customer_email: info.email,
          customer_name: info.name,
          status: "active"
        });
        setConversation(newConv);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const { data: messages = [] } = useQuery({
    queryKey: ["customer-messages", conversation?.id],
    queryFn: () => base44.entities.ChatMessage.filter({
      conversation_id: conversation.id
    }, "created_date"),
    enabled: !!conversation,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await base44.entities.ChatMessage.create(messageData);
      await base44.entities.Conversation.update(conversation.id, {
        last_message: messageData.message,
        unread_count: (conversation.unread_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-messages"] });
      setNewMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("customerChatInfo", JSON.stringify(customerInfo));
    loadOrCreateConversation(customerInfo);
    setShowInfoForm(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    sendMessageMutation.mutate({
      conversation_id: conversation.id,
      sender_email: customerInfo.email,
      sender_name: customerInfo.name,
      sender_type: "customer",
      message: newMessage.trim()
    });
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:shadow-2xl shadow-lg transition-all duration-300 hover:scale-110"
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "auto" : "600px"
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md"
          >
            <Card className="shadow-2xl overflow-hidden border-2 border-[#F5E6D3]">
              <CardHeader className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">Chat Với Chúng Tôi</CardTitle>
                      <p className="text-xs text-white/80">Yến Sào Khang Long</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-white/20 h-8 w-8"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0">
                  {showInfoForm ? (
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-[#4A3F35] mb-4">
                        Thông tin của bạn
                      </h3>
                      <form onSubmit={handleInfoSubmit} className="space-y-4">
                        <div>
                          <Input
                            placeholder="Tên của bạn"
                            required
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                            className="border-[#F5E6D3] focus:border-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="Email của bạn"
                            required
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                            className="border-[#F5E6D3] focus:border-[#D4AF37]"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white"
                        >
                          Bắt đầu trò chuyện
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <>
                      {/* Messages Area */}
                      <div className="h-[450px] overflow-y-auto bg-gradient-to-b from-[#FFFBF5] to-white p-4 space-y-4">
                        {messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <MessageCircle className="w-16 h-16 text-[#D4AF37]/30 mx-auto mb-4" />
                              <p className="text-[#6B5742]">
                                Xin chào! Chúng tôi có thể giúp gì cho bạn?
                              </p>
                            </div>
                          </div>
                        ) : (
                          messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex gap-3 ${
                                message.sender_type === "customer" ? "justify-end" : ""
                              }`}
                            >
                              {message.sender_type === "seller" && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">KL</span>
                                </div>
                              )}
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                  message.sender_type === "customer"
                                    ? "bg-[#4A3F35] text-white"
                                    : "bg-white border border-gray-200 text-[#4A3F35]"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  message.sender_type === "customer" ? "text-white/70" : "text-gray-400"
                                }`}>
                                  {new Date(message.created_date).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </motion.div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input Area */}
                      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-[#F5E6D3]">
                        <div className="flex items-center space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            disabled={!conversation}
                            className="flex-1 border-[#F5E6D3] focus:border-[#D4AF37]"
                          />
                          <Button
                            type="submit"
                            disabled={!conversation || !newMessage.trim() || sendMessageMutation.isPending}
                            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:shadow-lg text-white"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </form>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}