import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Package, ShoppingCart, Star, Truck, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for cart updates
    const handleCartUpdate = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (cart.length > 0) {
        const lastItem = cart[cart.length - 1];
        addNotification({
          id: Date.now(),
          type: "cart",
          title: "Đã thêm vào giỏ hàng",
          message: `${lastItem.name} đã được thêm vào giỏ hàng của bạn`,
          icon: ShoppingCart,
          color: "text-green-600",
          timestamp: new Date()
        });
      }
    };

    // Listen for order updates
    const handleOrderUpdate = () => {
      addNotification({
        id: Date.now(),
        type: "order",
        title: "Đơn hàng đã được tạo",
        message: "Đơn hàng của bạn đã được đặt thành công",
        icon: Package,
        color: "text-blue-600",
        timestamp: new Date()
      });
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("orderCreated", handleOrderUpdate);

    // Load saved notifications
    const saved = localStorage.getItem("notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (e) {
        console.error("Error loading notifications:", e);
      }
    }

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("orderCreated", handleOrderUpdate);
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 10); // Keep last 10
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const clearNotification = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("notifications");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl overflow-hidden"
        >
          <Card className="h-full border-0 rounded-none">
            <CardHeader className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5" />
                  <CardTitle>Thông Báo</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-white hover:bg-white/20 text-xs"
                    >
                      Xóa tất cả
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-[calc(100%-80px)] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-[#F5E6D3]">
                  {notifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="p-4 hover:bg-[#FFFBF5] transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#F5E6D3] to-white flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${notification.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-[#4A3F35]">{notification.title}</h4>
                                <p className="text-sm text-[#6B5742] mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => clearNotification(notification.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5E6D3] to-white flex items-center justify-center mb-4">
                    <Bell className="w-10 h-10 text-[#D4AF37]/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#4A3F35] mb-2">
                    Chưa có thông báo
                  </h3>
                  <p className="text-sm text-[#6B5742]">
                    Các thông báo mới sẽ hiển thị tại đây
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatTimestamp(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}