import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !conversation && !hasInitialized.current) {
      hasInitialized.current = true;
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!conversation) return;
    const unsubscribe = base44.agents.subscribeToConversation(
      conversation.id,
      (data) => {
        setMessages(data.messages || []);
      }
    );
    return () => unsubscribe();
  }, [conversation]);

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "customer_support",
        metadata: { name: "Customer Chat", source: "website" }
      });
      setConversation(conv);
      await base44.agents.addMessage(conv, {
        role: "user",
        content: "Hello"
      });
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: messageText
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
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
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] shadow-2xl flex items-center justify-center group"
            style={{
              boxShadow: '0 10px 40px rgba(212, 175, 55, 0.4)'
            }}
          >
            <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>
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
              <div className="relative bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] p-4 sm:p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent)]"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold text-base sm:text-lg">AI Tư Vấn</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></span>
                        <span className="text-white/90 text-xs sm:text-sm">Đang hoạt động</span>
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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FFFBF5] to-white p-3 sm:p-4 space-y-3 scroll-smooth">
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
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#F5E6D3] to-[#F8F5F0] rounded-full flex items-center justify-center shadow-xl mb-4"
                    >
                      <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#D4AF37]" />
                    </motion.div>
                    <h4 className="text-base sm:text-lg font-bold text-[#4A3F35] mb-2">Xin chào! 👋</h4>
                    <p className="text-sm text-[#6B5742]/70">Tôi là AI tư vấn yến sào. Hãy hỏi tôi bất cứ điều gì!</p>
                  </motion.div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <MessageBubble message={message} />
                      </motion.div>
                    ))}
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm border border-[#F5E6D3] rounded-2xl w-fit"
                      >
                        <div className="flex gap-1">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                              className="w-2 h-2 bg-[#D4AF37] rounded-full"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[#6B5742]">AI đang trả lời...</span>
                      </motion.div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-[#F5E6D3]/50 bg-white p-3 sm:p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      disabled={isLoading || !conversation}
                      className="w-full pr-10 bg-[#FFFBF5] border-[#F5E6D3] focus:border-[#D4AF37] focus:ring-[#D4AF37] rounded-full text-sm sm:text-base"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={isLoading || !conversation || !inputMessage.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </motion.button>
                </form>
                <p className="text-xs text-[#6B5742]/50 text-center mt-2">Powered by AI</p>
              </div>
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
          background: linear-gradient(to bottom, #D4AF37, #B8941E);
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}