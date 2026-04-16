import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Percent, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminVouchers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    valid_from: "",
    valid_until: "",
    is_active: true,
    description: ""
  });

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      const user = await base44.auth.me();
      if (user.role !== "admin") {
        navigate(createPageUrl("Home"));
        return;
      }
    } catch (error) {
      console.error("Auth error:", error);
      navigate(createPageUrl("Home"));
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: () => base44.entities.Voucher.list("-created_date"),
    enabled: !isCheckingAuth
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Voucher.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Voucher.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
  });

  const handleOpenDialog = (voucher = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code || "",
        discount_type: voucher.discount_type || "percentage",
        discount_value: voucher.discount_value || "",
        min_order_value: voucher.min_order_value || "",
        max_discount: voucher.max_discount || "",
        usage_limit: voucher.usage_limit || "",
        valid_from: voucher.valid_from ? new Date(voucher.valid_from).toISOString().split('T')[0] : "",
        valid_until: voucher.valid_until ? new Date(voucher.valid_until).toISOString().split('T')[0] : "",
        is_active: voucher.is_active !== false,
        description: voucher.description || ""
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_value: "",
        max_discount: "",
        usage_limit: "",
        valid_from: "",
        valid_until: "",
        is_active: true,
        description: ""
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVoucher(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
    };

    if (editingVoucher) {
      updateMutation.mutate({ id: editingVoucher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-3xl">
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <Link to={createPageUrl("AdminDashboard")}>
                <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 backdrop-blur-md">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Quản Lý Voucher</h1>
              <p className="text-gray-200">Tạo và quản lý mã giảm giá</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white/90 backdrop-blur-md text-[#4A3F35] hover:bg-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Voucher
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : vouchers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((voucher, index) => (
              <motion.div
                key={voucher.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-shadow border-0 bg-white/70 backdrop-blur-xl">
                  <CardHeader className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-[#4A3F35] mb-2">
                          {voucher.code}
                        </CardTitle>
                        <Badge className={`${voucher.is_active ? "bg-green-500/90" : "bg-gray-500/90"} backdrop-blur-sm`}>
                          {voucher.is_active ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(voucher)}
                          className="hover:bg-white/50 backdrop-blur-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Bạn có chắc muốn xóa voucher này?")) {
                              deleteMutation.mutate(voucher.id);
                            }
                          }}
                          className="hover:bg-red-50/50 text-red-500 backdrop-blur-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3 bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Percent className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-semibold">
                        {voucher.discount_type === "percentage"
                          ? `${voucher.discount_value}%`
                          : formatPrice(voucher.discount_value)}
                      </span>
                    </div>
                    {voucher.min_order_value > 0 && (
                      <p className="text-sm text-gray-600">
                        Đơn tối thiểu: {formatPrice(voucher.min_order_value)}
                      </p>
                    )}
                    {voucher.max_discount && (
                      <p className="text-sm text-gray-600">
                        Giảm tối đa: {formatPrice(voucher.max_discount)}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Đến: {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {voucher.usage_limit && (
                      <p className="text-sm text-gray-600">
                        Đã dùng: {voucher.usage_count || 0} / {voucher.usage_limit}
                      </p>
                    )}
                    {voucher.description && (
                      <p className="text-sm text-gray-700 italic">{voucher.description}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
              <Tag className="w-12 h-12 text-[#D4AF37]/30" />
            </div>
            <p className="text-gray-500 text-lg">Chưa có voucher nào</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingVoucher ? "Chỉnh Sửa Voucher" : "Tạo Voucher Mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Mã Voucher *</Label>
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  placeholder="VD: YENSAO2024"
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label>Loại Giảm Giá *</Label>
                <Select value={formData.discount_type} onValueChange={(value) => setFormData({...formData, discount_type: value})}>
                  <SelectTrigger className="mt-2 bg-white/80 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl">
                    <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                    <SelectItem value="fixed">Số tiền cố định (VND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Giá Trị Giảm *</Label>
                <Input
                  type="number"
                  required
                  value={formData.discount_value}
                  onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                  placeholder={formData.discount_type === "percentage" ? "VD: 10" : "VD: 50000"}
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label>Giá Trị Đơn Tối Thiểu</Label>
                <Input
                  type="number"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({...formData, min_order_value: e.target.value})}
                  placeholder="VD: 500000"
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Giảm Tối Đa (cho % voucher)</Label>
                <Input
                  type="number"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({...formData, max_discount: e.target.value})}
                  placeholder="VD: 100000"
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label>Số Lần Sử Dụng Tối Đa</Label>
                <Input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                  placeholder="VD: 100"
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Ngày Bắt Đầu</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label>Ngày Hết Hạn *</Label>
                <Input
                  type="date"
                  required
                  value={formData.valid_until}
                  onChange={(e) => setFormData({...formData, valid_until: e.target.value})}
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div>
              <Label>Mô Tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả voucher..."
                className="mt-2 h-24 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt voucher</Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="bg-white/80 backdrop-blur-sm">
                Hủy
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
                {editingVoucher ? "Cập Nhật" : "Tạo Voucher"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}