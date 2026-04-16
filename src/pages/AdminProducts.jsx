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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Upload, Sparkles, Wand2, Link as LinkIcon, Package } from "lucide-react";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";
import VariantsManager from "@/components/admin/VariantsManager";

export default function AdminProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [imageMethod, setImageMethod] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ total: 0, done: 0, failed: 0 });
  const [importErrors, setImportErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    full_description: "",
    price: "",
    category: "raw",
    image_url: "",
    images: [],
    weight: "",
    ingredients: "",
    nutrition_info: "",
    stock: "",
    is_featured: false,
    popularity_score: 0,
    variants: [],
    packaging_options: [],
    product_sets: [],
    discount_type: "",
    discount_value: "",
    category_freeship: false
  });

  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    const pushField = () => {
      row.push(field);
      field = "";
    };

    const pushRow = () => {
      if (row.length === 1 && row[0] === "") {
        row = [];
        return;
      }
      rows.push(row);
      row = [];
    };

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          const next = text[i + 1];
          if (next === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        continue;
      }

      if (ch === ",") {
        pushField();
        continue;
      }

      if (ch === "\r") continue;

      if (ch === "\n") {
        pushField();
        pushRow();
        continue;
      }

      field += ch;
    }

    pushField();
    pushRow();

    if (rows.length === 0) return [];
    const header = rows[0].map((h) => String(h || "").trim());
    return rows
      .slice(1)
      .filter((r) => r.some((v) => String(v ?? "").trim() !== ""))
      .map((r) => {
        const obj = {};
        for (let c = 0; c < header.length; c++) {
          obj[header[c]] = r[c] ?? "";
        }
        return obj;
      });
  };

  const toBool = (value) => {
    const s = String(value ?? "").trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  };

  const toNumber = (value) => {
    const s = String(value ?? "").trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const parseJsonMaybe = (value, fallback) => {
    const s = String(value ?? "").trim();
    if (!s) return fallback;
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  };

  const slugify = (input) => {
    return String(input ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);
  };

  const buildProductFromCsvRow = (r) => {
    const name = String(r.name ?? "").trim();
    const category = String(r.category ?? "").trim();
    const price = toNumber(r.price);
    if (!name || !category || price == null) return null;

    const images = parseJsonMaybe(r.images, []);
    const variants = parseJsonMaybe(r.variants, []);
    const packaging_options = parseJsonMaybe(r.packaging_options, []);
    const product_sets = parseJsonMaybe(r.product_sets, []);

    const discount_type = String(r.discount_type ?? "").trim() || null;
    const discount_value = toNumber(r.discount_value);
    const slug = String(r.slug ?? "").trim() || slugify(name);

    return {
      name,
      slug,
      meta_title: String(r.meta_title ?? "").trim() || null,
      meta_description: String(r.meta_description ?? "").trim() || null,
      description: String(r.description ?? "").trim() || null,
      full_description: String(r.full_description ?? "").trim() || null,
      price,
      discount_type: discount_type === "percentage" || discount_type === "fixed" ? discount_type : null,
      discount_value: discount_value ?? null,
      category_freeship: toBool(r.category_freeship),
      category,
      image_url: String(r.image_url ?? "").trim() || null,
      images: Array.isArray(images) ? images : [],
      weight: String(r.weight ?? "").trim() || null,
      ingredients: String(r.ingredients ?? "").trim() || null,
      nutrition_info: String(r.nutrition_info ?? "").trim() || null,
      stock: toNumber(r.stock) ?? null,
      is_featured: toBool(r.is_featured),
      popularity_score: toNumber(r.popularity_score) ?? 0,
      variants: Array.isArray(variants) ? variants : [],
      packaging_options: Array.isArray(packaging_options) ? packaging_options : [],
      product_sets: Array.isArray(product_sets) ? product_sets : []
    };
  };

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

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => base44.entities.Product.list("-created_date"),
    enabled: !isCheckingAuth
  });

  const products = allProducts.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleImportCsv = async () => {
    if (!importFile) {
      alert("Chọn file CSV trước đã bro");
      return;
    }

    setIsImporting(true);
    setImportErrors([]);
    setImportProgress({ total: 0, done: 0, failed: 0 });

    try {
      const text = await importFile.text();
      const rows = parseCsv(text);
      const existingSlugs = new Set((allProducts || []).map((p) => p.slug).filter(Boolean));

      const toCreate = [];
      for (const r of rows) {
        if (toBool(r.is_sample)) continue;
        const product = buildProductFromCsvRow(r);
        if (!product) continue;
        if (product.slug && existingSlugs.has(product.slug)) continue;
        toCreate.push(product);
      }

      const concurrency = 3;
      let index = 0;
      let done = 0;
      let failed = 0;
      const errors = [];

      setImportProgress({ total: toCreate.length, done: 0, failed: 0 });

      const worker = async () => {
        while (index < toCreate.length) {
          const current = toCreate[index];
          index++;
          try {
            await base44.entities.Product.create(current);
            done++;
          } catch (e) {
            failed++;
            errors.push({
              name: current?.name,
              slug: current?.slug,
              message: e?.message || "Create failed"
            });
          }
          setImportProgress({ total: toCreate.length, done, failed });
        }
      };

      await Promise.all(Array.from({ length: concurrency }).map(() => worker()));
      setImportErrors(errors);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      alert(`Import xong: tạo ${done}/${toCreate.length}, lỗi ${failed}.`);
    } catch (e) {
      console.error(e);
      alert("Import CSV lỗi. Mở console xem chi tiết.");
    } finally {
      setIsImporting(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
  });

  const handleGenerateContent = async (field) => {
    if (!formData.name) {
      alert("Vui lòng nhập tên sản phẩm trước");
      return;
    }

    setGeneratingAI(true);
    try {
      let prompt = "";
      
      if (field === "description") {
        prompt = `Write a short, attractive description (2-3 sentences) for a bird's nest product called "${formData.name}". 
        Focus on premium quality and health benefits. Write in Vietnamese language. Return only the description text, no extra formatting.`;
      } else if (field === "full_description") {
        prompt = `Write a detailed description (5-7 sentences) for a bird's nest product called "${formData.name}". 
        Include: origin, production process, health benefits, and usage. 
        Write in a premium, professional style in Vietnamese language. Return only the description text, no extra formatting.`;
      } else if (field === "marketing") {
        prompt = `Write an attractive marketing copy (3-4 sentences) for a bird's nest product called "${formData.name}". 
        Create a sense of luxury, trust, emphasize premium quality and health benefits.
        Write in Vietnamese language. Return only the marketing text, no extra formatting.`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const content = typeof result === 'string' ? result : (result.content || result.text || JSON.stringify(result));

      if (field === "marketing") {
        alert(`Marketing Copy:\n\n${content.trim()}`);
      } else {
        setFormData({...formData, [field]: content.trim()});
      }
    } catch (error) {
      console.error("Error generating content:", error);
      alert(`Lỗi tạo nội dung AI: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        full_description: product.full_description || "",
        price: product.price || "",
        category: product.category || "raw",
        image_url: product.image_url || "",
        images: product.images || [],
        weight: product.weight || "",
        ingredients: product.ingredients || "",
        nutrition_info: product.nutrition_info || "",
        stock: product.stock || "",
        is_featured: product.is_featured || false,
        popularity_score: product.popularity_score || 0,
        variants: product.variants || [],
        packaging_options: product.packaging_options || [],
        product_sets: product.product_sets || [],
        discount_type: product.discount_type || "",
        discount_value: product.discount_value || "",
        category_freeship: product.category_freeship || false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        full_description: "",
        price: "",
        category: "raw",
        image_url: "",
        images: [],
        weight: "",
        ingredients: "",
        nutrition_info: "",
        stock: "",
        is_featured: false,
        popularity_score: 0,
        variants: [],
        packaging_options: [],
        product_sets: [],
        discount_type: "",
        discount_value: "",
        category_freeship: false
      });
    }
    setImageMethod("upload");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: result.file_url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Lỗi upload ảnh: " + (error.message || ""));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleAdditionalImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const currentCount = formData.images?.length || 0;
    if (currentCount + files.length > 5) {
      alert("Chỉ được tải lên tối đa 5 hình ảnh");
      e.target.value = "";
      return;
    }
    setUploadingImage(true);
    try {
      const urls = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        urls.push(result.file_url);
      }
      setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    } catch (error) {
      alert("Lỗi upload ảnh: " + (error.message || ""));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      stock: formData.stock ? parseInt(formData.stock) : null,
      popularity_score: parseInt(formData.popularity_score) || 0,
      discount_type: formData.discount_type || null,
      discount_value: formData.discount_value !== "" ? parseFloat(formData.discount_value) : null
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
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
              <h1 className="text-3xl font-bold mb-2">Quản Lý Sản Phẩm</h1>
              <p className="text-gray-200">Thêm và quản lý sản phẩm yến sào</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-white/90 backdrop-blur-md text-[#4A3F35] hover:bg-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Sản Phẩm
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CSV Import */}
        <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#D4AF37]" />
              Import sản phẩm từ CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Label>Chọn file CSV (export từ Base44)</Label>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="mt-2 bg-white/80"
                  disabled={isImporting}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Home chỉ hiện “nổi bật” nếu <span className="font-mono">is_featured=true</span>.
                </p>
              </div>
              <Button
                onClick={handleImportCsv}
                disabled={!importFile || isImporting}
                className="bg-white/90 backdrop-blur-md text-[#4A3F35] hover:bg-white shadow-lg"
              >
                {isImporting ? "Đang import..." : "Import CSV"}
              </Button>
            </div>

            {importProgress.total > 0 ? (
              <div className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                Tiến độ: {importProgress.done}/{importProgress.total} • Lỗi: {importProgress.failed}
              </div>
            ) : null}

            {importErrors.length > 0 ? (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                <div className="font-semibold mb-2">Một số dòng lỗi:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {importErrors.slice(0, 5).map((er, idx) => (
                    <li key={idx}>
                      {er.name || er.slug || "(unknown)"}: {er.message}
                    </li>
                  ))}
                </ul>
                {importErrors.length > 5 ? (
                  <div className="mt-2 text-xs">+{importErrors.length - 5} lỗi nữa (xem console)</div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tìm kiếm sản phẩm</Label>
                <Input
                  placeholder="Nhập tên sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2 bg-white/80"
                />
              </div>
              <div>
                <Label>Danh mục</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-2 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    <SelectItem value="raw">Yến sào thô</SelectItem>
                    <SelectItem value="ready_to_eat">Yến sào chế biến sẵn</SelectItem>
                    <SelectItem value="gift_sets">Bộ quà tặng</SelectItem>
                    <SelectItem value="supplements">Thực phẩm bổ sung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Tìm thấy {products.length} sản phẩm
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-md">
                  <div className="relative aspect-square bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl text-[#D4AF37]/30">燕</span>
                      </div>
                    )}
                    {product.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white border-0">
                        Nổi bật
                      </Badge>
                    )}
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                        className="bg-white/90 backdrop-blur-md hover:bg-white h-8 w-8 shadow-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
                            deleteMutation.mutate(product.id);
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
                      {product.category?.replace(/_/g, ' ')}
                    </Badge>
                    <h3 className="font-bold text-[#4A3F35] mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-[#D4AF37] mb-2">{formatPrice(product.price)}</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.variants?.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-purple-50">
                          {product.variants.length} vị
                        </Badge>
                      )}
                      {product.packaging_options?.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          {product.packaging_options.length} nhóm
                        </Badge>
                      )}
                    </div>
                    {product.stock !== null && (
                      <p className="text-sm text-gray-600 mt-2">Kho: {product.stock}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[#F5E6D3]/80 to-[#F8F5F0]/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl">
              <span className="text-6xl text-[#D4AF37]/30">燕</span>
            </div>
            <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Chưa có sản phẩm</h3>
            <p className="text-[#6B5742]">Thêm sản phẩm đầu tiên của bạn</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm mb-6">
                <TabsTrigger value="basic">Thông Tin Cơ Bản</TabsTrigger>
                <TabsTrigger value="variants">
                  <Package className="w-4 h-4 mr-2" />
                  Vị & Nhóm
                </TabsTrigger>
                <TabsTrigger value="advanced">Chi Tiết</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-6">
                <div>
                  <Label>Tên Sản Phẩm *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Yến Sào Tinh Chế Cao Cấp"
                    className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Mô Tả Ngắn *</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateContent("description")}
                      disabled={generatingAI || !formData.name}
                      className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300 hover:from-purple-500/20 hover:to-blue-500/20"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      {generatingAI ? "Đang tạo..." : "AI Tạo"}
                    </Button>
                  </div>
                  <Textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Mô tả ngắn gọn về sản phẩm..."
                    className="mt-2 h-20 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Giá Gốc (VND) *</Label>
                    <Input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="VD: 500000"
                      className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                    />
                  </div>
                  <div>
                    <Label>Danh Mục *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl">
                        <SelectItem value="raw">Yến sào thô</SelectItem>
                        <SelectItem value="ready_to_eat">Yến sào chế biến sẵn</SelectItem>
                        <SelectItem value="gift_sets">Bộ quà tặng</SelectItem>
                        <SelectItem value="supplements">Thực phẩm bổ sung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Ảnh Sản Phẩm</Label>
                  <Tabs value={imageMethod} onValueChange={setImageMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/50 backdrop-blur-sm">
                      <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Link URL
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="mt-4 space-y-4">
                      {/* Main image */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Ảnh chính</p>
                        {formData.image_url && (
                          <div className="relative aspect-square w-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 mb-2">
                            <img src={formData.image_url} alt="Product" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                            id="image-upload-main"
                          />
                          <label htmlFor="image-upload-main">
                            <Button type="button" variant="outline" className="bg-white/80" disabled={uploadingImage} asChild>
                              <span><Upload className="w-4 h-4 mr-2" />{uploadingImage ? "Đang upload..." : "Chọn Ảnh Chính"}</span>
                            </Button>
                          </label>
                          {formData.image_url && (
                            <Button type="button" variant="outline" onClick={() => setFormData(p => ({...p, image_url: ""}))} className="bg-white/80">Xóa</Button>
                          )}
                        </div>
                      </div>

                      {/* Additional images */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Ảnh bổ sung ({formData.images?.length || 0}/5)</p>
                        {formData.images?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {formData.images.map((img, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                                  className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-bl-lg"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {(formData.images?.length || 0) < 5 && (
                          <>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleAdditionalImagesUpload}
                              disabled={uploadingImage}
                              className="hidden"
                              id="image-upload-extra"
                            />
                            <label htmlFor="image-upload-extra">
                              <Button type="button" variant="outline" className="bg-white/80" disabled={uploadingImage} asChild>
                                <span><Upload className="w-4 h-4 mr-2" />{uploadingImage ? "Đang upload..." : "Thêm Ảnh Bổ Sung"}</span>
                              </Button>
                            </label>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="url" className="mt-4 space-y-3">
                      <div>
                        <Input
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                        />
                        <p className="text-xs text-gray-500 mt-1">Dán link ảnh từ internet</p>
                      </div>
                      {formData.image_url && (
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-sm">
                          <img 
                            src={formData.image_url} 
                            alt="Product Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-red-500"><span>Link ảnh không hợp lệ</span></div>';
                            }}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              {/* Variants & Packaging Tab */}
              <TabsContent value="variants" className="space-y-6">
                <VariantsManager
                  variants={formData.variants}
                  packagingOptions={formData.packaging_options}
                  productSets={formData.product_sets}
                  onChange={(data) => setFormData({ ...formData, ...data })}
                />
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                {/* Discount Section */}
                <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50">
                  <Label className="text-base font-semibold text-[#4A3F35] mb-3 block">Giảm Giá (tuỳ chọn)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Loại giảm giá</Label>
                      <Select
                        value={formData.discount_type || ""}
                        onValueChange={(val) => setFormData(p => ({ ...p, discount_type: val, discount_value: "" }))}
                      >
                        <SelectTrigger className="mt-1 bg-white/80">
                          <SelectValue placeholder="Không giảm giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không giảm giá</SelectItem>
                          <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                          <SelectItem value="fixed">Giá trị (VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.discount_type && formData.discount_type !== "none" && (
                      <div>
                        <Label className="text-sm">
                          {formData.discount_type === "percentage" ? "Phần trăm giảm (%)" : "Số tiền giảm (VND)"}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={formData.discount_type === "percentage" ? 100 : undefined}
                          value={formData.discount_value}
                          onChange={(e) => setFormData(p => ({ ...p, discount_value: e.target.value }))}
                          placeholder={formData.discount_type === "percentage" ? "VD: 20" : "VD: 100000"}
                          className="mt-1 bg-white/80"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Mô Tả Chi Tiết</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateContent("full_description")}
                      disabled={generatingAI || !formData.name}
                      className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      {generatingAI ? "Đang tạo..." : "AI Tạo"}
                    </Button>
                  </div>
                  <Textarea
                    value={formData.full_description}
                    onChange={(e) => setFormData({...formData, full_description: e.target.value})}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    className="mt-2 h-32 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Trọng Lượng</Label>
                    <Input
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="VD: 100g"
                      className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                    />
                  </div>
                  <div>
                    <Label>Số Lượng Kho</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      placeholder="VD: 50"
                      className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-4">
                  <input
                    type="checkbox"
                    id="category_freeship"
                    checked={formData.category_freeship}
                    onChange={(e) => setFormData({...formData, category_freeship: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="category_freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho toàn bộ danh mục này</label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_featured" className="cursor-pointer">Sản phẩm nổi bật</Label>
                  </div>
                  <div className="flex-1">
                    <Label>Điểm phổ biến</Label>
                    <Input
                      type="number"
                      value={formData.popularity_score}
                      onChange={(e) => setFormData({...formData, popularity_score: e.target.value})}
                      placeholder="0-100"
                      className="mt-1 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#F5E6D3] mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog}
                className="bg-white/80 backdrop-blur-sm"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white shadow-lg hover:shadow-xl"
              >
                {editingProduct ? "Cập Nhật" : "Tạo Sản Phẩm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
