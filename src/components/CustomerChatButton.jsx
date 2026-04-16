import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, User, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated && !conversation) {
      loadOrCreateConversation();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAuth = async () => {
    const auth = await base44.auth.isAuthenticated();
    setIsAuthenticated(auth);
    if (auth) {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    }
  };

  const loadOrCreateConversation = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      const conversations = await base44.entities.Conversation.filter({
        customer_email: currentUser.email,
        status: "open"
      });

      if (conversations.length > 0) {
        setConversation(conversations[0]);
      } else {
        const newConv = await base44.entities.Conversation.create({
          customer_email: currentUser.email,
          customer_name: currentUser.full_name,
          status: "open",
          last_message: "Bắt đầu cuộc trò chuyện",
          last_message_time: new Date().toISOString()
        });
        setConversation(newConv);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!conversation) return;
    try {
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: conversation.id },
        "created_date"
      );
      setMessages(msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation) return;

    const messageText = inputMessage.trim();
    setInputMessage("");

    try {
      await base44.entities.ChatMessage.create({
        conversation_id: conversation.id,
        sender_type: "customer",
        sender_name: user?.full_name || "Khách hàng",
        sender_email: user?.email || "",
        message: messageText,
        is_read: false
      });

      await base44.entities.Conversation.update(conversation.id, {
        last_message: messageText,
        last_message_time: new Date().toISOString()
      });

      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname + window.location.search);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl flex items-center justify-center group"
            style={{
              boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)'
            }}
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-2rem)] sm:h-[600px] max-h-[700px]"
          >
            <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 p-4 sm:p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent)]"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
                    >
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold text-base sm:text-lg">Chat Hỗ Trợ</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></span>
                        <span className="text-white/90 text-xs sm:text-sm">Trực tuyến</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              {!isAuthenticated ? (
                <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-xl"
                    >
                      <LogIn className="w-10 h-10 text-blue-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-[#4A3F35] mb-3">Đăng nhập để tiếp tục</h3>
                    <p className="text-sm text-[#6B5742] mb-6">
                      Vui lòng đăng nhập để chat với nhân viên hỗ trợ của chúng tôi
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogin}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full shadow-lg"
                    >
                      Đăng nhập ngay
                    </motion.button>
                  </motion.div>
                </div>
              ) : (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 to-white p-3 sm:p-4 space-y-3 scroll-smooth">
                    {messages.length === 0 && !isLoading ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center px-4"
                      >
                        <motion.div
                          animate={{ 
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-xl mb-4"
                        >
                          <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                        </motion.div>
                        <h4 className="text-base sm:text-lg font-bold text-[#4A3F35] mb-2">Xin chào {user?.full_name}! 👋</h4>
                        <p className="text-sm text-[#6B5742]/70">Gửi tin nhắn để bắt đầu trò chuyện với nhân viên hỗ trợ</p>
                      </motion.div>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                                msg.sender_type === "customer"
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                  : "bg-white border border-blue-100 text-[#4A3F35]"
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{msg.message}</p>
                              <p className={`text-xs mt-1.5 ${msg.sender_type === "customer" ? "text-white/70" : "text-gray-400"}`}>
                                {new Date(msg.created_date).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-blue-100 bg-white p-3 sm:p-4">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Nhập tin nhắn..."
                          className="w-full bg-blue-50 border-blue-200 focus:border-blue-500 focus:ring-blue-500 rounded-full text-sm sm:text-base"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </motion.button>
                    </form>
                    <p className="text-xs text-[#6B5742]/50 text-center mt-2">Thời gian phản hồi: trong vài phút</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media (max-width: 640px) {
          .scroll-smooth::-webkit-scrollbar {
            width: 4px;
          }
        }
        .scroll-smooth::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-smooth::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-smooth::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3B82F6, #2563EB);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}