
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
import { ArrowLeft, Plus, Edit, Trash2, Film, Upload, Star } from "lucide-react";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminVideos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_type: "youtube",
    youtube_url: "",
    video_url: "",
    thumbnail_url: "",
    category: "product_intro",
    is_featured: false,
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

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => base44.entities.Video.list("order"),
    enabled: !isCheckingAuth
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Video.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Video.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Video.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    },
  });

  const handleOpenDialog = (video = null) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        title: video.title || "",
        description: video.description || "",
        video_type: video.video_type || "youtube",
        youtube_url: video.youtube_url || "",
        video_url: video.video_url || "",
        thumbnail_url: video.thumbnail_url || "",
        category: video.category || "product_intro",
        is_featured: video.is_featured || false,
        order: video.order || 0
      });
    } else {
      setEditingVideo(null);
      setFormData({
        title: "",
        description: "",
        video_type: "youtube",
        youtube_url: "",
        video_url: "",
        thumbnail_url: "",
        category: "product_intro",
        is_featured: false,
        order: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVideo(null);
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingThumbnail(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({...formData, thumbnail_url: result.file_url});
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      alert("Lỗi upload ảnh");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      order: parseInt(formData.order) || 0
    };

    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const categoryLabels = {
    product_intro: "Giới Thiệu Sản Phẩm",
    customer_review: "Đánh Giá Khách Hàng",
    tutorial: "Hướng Dẫn",
    brand_story: "Câu Chuyện Thương Hiệu"
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
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Quản Lý Video</h1>
              <p className="text-gray-200">Thêm và quản lý video</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white/90 backdrop-blur-md text-[#4A3F35] hover:bg-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Video
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : videos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-shadow border-0 bg-white/70 backdrop-blur-xl">
                  <div className="relative aspect-video bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-16 h-16 text-[#D4AF37]/30" />
                      </div>
                    )}
                    {video.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-[#D4AF37]">
                        <Star className="w-3 h-3 mr-1" />
                        Nổi bật
                      </Badge>
                    )}
                    <div className="absolute top-2 left-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(video)}
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
                          if (confirm("Bạn có chắc muốn xóa video này?")) {
                            deleteMutation.mutate(video.id);
                          }
                        }}
                        className="bg-white/90 backdrop-blur-md hover:bg-red-50 text-red-500 h-8 w-8 shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4 bg-white/60 backdrop-blur-sm">
                    <h3 className="font-bold text-[#4A3F35] mb-2 line-clamp-2">{video.title}</h3>
                    <Badge variant="outline" className="mb-2">
                      {categoryLabels[video.category]}
                    </Badge>
                    {video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
              <Film className="w-12 h-12 text-[#D4AF37]/30" />
            </div>
            <p className="text-gray-500 text-lg">Chưa có video nào</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Chỉnh Sửa Video" : "Thêm Video Mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Tiêu Đề *</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Tên video"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Mô Tả</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Mô tả video..."
                className="mt-2 h-24"
              />
            </div>

            <div>
              <Label>Loại Video *</Label>
              <Select value={formData.video_type} onValueChange={(value) => setFormData({...formData, video_type: value})}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="upload">Upload File</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.video_type === "youtube" ? (
              <div>
                <Label>Link YouTube *</Label>
                <Input
                  required={formData.video_type === "youtube"}
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-2"
                />
              </div>
            ) : (
              <div>
                <Label>URL Video *</Label>
                <Input
                  required={formData.video_type === "upload"}
                  value={formData.video_url}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="URL video đã upload"
                  className="mt-2"
                />
              </div>
            )}

            <div>
              <Label>Ảnh Thumbnail</Label>
              <div className="mt-2 space-y-3">
                {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full aspect-video object-cover rounded-lg" />
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={uploadingThumbnail}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  <label htmlFor="thumbnail-upload" className="flex-1">
                    <Button type="button" variant="outline" className="w-full" disabled={uploadingThumbnail} asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingThumbnail ? "Đang upload..." : "Upload Ảnh"}
                      </span>
                    </Button>
                  </label>
                  {formData.thumbnail_url && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({...formData, thumbnail_url: ""})}
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Danh Mục *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_intro">Giới Thiệu Sản Phẩm</SelectItem>
                    <SelectItem value="customer_review">Đánh Giá Khách Hàng</SelectItem>
                    <SelectItem value="tutorial">Hướng Dẫn</SelectItem>
                    <SelectItem value="brand_story">Câu Chuyện Thương Hiệu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thứ Tự Hiển Thị</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_featured" className="cursor-pointer">Hiển thị nổi bật</Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Hủy
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
                {editingVideo ? "Cập Nhật" : "Thêm Video"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
