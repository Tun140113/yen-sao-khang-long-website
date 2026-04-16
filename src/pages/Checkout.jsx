import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle, ArrowLeft, Tag, X, Percent, CreditCard, Wallet, Building2, Package, Loader2, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";
import { notifyPurchaseSuccess, notifyPaymentFailed } from "@/components/DiscordNotifications";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    delivery_option: "",
    notes: "",
    payment_method: "cod"
  });
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [shippingError, setShippingError] = useState("");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const { data: paymentInfos = [] } = useQuery({
    queryKey: ["payment-infos"],
    queryFn: () => base44.entities.PaymentInfo.filter({ is_active: true }),
    enabled: !isCheckingAuth
  });

  const { data: shippingMethods = [] } = useQuery({
    queryKey: ["shipping-methods-checkout"],
    queryFn: () => base44.entities.ShippingMethod.filter({ is_active: true }),
    enabled: !isCheckingAuth
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const allFreeShip = cart.length > 0 && cart.every(item => item.freeship);
  const rawShippingFee = selectedShipping ? selectedShipping.price : 0;
  const shippingFee = allFreeShip ? 0 : rawShippingFee;

  const { data: recommendedVouchers = [] } = useQuery({
    queryKey: ["recommended-vouchers", subtotal],
    queryFn: async () => {
      const vouchers = await base44.entities.Voucher.filter({ is_active: true });
      const now = new Date();
      return vouchers.filter(v => {
        const validFrom = new Date(v.valid_from);
        const validUntil = new Date(v.valid_until);
        return (
          now >= validFrom &&
          now <= validUntil &&
          (!v.min_order_value || subtotal >= v.min_order_value) &&
          (!v.usage_limit || v.usage_count < v.usage_limit) &&
          !appliedVoucher
        );
      }).slice(0, 2);
    },
    enabled: !isCheckingAuth && !appliedVoucher && cart.length > 0
  });

  // Self-host mode: checkout is public. If the user is logged in, we still
  // prefill fields via `base44.auth.me()` above, but we don't force login.

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (savedCart.length === 0) {
      navigate(createPageUrl("Cart"));
    }
    setCart(savedCart);
  }, [navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.full_name || prev.customer_name,
        customer_email: user.email || prev.customer_email,
      }));
    }
  }, [user]);

  const applyVoucherMutation = useMutation({
    mutationFn: async (code) => {
      const vouchers = await base44.entities.Voucher.filter({ code: code, is_active: true });
      if (vouchers.length === 0) {
        throw new Error("Mã voucher không hợp lệ");
      }

      const voucher = vouchers[0];
      const now = new Date();
      const validFrom = new Date(voucher.valid_from);
      const validUntil = new Date(voucher.valid_until);

      if (now < validFrom) {
        throw new Error("Mã voucher chưa có hiệu lực");
      }
      if (now > validUntil) {
        throw new Error("Mã voucher đã hết hạn");
      }
      if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
        throw new Error("Mã voucher đã hết lượt sử dụng");
      }

      return voucher;
    },
    onSuccess: (voucher) => {
      setAppliedVoucher(voucher);
      setVoucherError("");
      setVoucherCode("");

      let discountAmount = 0;
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (voucher.discount_type === 'percentage') {
        discountAmount = (subtotal * voucher.discount_value) / 100;
        if (voucher.max_discount) {
          discountAmount = Math.min(discountAmount, voucher.max_discount);
        }
      } else {
        discountAmount = voucher.discount_value;
      }

      toast.success("Áp dụng voucher thành công!", {
        description: `Tiết kiệm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}`,
      });
    },
    onError: (error) => {
      setVoucherError(error.message);
      setAppliedVoucher(null);
      toast.error("Không thể áp dụng voucher", {
        description: error.message
      });
    }
  });

  const handleOnlinePayment = async (order) => {
    setProcessingPayment(true);
    
    try {
      toast.info("Đang chuyển đến cổng thanh toán...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const paymentSuccess = Math.random() > 0.2;
      
      if (paymentSuccess) {
        await base44.entities.Order.update(order.id, {
          payment_status: "paid",
          status: "processing"
        });
        
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("orderCreated"));
        setOrderPlaced(true);
        toast.success("Thanh toán thành công!");
        
        setTimeout(() => {
          navigate(createPageUrl("Home"));
        }, 3000);
      } else {
        await base44.entities.Order.update(order.id, {
          payment_status: "failed",
          status: "cancelled"
        });
        
        // Notify Discord about payment failure
        notifyPaymentFailed(order, "Giao dịch thanh toán bị từ chối", {
          isLoggedIn: !!user,
          userId: user?.id || null
        });
        
        toast.error("Thanh toán thất bại. Vui lòng thử lại.");
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Có lỗi xảy ra trong quá trình thanh toán.");
      setProcessingPayment(false);
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await base44.entities.Order.create(orderData);

      // Notify Discord about successful purchase (privacy-safe)
      notifyPurchaseSuccess({...orderData, id: order.id}, {
        isLoggedIn: !!user,
        userId: user?.id || null
      });

      if (appliedVoucher) {
        await base44.entities.Voucher.update(appliedVoucher.id, {
          usage_count: (appliedVoucher.usage_count || 0) + 1
        });
      }

      // Send order confirmation email
      try {
        await base44.integrations.Core.SendEmail({
          to: orderData.customer_email,
          subject: "Xác nhận đơn hàng - Yến Sào Khang Long",
          body: `
            <h2>Cảm ơn bạn đã đặt hàng tại Yến Sào Khang Long!</h2>
            <p>Mã đơn hàng: <strong>${order.id}</strong></p>
            <p>Tổng tiền: <strong>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.total_amount)}</strong></p>
            <p>Địa chỉ giao hàng: ${orderData.delivery_address}</p>
            <p>Chúng tôi sẽ liên hệ với bạn sớm để xác nhận đơn hàng.</p>
            <p>Trân trọng,<br/>Yến Sào Khang Long</p>
          `
        });
      } catch (error) {
        console.error("Email send error:", error);
      }

      // Award loyalty points
      try {
        const points = Math.floor(orderData.total_amount / 10000);
        const loyaltyRecords = await base44.entities.LoyaltyPoint.filter({ user_email: orderData.customer_email });
        
        if (loyaltyRecords.length > 0) {
          const record = loyaltyRecords[0];
          await base44.entities.LoyaltyPoint.update(record.id, {
            points: (record.points || 0) + points,
            lifetime_points: (record.lifetime_points || 0) + points
          });
        } else {
          await base44.entities.LoyaltyPoint.create({
            user_email: orderData.customer_email,
            points: points,
            lifetime_points: points
          });
        }
      } catch (error) {
        console.error("Loyalty points error:", error);
      }

      return order;
    },
    onSuccess: async (order) => {
      if (formData.payment_method !== "cod") {
        await handleOnlinePayment(order);
      } else {
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("orderCreated"));

        toast.success("Đặt hàng thành công!", {
          description: "Khang Long đã nhận được đơn hàng của quý khách và sẽ liên hệ lại quý khách sớm nhất có thể.",
          duration: 5000
        });

        setOrderPlaced(true);
        setTimeout(() => {
          navigate(createPageUrl("Home"));
        }, 3000);
      }
    },
    onError: (error) => {
      toast.error("Lỗi đặt hàng", {
        description: error.message || "Vui lòng thử lại sau"
      });
    }
  });

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    applyVoucherMutation.mutate(voucherCode.trim().toUpperCase());
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedShipping) {
      setShippingError("Vui lòng chọn phương thức vận chuyển");
      return;
    }
    setShippingError("");

    const orderData = {
      ...formData,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total_amount: finalTotal,
      voucher_code: appliedVoucher?.code || null,
      discount_amount: discount,
      delivery_option: selectedShipping?.name || "",
      shipping_fee: shippingFee,
      payment_method: formData.payment_method,
      payment_status: formData.payment_method === "cod" ? "pending" : "awaiting",
      status: "pending"
    };

    createOrderMutation.mutate(orderData);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  let discount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.min_order_value > 0 && subtotal < appliedVoucher.min_order_value) {
      // Only check min order value if it's set and > 0
      if (appliedVoucher.id && voucherError === "") {
        setAppliedVoucher(null);
        setVoucherError(`Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(appliedVoucher.min_order_value)} để sử dụng voucher này`);
      }
    } else {
      if (appliedVoucher.discount_type === 'percentage') {
        discount = (subtotal * appliedVoucher.discount_value) / 100;
        if (appliedVoucher.max_discount) {
          discount = Math.min(discount, appliedVoucher.max_discount);
        }
      } else {
        discount = appliedVoucher.discount_value;
      }
    }
  }

  const finalTotal = Math.max(0, subtotal + shippingFee - discount);

  if (isCheckingAuth || userLoading) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  if (orderPlaced || processingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl flex items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4 bg-white/70 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/30"
        >
          {processingPayment ? (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/80 to-blue-600/80 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-[#4A3F35] mb-4">Đang xử lý thanh toán...</h2>
              <p className="text-lg text-[#6B5742]">Vui lòng đợi trong giây lát</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/80 to-green-600/80 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30">
                <CheckCircle className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-bold text-[#4A3F35] mb-4 drop-shadow-sm">Đặt hàng thành công!</h2>
              <p className="text-lg text-[#6B5742] mb-2">
                Khang Long đã nhận được đơn hàng của quý khách
              </p>
              <p className="text-[#6B5742]">
                Chúng tôi sẽ liên hệ lại quý khách sớm nhất có thể để xác nhận đơn hàng.
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl py-12" style={{ fontFamily: "'Lora', serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Cart"))}
          className="mb-8 hover:bg-[#F5E6D3]/50 transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại giỏ hàng
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-2 drop-shadow-sm">
            Thanh Toán
          </h1>
          <p className="text-lg text-[#6B5742]">Hoàn tất đơn hàng của bạn</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-[#4A3F35]">Thông tin giao hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                        className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        required
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                        className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.customer_email}
                      onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                      className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm"
                      disabled={!!user?.email}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Địa chỉ giao hàng *</Label>
                    <Textarea
                      id="address"
                      required
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                      className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] h-24 bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-[#4A3F35] mb-3 block">Phương thức vận chuyển *</Label>
                    <div className="space-y-2 mt-2">
                      {allFreeShip && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-xl mb-2">
                          <span style={{ background: "#38a169", color: "white", borderRadius: "4px", padding: "3px 8px", fontSize: "0.85em", fontWeight: "bold" }}>🚚 Miễn phí vận chuyển</span>
                          <p className="text-sm text-green-700 mt-1">Tất cả sản phẩm trong giỏ hàng được miễn phí vận chuyển!</p>
                        </div>
                      )}
                      {shippingMethods.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => { setSelectedShipping(method); setShippingError(""); }}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            selectedShipping?.id === method.id
                              ? "border-[#D4AF37] bg-amber-50"
                              : "border-[#F5E6D3] bg-white/80 hover:border-[#D4AF37]/50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-[#4A3F35]">{method.name}</p>
                              {method.estimatedTime && <p className="text-sm text-gray-500">{method.estimatedTime}</p>}
                            </div>
                            {allFreeShip ? (
                              <div className="text-right">
                                <p className="line-through text-gray-400 text-sm">{formatPrice(method.price)}</p>
                                <p className="font-bold text-green-600">0đ — Miễn phí</p>
                              </div>
                            ) : (
                              <p className="font-bold text-[#D4AF37]">{formatPrice(method.price)}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {shippingError && <p className="text-sm text-red-600 mt-2">{shippingError}</p>}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-[#4A3F35] flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                      Phương Thức Thanh Toán
                    </Label>
                    <RadioGroup
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({...formData, payment_method: value})}
                    >
                      <div className="flex items-center space-x-3 p-4 border-2 border-[#F5E6D3] rounded-xl hover:border-[#D4AF37] transition-all bg-white/80 backdrop-blur-sm">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-[#4A3F35]">Thanh toán khi nhận hàng (COD)</div>
                              <div className="text-sm text-gray-600">Thanh toán bằng tiền mặt khi nhận hàng</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 border-2 border-[#F5E6D3] rounded-xl hover:border-[#D4AF37] transition-all bg-white/80 backdrop-blur-sm">
                        <RadioGroupItem value="vnpay" id="vnpay" />
                        <Label htmlFor="vnpay" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-[#4A3F35]">VNPAY</div>
                              <div className="text-sm text-gray-600">Thanh toán qua VNPAY QR, thẻ ATM, Visa, Master</div>
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border-2 border-[#F5E6D3] rounded-xl hover:border-[#D4AF37] transition-all bg-white/80 backdrop-blur-sm">
                        <RadioGroupItem value="momo" id="momo" />
                        <Label htmlFor="momo" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-pink-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-[#4A3F35]">Ví MoMo</div>
                              <div className="text-sm text-gray-600">Thanh toán qua ví điện tử MoMo</div>
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border-2 border-[#F5E6D3] rounded-xl hover:border-[#D4AF37] transition-all bg-white/80 backdrop-blur-sm">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-[#4A3F35]">Chuyển khoản ngân hàng</div>
                              <div className="text-sm text-gray-600">Chuyển khoản trực tiếp qua ngân hàng</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Payment Information Display */}
                    {formData.payment_method !== "cod" && paymentInfos.length > 0 && (() => {
                      const selectedPaymentInfo = paymentInfos.find(info => info.payment_method === formData.payment_method);
                      if (!selectedPaymentInfo) return null;
                      
                      return (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 shadow-lg"
                        >
                          <h3 className="font-bold text-[#4A3F35] mb-4 flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-blue-600" />
                            Thông Tin Thanh Toán
                          </h3>
                          
                          <div className="space-y-4">
                            {selectedPaymentInfo.account_name && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Tên tài khoản</p>
                                <p className="font-bold text-[#4A3F35] text-lg">{selectedPaymentInfo.account_name}</p>
                              </div>
                            )}
                            
                            {selectedPaymentInfo.account_number && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Số tài khoản</p>
                                <p className="font-bold text-[#4A3F35] text-lg">{selectedPaymentInfo.account_number}</p>
                              </div>
                            )}
                            
                            {selectedPaymentInfo.bank_name && (
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Ngân hàng</p>
                                <p className="font-bold text-[#4A3F35] text-lg">{selectedPaymentInfo.bank_name}</p>
                              </div>
                            )}
                            
                            <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 backdrop-blur-sm rounded-lg p-4 border-2 border-amber-200/50">
                              <p className="text-xs text-gray-600 mb-1">Số tiền cần thanh toán</p>
                              <p className="font-bold text-[#D4AF37] text-2xl">{formatPrice(finalTotal)}</p>
                            </div>
                            
                            {selectedPaymentInfo.qr_code_url && (
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-3">Quét mã QR để thanh toán</p>
                                <img 
                                  src={selectedPaymentInfo.qr_code_url} 
                                  alt="QR Code" 
                                  className="w-64 h-64 mx-auto rounded-xl border-4 border-white shadow-2xl"
                                />
                              </div>
                            )}
                            
                            {selectedPaymentInfo.instructions && (
                              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-2">Hướng dẫn</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{selectedPaymentInfo.instructions}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú đơn hàng (tùy chọn)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] h-24 bg-white/80 backdrop-blur-sm"
                      placeholder="Ghi chú đặc biệt cho đơn hàng của bạn..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending || processingPayment}
                    className="w-full bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-2xl text-white py-4 md:py-6 text-base md:text-lg rounded-full transition-all duration-200 border border-white/20"
                  >
                    {processingPayment ? "Đang xử lý thanh toán..." : createOrderMutation.isPending ? "Đang xử lý..." : formData.payment_method === "cod" ? "Đặt Hàng" : "Thanh Toán"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl text-[#4A3F35] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#D4AF37]" />
                  Mã Giảm Giá
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Recommended Vouchers */}
                {!appliedVoucher && recommendedVouchers.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold text-purple-900 mb-2">💡 Gợi ý cho bạn:</p>
                    {recommendedVouchers.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setVoucherCode(v.code);
                          applyVoucherMutation.mutate(v.code);
                        }}
                        className="w-full text-left p-2 bg-white rounded-lg mb-2 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <code className="font-bold text-purple-600 text-sm">{v.code}</code>
                            <p className="text-xs text-gray-600">{v.description}</p>
                          </div>
                          <Badge className="bg-purple-600">Áp dụng</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {appliedVoucher ? (
                  <div className="bg-gradient-to-br from-green-50/80 to-green-100/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50 shadow-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className="bg-gradient-to-r from-green-500/90 to-green-600/90 backdrop-blur-md text-white border-0 mb-2 border-white/20 shadow-lg">
                          <Percent className="w-3 h-3 mr-1" />
                          Đã áp dụng
                        </Badge>
                        <p className="font-bold text-[#4A3F35]">{appliedVoucher.code}</p>
                        <p className="text-sm text-[#6B5742]">{appliedVoucher.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveVoucher}
                        className="h-8 w-8 text-red-500 hover:bg-red-50/80 backdrop-blur-sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm font-bold text-green-700">
                      Tiết kiệm: {formatPrice(discount)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập mã giảm giá"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        className="border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm"
                      />
                      <Button
                        onClick={handleApplyVoucher}
                        disabled={applyVoucherMutation.isPending || !voucherCode.trim()}
                        className="bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-xl text-white border border-white/20"
                      >
                        {applyVoucherMutation.isPending ? "..." : "Áp dụng"}
                      </Button>
                    </div>
                    {voucherError && (
                      <p className="text-sm text-red-600">{voucherError}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-24 shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-[#4A3F35]">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[#6B5742]">{item.name} x {item.quantity}</span>
                      <span className="font-semibold text-[#4A3F35]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  <div className="border-t border-[#F5E6D3] pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#6B5742]">Tạm tính</span>
                      <span className="font-semibold text-[#4A3F35]">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B5742]">Phí vận chuyển</span>
                      <span className="font-semibold text-[#4A3F35]">
                        {selectedShipping ? (
                          allFreeShip ? (
                            <span>
                              <span className="line-through text-gray-400 mr-1">{formatPrice(rawShippingFee)}</span>
                              <span className="text-green-600">0đ</span>
                            </span>
                          ) : formatPrice(shippingFee)
                        ) : "—"}
                      </span>
                    </div>
                    {allFreeShip && selectedShipping && (
                      <div>
                        <span style={{ background: "#38a169", color: "white", borderRadius: "4px", padding: "2px 6px", fontSize: "0.8em", fontWeight: "bold" }}>🚚 Miễn phí vận chuyển</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          Giảm giá
                        </span>
                        <span className="font-semibold">-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#F5E6D3] pt-3">
                      <div className="flex justify-between">
                        <span className="text-xl font-bold text-[#4A3F35]">Tổng cộng</span>
                        <span className="text-2xl font-bold text-[#D4AF37]">{formatPrice(finalTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
