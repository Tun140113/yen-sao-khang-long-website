import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const prizes = [
  { id: 1, code: "SPIN10", discount: "10%", color: "#FFD700" },
  { id: 2, code: "SPIN5", discount: "5%", color: "#FFA500" },
  { id: 3, code: "SPIN20", discount: "20%", color: "#FF69B4" },
  { id: 4, code: "SPIN15", discount: "15%", color: "#87CEEB" },
  { id: 5, code: "FREESHIP", discount: "Miễn phí ship", color: "#98FB98" },
  { id: 6, code: "SPIN30", discount: "30%", color: "#DDA0DD" }
];

export default function SpinWheel({ isOpen, onClose, onWin }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState(null);

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    const baseRotation = 360 * 5; // 5 vòng quay
    const segmentAngle = 360 / prizes.length;
    const targetRotation = baseRotation + (randomIndex * segmentAngle);
    
    setRotation(targetRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      setPrize(selectedPrize);
      toast.success(`🎉 Chúc mừng! Bạn nhận được ${selectedPrize.discount}`, {
        description: `Mã: ${selectedPrize.code}`,
        duration: 5000
      });
      onWin(selectedPrize.code);
    }, 4000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-amber-50 to-orange-50 border-0">
        <div className="text-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <h2 className="text-3xl font-bold text-amber-900 mb-2">Vòng Quay May Mắn</h2>
          <p className="text-amber-700 mb-6">Quay để nhận voucher giảm giá!</p>
          
          <div className="relative w-64 h-64 mx-auto mb-6">
            <motion.div
              className="w-full h-full rounded-full relative overflow-hidden shadow-2xl"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: "easeOut" }}
            >
              {prizes.map((item, index) => (
                <div
                  key={item.id}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${(360 / prizes.length) * index}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((Math.PI * 2) / prizes.length)}% ${50 - 50 * Math.sin((Math.PI * 2) / prizes.length)}%)`
                  }}
                >
                  <div
                    className="w-full h-full flex items-start justify-center pt-8"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-white font-bold text-sm">{item.discount}</span>
                  </div>
                </div>
              ))}
            </motion.div>
            
            {/* Arrow pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-red-500 z-10"></div>
          </div>
          
          <AnimatePresence>
            {!isSpinning && !prize && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  onClick={handleSpin}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-6 text-lg rounded-full"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Quay Ngay!
                </Button>
              </motion.div>
            )}
            
            {prize && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <h3 className="text-2xl font-bold text-amber-900 mb-2">🎉 Chúc Mừng!</h3>
                <p className="text-lg mb-4">Bạn nhận được <span className="font-bold text-amber-600">{prize.discount}</span></p>
                <div className="bg-amber-100 px-4 py-2 rounded-lg mb-4">
                  <code className="text-lg font-mono font-bold text-amber-900">{prize.code}</code>
                </div>
                <Button onClick={onClose} className="bg-amber-600 text-white">
                  Sử Dụng Ngay
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}