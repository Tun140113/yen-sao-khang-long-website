import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Tag, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function VoucherPopup({ voucher, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    toast.success("Đã copy mã giảm giá!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!voucher) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-10"
        >
          <X className="w-4 h-4" />
        </Button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🎁 Ưu Đãi Đặc Biệt!</h2>
          <p className="text-lg text-gray-700 mb-6">{voucher.description || "Giảm giá cho bạn"}</p>
          
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg border-2 border-dashed border-purple-300">
            <p className="text-sm text-gray-600 mb-2">Mã giảm giá</p>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-bold text-purple-600 font-mono">{voucher.code}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="hover:bg-purple-100"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-purple-600" />}
              </Button>
            </div>
          </div>

          <div className="text-left bg-white rounded-xl p-4 mb-6">
            <h3 className="font-bold text-gray-900 mb-2">Chi tiết ưu đãi:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Giảm: {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : `${voucher.discount_value.toLocaleString('vi-VN')}đ`}</li>
              {voucher.min_order_value > 0 && (
                <li>✓ Đơn tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')}đ</li>
              )}
              {voucher.max_discount && (
                <li>✓ Giảm tối đa: {voucher.max_discount.toLocaleString('vi-VN')}đ</li>
              )}
              <li>✓ Hết hạn: {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}</li>
            </ul>
          </div>

          <Button
            onClick={() => {
              handleCopy();
              setTimeout(() => onClose(), 500);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 text-lg rounded-full"
          >
            Copy Mã & Mua Ngay
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}