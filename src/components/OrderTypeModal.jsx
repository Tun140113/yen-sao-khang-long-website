import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderTypeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = sessionStorage.getItem("hasSeenOrderTypeModal");
    if (!hasSeenModal) {
      setTimeout(() => setOpen(true), 2000);
    }
  }, []);

  const handleChoice = (type) => {
    sessionStorage.setItem("hasSeenOrderTypeModal", "true");
    setOpen(false);
    if (type === "simple") {
      window.open("https://docs.google.com/forms/d/e/1FAIpQLSffAPSRmcod33O5eIaz8WtVRAkG_fYp971ddDEH5dX-kdNPKg/viewform", "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-[#FFFBF5] border-2 border-[#D4AF37]/30">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Chào mừng đến với Khang Long! 🌟
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-center text-[#6B5742] mb-6" style={{ fontFamily: "'Lora', serif" }}>
            Bạn muốn đặt hàng theo cách nào?
          </p>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => handleChoice("simple")}
              className="w-full h-auto py-6 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:shadow-xl flex flex-col gap-2"
            >
              <FileText className="w-8 h-8" />
              <span className="text-lg font-bold">Đặt Hàng Nhanh</span>
              <span className="text-sm opacity-90">Điền form đơn giản, nhanh chóng</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => handleChoice("detailed")}
              variant="outline"
              className="w-full h-auto py-6 border-2 border-[#D4AF37] hover:bg-[#FFFBF5] flex flex-col gap-2"
            >
              <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
              <span className="text-lg font-bold text-[#4A3F35]">Xem Sản Phẩm Chi Tiết</span>
              <span className="text-sm text-[#6B5742]">Khám phá đầy đủ thông tin, hình ảnh</span>
            </Button>
          </motion.div>

          <button
            onClick={() => handleChoice("detailed")}
            className="text-sm text-[#6B5742] hover:text-[#D4AF37] transition-colors mx-auto block mt-4"
          >
            Bỏ qua
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}