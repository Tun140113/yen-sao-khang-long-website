import React, { useState } from "react";
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
import { ArrowLeft, Plus, Edit, Trash2, Upload, CreditCard, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminPaymentInfo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [formData, setFormData] = useState({
    payment_method: "bank_transfer",
    account_name: "",
    account_number: "",
    bank_name: "",
    qr_code_url: "",
    instructions: "",
    is_active: true
  });

  React.useEffect(() => {
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

  const { data: paymentInfos = [], isLoading } = useQuery({
    queryKey: ["payment-infos"],
    queryFn: () => base44.entities.PaymentInfo.list("-created_date"),
    enabled: !isCheckingAuth
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentInfo.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-infos"] });
      handleCloseDialog();
      toast.success("Đã thêm thông tin thanh toán!");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentInfo.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-infos"] });
      handleCloseDialog();
      toast.success("Đã cập nhật thông tin thanh toán!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentInfo.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-infos"] });
      toast.success("Đã xóa thông tin thanh toán!");
    },
  });

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        payment_method: item.payment_method || "bank_transfer",
        account_name: item.account_name || "",
        account_number: item.account_number || "",
        bank_name: item.bank_name || "",
        qr_code_url: item.qr_code_url || "",
        instructions: item.instructions || "",
        is_active: item.is_active !== undefined ? item.is_active : true
      });
    } else {
      setEditingItem(null);
      setFormData({
        payment_method: "bank_transfer",
        account_name: "",
        account_number: "",
        bank_name: "",
        qr_code_url: "",
        instructions: "",
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingQR(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, qr_code_url: result.file_url});
      toast.success("Upload QR code thành công!");
    } catch (error) {
      console.error("Error uploading QR:", error);
      toast.error("Lỗi upload QR code");
    } finally {
      setUploadingQR(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getMethodLabel = (method) => {
    const labels = {
      bank_transfer: "Chuyển khoản ngân hàng",
      momo: "Ví MoMo",
      vnpay: "VNPAY"
    };
    return labels[method] || method;
  };

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-3xl">
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <Link to={createPageUrl("AdminDashboard")}>
                <Button variant="ghost" className="text-white hover:bg-white/20 mb-4 backdrop-blur-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mb-2">Thông Tin Thanh Toán</h1>
              <p className="text-gray-200">Quản lý thông tin tài khoản và QR code</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white/90 backdrop-blur-md text-[#4A3F35] hover:bg-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Thông Tin
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : paymentInfos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentInfos.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-md">
                  <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-50 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-600" />
                        {getMethodLabel(item.payment_method)}
                      </CardTitle>
                      <Badge className={item.is_active ? "bg-green-500" : "bg-gray-400"}>
                        {item.is_active ? "Kích hoạt" : "Tắt"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {item.account_name && (
                      <div>
                        <p className="text-xs text-gray-500">Tên tài khoản</p>
                        <p className="font-semibold text-gray-900">{item.account_name}</p>
                      </div>
                    )}
                    {item.account_number && (
                      <div>
                        <p className="text-xs text-gray-500">Số tài khoản</p>
                        <p className="font-semibold text-gray-900">{item.account_number}</p>
                      </div>
                    )}
                    {item.bank_name && (
                      <div>
                        <p className="text-xs text-gray-500">Ngân hàng</p>
                        <p className="font-semibold text-gray-900">{item.bank_name}</p>
                      </div>
                    )}
                    {item.qr_code_url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Mã QR</p>
                        <img src={item.qr_code_url} alt="QR Code" className="w-full max-w-[200px] mx-auto rounded-lg border-2 border-gray-200" />
                      </div>
                    )}
                    {item.instructions && (
                      <div>
                        <p className="text-xs text-gray-500">Hướng dẫn</p>
                        <p className="text-sm text-gray-700">{item.instructions}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn xóa thông tin này?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="flex-1 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-xl">
              <CreditCard className="w-16 h-16 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Chưa có thông tin thanh toán</h3>
            <p className="text-[#6B5742]">Thêm thông tin tài khoản ngân hàng hoặc QR code</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingItem ? "Chỉnh Sửa Thông Tin" : "Thêm Thông Tin Thanh Toán"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Phương thức thanh toán *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Chuyển khoản ngân hàng</SelectItem>
                  <SelectItem value="momo">Ví MoMo</SelectItem>
                  <SelectItem value="vnpay">VNPAY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tên tài khoản</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({...formData, account_name: e.target.value})}
                  placeholder="VD: NGUYEN VAN A"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Số tài khoản</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                  placeholder="VD: 0123456789"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Tên ngân hàng</Label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                placeholder="VD: Vietcombank, Techcombank..."
                className="mt-2"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4" />
                Mã QR thanh toán
              </Label>
              {formData.qr_code_url && (
                <div className="mb-4">
                  <img src={formData.qr_code_url} alt="QR Preview" className="w-48 mx-auto rounded-lg border-2 border-gray-200" />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleQRUpload}
                  disabled={uploadingQR}
                  className="hidden"
                  id="qr-upload"
                />
                <label htmlFor="qr-upload" className="flex-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    disabled={uploadingQR}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingQR ? "Đang upload..." : formData.qr_code_url ? "Đổi QR code" : "Upload QR code"}
                    </span>
                  </Button>
                </label>
                {formData.qr_code_url && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({...formData, qr_code_url: ""})}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Hướng dẫn thanh toán</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                placeholder="VD: Chuyển khoản và ghi nội dung: [Mã đơn hàng]"
                className="mt-2 h-24"
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
              <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt</Label>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Hủy
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
                {editingItem ? "Cập Nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}