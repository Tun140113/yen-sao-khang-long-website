import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import SmartCartSuggestions from "../components/cart/SmartCartSuggestions";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
    window.addEventListener("cartUpdated", loadCart);
    return () => window.removeEventListener("cartUpdated", loadCart);
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addProductToCart = (product) => {
    const updatedCart = [...cart];
    const existingItem = updatedCart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      updatedCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1
      });
    }
    
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (index) => { // Changed itemId to index
    const updatedCart = cart.filter((_, i) => i !== index); // Filter by index
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 0; // Miễn phí ship
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl py-12" style={{ fontFamily: "'Lora', serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-2 drop-shadow-sm">
            Giỏ Hàng Của Bạn
          </h1>
          <p className="text-lg text-[#6B5742]">{cart.length} sản phẩm</p>
        </motion.div>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[#F5E6D3]/80 to-[#F8F5F0]/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl">
              <ShoppingCart className="w-16 h-16 text-[#D4AF37]/30" />
            </div>
            <h2 className="text-3xl font-bold text-[#4A3F35] mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-[#6B5742] mb-8">Thêm một số sản phẩm yến sào cao cấp vào giỏ hàng của bạn!</p>
            <Link to={createPageUrl("Products")}>
              <Button className="bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-xl text-white px-8 py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 border border-white/20">
                Tiếp Tục Mua Sắm
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence>
                {cart.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-shadow border-0 bg-white/70 backdrop-blur-xl">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm border border-white/30">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl text-[#D4AF37]/30">燕</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#4A3F35] mb-2">{item.name}</h3>
                            
                            {/* Display variant, packaging and set info */}
                            {(item.variantDisplay || item.packagingDisplay || item.setDisplay) && (
                              <div className="flex gap-2 mb-3 flex-wrap">
                                {item.variantDisplay && (
                                  <Badge variant="outline" className="bg-purple-50/80 text-purple-700 backdrop-blur-sm">
                                    Vị: {item.variantDisplay}
                                  </Badge>
                                )}
                                {item.packagingDisplay && (
                                  <Badge variant="outline" className="bg-blue-50/80 text-blue-700 backdrop-blur-sm">
                                    {item.packagingDisplay}
                                  </Badge>
                                )}
                                {item.setDisplay && (
                                  <Badge variant="outline" className="bg-amber-50/80 text-amber-700 backdrop-blur-sm">
                                    🎁 {item.setDisplay}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Display set items if available */}
                            {item.setItems && item.setItems.length > 0 && (
                              <div className="bg-amber-50/50 p-2 rounded-lg text-xs text-amber-800 backdrop-blur-sm mb-3">
                                <p className="font-semibold mb-1">Nội dung set:</p>
                                {item.setItems.map((setItem, i) => (
                                  <div key={i}>• {setItem.quantity}x {setItem.item_name}</div>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-2xl font-bold text-[#D4AF37] mb-4">
                              {formatPrice(item.price)}
                            </p>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center border-2 border-[#F5E6D3] rounded-full bg-white/50 backdrop-blur-md shadow-lg">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(index, item.quantity - 1)}
                                  className="rounded-full hover:bg-[#F5E6D3]/50"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold text-[#4A3F35]">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateQuantity(index, item.quantity + 1)}
                                  className="rounded-full hover:bg-[#F5E6D3]/50"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <Button
                                variant="ghost"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:bg-red-50/80 backdrop-blur-sm"
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Smart Suggestions */}
              <SmartCartSuggestions 
                cartItems={cart}
                onAddToCart={addProductToCart}
              />
              </div>

              {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-1"
            >
              <Card className="sticky top-24 shadow-2xl border-0">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-[#4A3F35] mb-6">Tóm tắt đơn hàng</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[#6B5742]">
                      <span>Tạm tính</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#6B5742]">
                      <span>Phí vận chuyển</span>
                      <span className="font-semibold text-green-600">Miễn phí</span>
                    </div>
                    <div className="border-t-2 border-[#F5E6D3] pt-4">
                      <div className="flex justify-between">
                        <span className="text-xl font-bold text-[#4A3F35]">Tổng cộng</span>
                        <span className="text-2xl font-bold text-[#D4AF37]">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(createPageUrl("Checkout"))}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:shadow-xl text-white py-6 text-lg rounded-full transition-all duration-300 hover:scale-105"
                  >
                    Thanh Toán
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  
                  <Link to={createPageUrl("Products")}>
                    <Button variant="ghost" className="w-full mt-4 text-[#6B5742] hover:bg-[#F5E6D3] transition-colors">
                      Tiếp tục mua sắm
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}