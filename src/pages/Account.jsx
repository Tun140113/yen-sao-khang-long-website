import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Package, MapPin, Gift, Star, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import LoadingScreen from "../components/LoadingScreen";

export default function Account() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addressDialog, setAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    recipient_name: "",
    phone: "",
    address: "",
    is_default: false
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => base44.entities.Order.list("-created_date"),
    enabled: !!currentUser
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["user-addresses"],
    queryFn: () => base44.entities.SavedAddress.filter({ user_email: currentUser.email }),
    enabled: !!currentUser
  });

  const { data: loyaltyData } = useQuery({
    queryKey: ["user-loyalty"],
    queryFn: async () => {
      const result = await base44.entities.LoyaltyPoint.filter({ user_email: currentUser.email });
      return result[0] || { points: 0, tier: "bronze", lifetime_points: 0 };
    },
    enabled: !!currentUser
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ["user-vouchers"],
    queryFn: () => base44.entities.Voucher.filter({ is_active: true }),
    enabled: !!currentUser
  });

  const createAddressMutation = useMutation({
    mutationFn: (data) => base44.entities.SavedAddress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user-addresses"]);
      setAddressDialog(false);
      resetAddressForm();
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SavedAddress.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["user-addresses"]);
      setAddressDialog(false);
      resetAddressForm();
      setEditingAddress(null);
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedAddress.delete(id),
    onSuccess: () => queryClient.invalidateQueries(["user-addresses"])
  });

  const resetAddressForm = () => {
    setAddressForm({
      label: "",
      recipient_name: "",
      phone: "",
      address: "",
      is_default: false
    });
  };

  const handleSaveAddress = () => {
    const data = { ...addressForm, user_email: currentUser.email };
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      createAddressMutation.mutate(data);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label || "",
      recipient_name: address.recipient_name,
      phone: address.phone,
      address: address.address,
      is_default: address.is_default || false
    });
    setAddressDialog(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: "from-amber-700 to-amber-900",
      silver: "from-gray-400 to-gray-600",
      gold: "from-yellow-400 to-yellow-600",
      platinum: "from-purple-400 to-purple-600"
    };
    return colors[tier] || colors.bronze;
  };

  if (isLoading) {
    return <LoadingScreen message="Đang tải thông tin..." />;
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 py-12" style={{ fontFamily: "'Lora', serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-[#4A3F35] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Tài Khoản Của Tôi
          </h1>
          <p className="text-lg text-[#6B5742]">Xin chào, {currentUser.full_name || currentUser.email}!</p>
        </motion.div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-xl shadow-xl border border-white/30">
            <TabsTrigger value="orders"><Package className="w-4 h-4 mr-2" />Đơn Hàng</TabsTrigger>
            <TabsTrigger value="addresses"><MapPin className="w-4 h-4 mr-2" />Địa Chỉ</TabsTrigger>
            <TabsTrigger value="loyalty"><Star className="w-4 h-4 mr-2" />Tích Điểm</TabsTrigger>
            <TabsTrigger value="vouchers"><Gift className="w-4 h-4 mr-2" />Voucher</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Lịch Sử Đơn Hàng</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-[#F5E6D3] rounded-xl p-6 bg-white/50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-semibold text-[#4A3F35]">Đơn hàng #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-[#6B5742]">{new Date(order.created_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status === "pending" ? "Chờ xử lý" :
                             order.status === "processing" ? "Đang xử lý" :
                             order.status === "shipped" ? "Đã gửi" :
                             order.status === "delivered" ? "Đã giao" : "Đã hủy"}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-4">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.product_name} x{item.quantity}</span>
                              <span className="text-[#D4AF37] font-semibold">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-[#F5E6D3] pt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-[#4A3F35]">Tổng cộng:</span>
                            <span className="text-xl font-bold text-[#D4AF37]">{formatPrice(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#6B5742] py-8">Bạn chưa có đơn hàng nào</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Sổ Địa Chỉ</CardTitle>
                  <Dialog open={addressDialog} onOpenChange={setAddressDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { resetAddressForm(); setEditingAddress(null); }} className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E]">
                        <Plus className="w-4 h-4 mr-2" />Thêm Địa Chỉ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingAddress ? "Chỉnh Sửa" : "Thêm"} Địa Chỉ</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Nhãn (VD: Nhà riêng, Văn phòng)</Label>
                          <Input value={addressForm.label} onChange={(e) => setAddressForm({...addressForm, label: e.target.value})} />
                        </div>
                        <div>
                          <Label>Tên người nhận *</Label>
                          <Input value={addressForm.recipient_name} onChange={(e) => setAddressForm({...addressForm, recipient_name: e.target.value})} required />
                        </div>
                        <div>
                          <Label>Số điện thoại *</Label>
                          <Input value={addressForm.phone} onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})} required />
                        </div>
                        <div>
                          <Label>Địa chỉ đầy đủ *</Label>
                          <Input value={addressForm.address} onChange={(e) => setAddressForm({...addressForm, address: e.target.value})} required />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})} />
                          <Label>Đặt làm địa chỉ mặc định</Label>
                        </div>
                        <Button onClick={handleSaveAddress} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E]">
                          Lưu Địa Chỉ
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="grid gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-[#F5E6D3] rounded-xl p-6 bg-white/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[#4A3F35]">{address.label || "Địa chỉ"}</h3>
                            {address.is_default && <Badge className="bg-[#D4AF37] text-white">Mặc định</Badge>}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditAddress(address)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteAddressMutation.mutate(address.id)} className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-[#4A3F35]">{address.recipient_name}</p>
                        <p className="text-[#6B5742]">{address.phone}</p>
                        <p className="text-[#6B5742] mt-2">{address.address}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#6B5742] py-8">Chưa có địa chỉ nào được lưu</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Điểm Tích Lũy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`bg-gradient-to-r ${getTierColor(loyaltyData?.tier)} text-white rounded-2xl p-8 mb-6`}>
                  <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Hạng {loyaltyData?.tier === "bronze" ? "Đồng" : loyaltyData?.tier === "silver" ? "Bạc" : loyaltyData?.tier === "gold" ? "Vàng" : "Bạch Kim"}
                  </h3>
                  <p className="text-4xl font-bold mb-4">{loyaltyData?.points || 0} điểm</p>
                  <p className="text-sm opacity-90">Tổng điểm tích lũy: {loyaltyData?.lifetime_points || 0}</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-[#4A3F35]">Cách tích điểm:</h4>
                  <ul className="space-y-2 text-[#6B5742]">
                    <li>• Mỗi 100.000đ = 1 điểm</li>
                    <li>• Đơn hàng đầu tiên: Thưởng 50 điểm</li>
                    <li>• Review sản phẩm: 10 điểm/review</li>
                    <li>• Giới thiệu bạn bè: 100 điểm</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vouchers Tab */}
          <TabsContent value="vouchers">
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Voucher Dành Cho Bạn</CardTitle>
              </CardHeader>
              <CardContent>
                {vouchers.length > 0 ? (
                  <div className="grid gap-4">
                    {vouchers.map((voucher) => (
                      <div key={voucher.id} className="border-2 border-dashed border-[#D4AF37] rounded-xl p-6 bg-gradient-to-r from-[#FFFBF5] to-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Gift className="w-5 h-5 text-[#D4AF37]" />
                              <h3 className="text-xl font-bold text-[#4A3F35]">{voucher.code}</h3>
                            </div>
                            <p className="text-[#6B5742] mb-2">{voucher.description}</p>
                            <p className="text-sm text-[#6B5742]">
                              Giảm {voucher.discount_type === "percentage" ? `${voucher.discount_value}%` : formatPrice(voucher.discount_value)}
                            </p>
                            <p className="text-xs text-[#6B5742] mt-2">
                              HSD: {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <Badge className="bg-[#D4AF37] text-white">
                            {voucher.discount_type === "percentage" ? `${voucher.discount_value}%` : formatPrice(voucher.discount_value)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#6B5742] py-8">Hiện chưa có voucher khả dụng</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}