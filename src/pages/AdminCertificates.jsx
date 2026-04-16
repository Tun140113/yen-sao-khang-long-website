
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
import { ArrowLeft, Plus, Edit, Trash2, Award, Upload } from "lucide-react";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminCertificates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    issued_by: "",
    issued_date: "",
    certificate_type: "quality",
    order: 0
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

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: () => base44.entities.Certificate.list("order"),
    enabled: !isCheckingAuth
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Certificate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Certificate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Certificate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
    },
  });

  const handleOpenDialog = (cert = null) => {
    if (cert) {
      setEditingCert(cert);
      setFormData({
        name: cert.name || "",
        description: cert.description || "",
        image_url: cert.image_url || "",
        issued_by: cert.issued_by || "",
        issued_date: cert.issued_date || "",
        certificate_type: cert.certificate_type || "quality",
        order: cert.order || 0
      });
    } else {
      setEditingCert(null);
      setFormData({
        name: "",
        description: "",
        image_url: "",
        issued_by: "",
        issued_date: "",
        certificate_type: "quality",
        order: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCert(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, image_url: result.file_url});
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Lỗi upload ảnh");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      order: parseInt(formData.order) || 0
    };

    if (editingCert) {
      updateMutation.mutate({ id: editingCert.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const typeLabels = {
    quality: "Chất Lượng",
    safety: "An Toàn",
    origin: "Xuất Xứ",
    award: "Giải Thưởng",
    other: "Khác"
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
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Quản Lý Giấy Chứng Nhận</h1>
              <p className="text-gray-200">Thêm và quản lý chứng nhận</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white/90 backdrop-blur-md text-[#4A3F35] hover:bg-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Chứng Nhận
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : certificates.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-shadow border-0 bg-white/70 backdrop-blur-xl">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm">
                    {cert.image_url ? (
                      <img src={cert.image_url} alt={cert.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-16 h-16 text-[#D4AF37]/30" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(cert)}
                        className="bg-white/90 backdrop-blur-md hover:bg-white h-8 w-8 shadow-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn xóa chứng nhận này?")) {
                            deleteMutation.mutate(cert.id);
                          }
                        }}
                        className="bg-white/90 backdrop-blur-md hover:bg-red-50 text-red-500 h-8 w-8 shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-white/60 backdrop-blur-sm">
                    <Badge variant="outline" className="mb-2 bg-white/50 backdrop-blur-sm">
                      {typeLabels[cert.certificate_type]}
                    </Badge>
                    <h3 className="font-bold text-[#4A3F35] mb-2">{cert.name}</h3>
                    {cert.issued_by && (
                      <p className="text-sm text-gray-600 mb-1">Cấp bởi: {cert.issued_by}</p>
                    )}
                    {cert.issued_date && (
                      <p className="text-sm text-gray-600">
                        Ngày cấp: {new Date(cert.issued_date).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
              <Award className="w-12 h-12 text-[#D4AF37]/30" />
            </div>
            <p className="text-gray-500 text-lg">Chưa có chứng nhận nào</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingCert ? "Chỉnh Sửa Chứng Nhận" : "Thêm Chứng Nhận Mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Tên Chứng Nhận *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="VD: Chứng nhận ISO 9001"
                className="mt-2 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <div>
              <Label>Mô Tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả chi tiết về chứng nhận..."
                className="mt-2 h-24 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <div>
              <Label>Ảnh Chứng Nhận *</Label>
              <div className="mt-2 space-y-3">
                {formData.image_url && (
                  <img src={formData.image_url} alt="Certificate" className="w-full aspect-[4/3] object-cover rounded-lg border border-white/30" />
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="flex-1">
                    <Button type="button" variant="outline" className="w-full bg-white/80 backdrop-blur-sm" disabled={uploadingImage} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingImage ? "Đang upload..." : "Upload Ảnh"}
                      </span>
                    </Button>
                  </label>
                  {formData.image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({...formData, image_url: ""})}
                      className="bg-white/80 backdrop-blur-sm"
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Đơn Vị Cấp</Label>
                <Input
                  value={formData.issued_by}
                  onChange={(e) => setFormData({...formData, issued_by: e.target.value})}
                  placeholder="VD: Bộ Y Tế"
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label>Ngày Cấp</Label>
                <Input
                  type="date"
                  value={formData.issued_date}
                  onChange={(e) => setFormData({...formData, issued_date: e.target.value})}
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Loại Chứng Nhận *</Label>
                <Select value={formData.certificate_type} onValueChange={(value) => setFormData({...formData, certificate_type: value})}>
                  <SelectTrigger className="mt-2 bg-white/80 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl">
                    <SelectItem value="quality">Chất Lượng</SelectItem>
                    <SelectItem value="safety">An Toàn</SelectItem>
                    <SelectItem value="origin">Xuất Xứ</SelectItem>
                    <SelectItem value="award">Giải Thưởng</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thứ Tự Hiển Thị</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: e.target.value})}
                  className="mt-2 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="bg-white/80 backdrop-blur-sm">
                Hủy
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
                {editingCert ? "Cập Nhật" : "Thêm Chứng Nhận"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
