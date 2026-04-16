import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Upload, Package, Sparkles, Edit2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function VariantsManager({ variants = [], packagingOptions = [], productSets = [], onChange }) {
  const [newVariant, setNewVariant] = useState({ name: "", pricing_type: "none", price_value: "", stock: "", image_url: "", discount_type: "", discount_value: "", freeship: false });
  const [newPackaging, setNewPackaging] = useState({ name: "", quantity: "", pricing_type: "fixed", price_value: "", description: "", discount_type: "", discount_value: "", freeship: false });
  const [newSet, setNewSet] = useState({ name: "", description: "", items: [], pricing_type: "fixed", price_value: "", image_url: "", discount_type: "", discount_value: "", freeship: false });
  const [newSetItem, setNewSetItem] = useState({ item_name: "", quantity: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSetImage, setUploadingSetImage] = useState(false);
  
  // Edit states
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingPackaging, setEditingPackaging] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const handleAddVariant = () => {
    if (!newVariant.name.trim()) {
      toast.error("Vui lòng nhập tên vị");
      return;
    }
    if (newVariant.pricing_type !== "none" && !newVariant.price_value) {
      toast.error("Vui lòng nhập giá");
      return;
    }
    
    const updatedVariants = [...variants, { 
      name: newVariant.name.trim(), 
      pricing_type: newVariant.pricing_type,
      price_value: newVariant.price_value ? parseFloat(newVariant.price_value) : 0,
      stock: parseInt(newVariant.stock) || 0,
      image_url: newVariant.image_url || "",
      discount_type: newVariant.discount_type || null,
      discount_value: newVariant.discount_value ? parseFloat(newVariant.discount_value) : null,
      freeship: newVariant.freeship || false
    }];
    
    onChange({
      variants: updatedVariants,
      packaging_options: packagingOptions,
      product_sets: productSets
    });
    
    setNewVariant({ name: "", pricing_type: "none", price_value: "", stock: "", image_url: "", discount_type: "", discount_value: "", freeship: false });
    toast.success("Đã thêm vị mới!");
  };

  const handleEditVariant = (index) => {
    setEditingVariant({ ...variants[index], freeship: variants[index].freeship || false, index });
    setEditDialogOpen(true);
  };

  const handleSaveVariant = () => {
    if (!editingVariant.name.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (editingVariant.pricing_type !== "none" && !editingVariant.price_value) {
      toast.error("Vui lòng nhập giá");
      return;
    }
    const updatedVariants = [...variants];
    updatedVariants[editingVariant.index] = {
      name: editingVariant.name.trim(),
      pricing_type: editingVariant.pricing_type,
      price_value: editingVariant.price_value ? parseFloat(editingVariant.price_value) : 0,
      stock: parseInt(editingVariant.stock) || 0,
      image_url: editingVariant.image_url || "",
      discount_type: editingVariant.discount_type || null,
      discount_value: editingVariant.discount_value ? parseFloat(editingVariant.discount_value) : null,
      freeship: editingVariant.freeship || false
    };
    onChange({ variants: updatedVariants, packaging_options: packagingOptions, product_sets: productSets });
    setEditDialogOpen(false);
    setEditingVariant(null);
    toast.success("Đã cập nhật vị!");
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    onChange({
      variants: updatedVariants,
      packaging_options: packagingOptions,
      product_sets: productSets
    });
    toast.success("Đã xóa vị");
  };

  const handleAddPackaging = () => {
    if (!newPackaging.name.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }
    if (!newPackaging.price_value) {
      toast.error("Vui lòng nhập giá");
      return;
    }
    
    const updatedPackaging = [...packagingOptions, { 
      name: newPackaging.name.trim(), 
      quantity: parseInt(newPackaging.quantity) || 1,
      pricing_type: newPackaging.pricing_type,
      price_value: parseFloat(newPackaging.price_value),
      description: newPackaging.description.trim() || "",
      discount_type: newPackaging.discount_type || null,
      discount_value: newPackaging.discount_value ? parseFloat(newPackaging.discount_value) : null,
      freeship: newPackaging.freeship || false
    }];
    
    onChange({
      variants: variants,
      packaging_options: updatedPackaging,
      product_sets: productSets
    });
    
    setNewPackaging({ name: "", quantity: "", pricing_type: "fixed", price_value: "", description: "", discount_type: "", discount_value: "", freeship: false });
    toast.success("Đã thêm nhóm đóng gói!");
  };

  const handleEditPackaging = (index) => {
    setEditingPackaging({ ...packagingOptions[index], freeship: packagingOptions[index].freeship || false, index });
    setEditDialogOpen(true);
  };

  const handleSavePackaging = () => {
    if (!editingPackaging.name.trim() || !editingPackaging.price_value) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const updatedPackaging = [...packagingOptions];
    updatedPackaging[editingPackaging.index] = {
      name: editingPackaging.name.trim(),
      quantity: parseInt(editingPackaging.quantity) || 1,
      pricing_type: editingPackaging.pricing_type,
      price_value: parseFloat(editingPackaging.price_value),
      description: editingPackaging.description.trim() || "",
      discount_type: editingPackaging.discount_type || null,
      discount_value: editingPackaging.discount_value ? parseFloat(editingPackaging.discount_value) : null,
      freeship: editingPackaging.freeship || false
    };
    onChange({ variants, packaging_options: updatedPackaging, product_sets: productSets });
    setEditDialogOpen(false);
    setEditingPackaging(null);
    toast.success("Đã cập nhật nhóm!");
  };

  const handleRemovePackaging = (index) => {
    const updatedPackaging = packagingOptions.filter((_, i) => i !== index);
    onChange({
      variants: variants,
      packaging_options: updatedPackaging,
      product_sets: productSets
    });
    toast.success("Đã xóa nhóm");
  };

  const handleEditSet = (index) => {
    setEditingSet({ ...productSets[index], freeship: productSets[index].freeship || false, index });
    setEditDialogOpen(true);
  };

  const handleSaveSet = () => {
    if (!editingSet.name.trim() || !editingSet.price_value) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    const updatedSets = [...productSets];
    updatedSets[editingSet.index] = {
      name: editingSet.name.trim(),
      description: editingSet.description.trim(),
      items: editingSet.items,
      pricing_type: editingSet.pricing_type,
      price_value: parseFloat(editingSet.price_value),
      image_url: editingSet.image_url || "",
      discount_type: editingSet.discount_type || null,
      discount_value: editingSet.discount_value ? parseFloat(editingSet.discount_value) : null,
      freeship: editingSet.freeship || false
    };
    onChange({ variants, packaging_options: packagingOptions, product_sets: updatedSets });
    setEditDialogOpen(false);
    setEditingSet(null);
    toast.success("Đã cập nhật set!");
  };

  const handleImageUpload = async (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (isEditing && editingVariant) {
        setEditingVariant({ ...editingVariant, image_url: result.file_url });
      } else {
        setNewVariant({ ...newVariant, image_url: result.file_url });
      }
      toast.success("Upload ảnh thành công!");
    } catch (error) {
      toast.error("Lỗi upload ảnh: " + (error.message || "Unknown"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSetImageUpload = async (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingSetImage(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (isEditing && editingSet) {
        setEditingSet({ ...editingSet, image_url: result.file_url });
      } else {
        setNewSet({ ...newSet, image_url: result.file_url });
      }
      toast.success("Upload ảnh set thành công!");
    } catch (error) {
      toast.error("Lỗi upload ảnh: " + (error.message || "Unknown"));
    } finally {
      setUploadingSetImage(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVariant && "Chỉnh Sửa Vị"}
              {editingPackaging && "Chỉnh Sửa Nhóm"}
              {editingSet && "Chỉnh Sửa Set"}
            </DialogTitle>
          </DialogHeader>
          
          {editingVariant && (
            <div className="space-y-4">
              <Input
                placeholder="Tên vị"
                value={editingVariant.name}
                onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-2">Cách định giá</label>
                <select
                  value={editingVariant.pricing_type}
                  onChange={(e) => setEditingVariant({ ...editingVariant, pricing_type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="none">Không thay đổi giá</option>
                  <option value="adjustment">Cộng thêm vào giá gốc</option>
                  <option value="fixed">Giá riêng</option>
                </select>
              </div>
              {editingVariant.pricing_type !== "none" && (
                <>
                <Input
                  type="number"
                  placeholder={editingVariant.pricing_type === "adjustment" ? "Số tiền cộng thêm (VND)" : "Giá riêng (VND)"}
                  value={editingVariant.price_value}
                  onChange={(e) => setEditingVariant({ ...editingVariant, price_value: e.target.value })}
                />
                <div className="p-3 bg-amber-50 rounded-lg space-y-2">
                  <p className="text-xs font-semibold text-amber-800">Giảm giá cho vị này (tuỳ chọn)</p>
                  <select className="w-full p-2 border rounded text-sm" value={editingVariant.discount_type || ""} onChange={(e) => setEditingVariant({...editingVariant, discount_type: e.target.value, discount_value: ""})}>
                    <option value="">Không giảm giá</option>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Giá trị (VND)</option>
                  </select>
                  {editingVariant.discount_type && (
                    <Input type="number" placeholder={editingVariant.discount_type === "percentage" ? "VD: 10" : "VD: 50000"} value={editingVariant.discount_value || ""} onChange={(e) => setEditingVariant({...editingVariant, discount_value: e.target.value})} />
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="Số lượng kho"
                  value={editingVariant.stock}
                onChange={(e) => setEditingVariant({ ...editingVariant, stock: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  disabled={uploadingImage}
                  className="hidden"
                  id="edit-variant-image"
                />
                <label htmlFor="edit-variant-image" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={uploadingImage} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? "Đang tải..." : editingVariant.image_url ? "✓ Đã có ảnh" : "Upload ảnh"}
                    </span>
                  </Button>
                </label>
              </div>
              {editingVariant.image_url && (
                <img src={editingVariant.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
              )}
              </>
              )}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <input type="checkbox" id="edit-variant-freeship" checked={editingVariant.freeship || false} onChange={(e) => setEditingVariant({...editingVariant, freeship: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="edit-variant-freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho vị này</label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveVariant} className="flex-1 bg-indigo-600">Lưu</Button>
                <Button onClick={() => { setEditDialogOpen(false); setEditingVariant(null); }} variant="outline" className="flex-1">Hủy</Button>
              </div>
            </div>
          )}

          {editingPackaging && (
            <div className="space-y-4">
              <Input
                placeholder="Tên nhóm"
                value={editingPackaging.name}
                onChange={(e) => setEditingPackaging({ ...editingPackaging, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Số lượng hũ"
                value={editingPackaging.quantity}
                onChange={(e) => setEditingPackaging({ ...editingPackaging, quantity: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-2">Cách định giá</label>
                <select
                  value={editingPackaging.pricing_type}
                  onChange={(e) => setEditingPackaging({ ...editingPackaging, pricing_type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="adjustment">Cộng thêm vào giá gốc</option>
                  <option value="fixed">Giá riêng</option>
                </select>
              </div>
              <Input
                type="number"
                placeholder={editingPackaging.pricing_type === "adjustment" ? "Số tiền cộng thêm (VND)" : "Giá riêng (VND)"}
                value={editingPackaging.price_value}
                onChange={(e) => setEditingPackaging({ ...editingPackaging, price_value: e.target.value })}
              />
              <div className="p-3 bg-amber-50 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-amber-800">Giảm giá cho nhóm này (tuỳ chọn)</p>
                <select className="w-full p-2 border rounded text-sm" value={editingPackaging.discount_type || ""} onChange={(e) => setEditingPackaging({...editingPackaging, discount_type: e.target.value, discount_value: ""})}>
                  <option value="">Không giảm giá</option>
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Giá trị (VND)</option>
                </select>
                {editingPackaging.discount_type && (
                  <Input type="number" placeholder={editingPackaging.discount_type === "percentage" ? "VD: 10" : "VD: 50000"} value={editingPackaging.discount_value || ""} onChange={(e) => setEditingPackaging({...editingPackaging, discount_value: e.target.value})} />
                )}
              </div>
              <Textarea
                placeholder="Mô tả"
                value={editingPackaging.description}
                onChange={(e) => setEditingPackaging({ ...editingPackaging, description: e.target.value })}
                className="h-20"
              />
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <input type="checkbox" id="edit-packaging-freeship" checked={editingPackaging.freeship || false} onChange={(e) => setEditingPackaging({...editingPackaging, freeship: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="edit-packaging-freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho nhóm này</label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSavePackaging} className="flex-1 bg-emerald-600">Lưu</Button>
                <Button onClick={() => { setEditDialogOpen(false); setEditingPackaging(null); }} variant="outline" className="flex-1">Hủy</Button>
              </div>
            </div>
          )}

          {editingSet && (
            <div className="space-y-4">
              <Input
                placeholder="Tên set"
                value={editingSet.name}
                onChange={(e) => setEditingSet({ ...editingSet, name: e.target.value })}
              />
              <Textarea
                placeholder="Mô tả set"
                value={editingSet.description}
                onChange={(e) => setEditingSet({ ...editingSet, description: e.target.value })}
                className="h-20"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Cách định giá</label>
                <select
                  value={editingSet.pricing_type}
                  onChange={(e) => setEditingSet({ ...editingSet, pricing_type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="adjustment">Cộng thêm vào giá gốc</option>
                  <option value="fixed">Giá riêng</option>
                </select>
              </div>
              <Input
                type="number"
                placeholder={editingSet.pricing_type === "adjustment" ? "Số tiền cộng thêm (VND)" : "Giá set (VND)"}
                value={editingSet.price_value}
                onChange={(e) => setEditingSet({ ...editingSet, price_value: e.target.value })}
              />
              <div className="p-3 bg-amber-50 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-amber-800">Giảm giá cho set này (tuỳ chọn)</p>
                <select className="w-full p-2 border rounded text-sm" value={editingSet.discount_type || ""} onChange={(e) => setEditingSet({...editingSet, discount_type: e.target.value, discount_value: ""})}>
                  <option value="">Không giảm giá</option>
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Giá trị (VND)</option>
                </select>
                {editingSet.discount_type && (
                  <Input type="number" placeholder={editingSet.discount_type === "percentage" ? "VD: 10" : "VD: 50000"} value={editingSet.discount_value || ""} onChange={(e) => setEditingSet({...editingSet, discount_value: e.target.value})} />
                )}
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-semibold mb-2">Nội dung set:</p>
                {editingSet.items?.map((item, i) => (
                  <p key={i} className="text-sm">• {item.quantity}x {item.item_name}</p>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSetImageUpload(e, true)}
                  disabled={uploadingSetImage}
                  className="hidden"
                  id="edit-set-image"
                />
                <label htmlFor="edit-set-image" className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={uploadingSetImage} asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingSetImage ? "Đang tải..." : editingSet.image_url ? "✓ Đã có ảnh" : "Upload ảnh set"}
                    </span>
                  </Button>
                </label>
              </div>
              {editingSet.image_url && (
                <img src={editingSet.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
              )}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <input type="checkbox" id="edit-set-freeship" checked={editingSet.freeship || false} onChange={(e) => setEditingSet({...editingSet, freeship: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="edit-set-freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho set này</label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveSet} className="flex-1 bg-amber-600">Lưu</Button>
                <Button onClick={() => { setEditDialogOpen(false); setEditingSet(null); }} variant="outline" className="flex-1">Hủy</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Variants Section */}
      <Card className="border-2 border-indigo-100 shadow-xl bg-gradient-to-br from-white to-indigo-50/30">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle className="text-xl flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            Các Vị Sản Phẩm (Giá Riêng)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {variants.length > 0 && (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-indigo-100 hover:border-indigo-300 transition-all shadow-sm">
                  {variant.image_url && (
                    <img src={variant.image_url} alt={variant.name} className="w-14 h-14 object-cover rounded-lg border-2 border-indigo-200" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{variant.name}</p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      {variant.pricing_type === "none" && <span className="text-gray-500">Không đổi giá</span>}
                      {variant.pricing_type === "adjustment" && <span className="font-medium text-emerald-700">+{formatPrice(variant.price_value || 0)}</span>}
                      {variant.pricing_type === "fixed" && <span className="font-medium text-indigo-700">Giá: {formatPrice(variant.price_value || 0)}</span>}
                      <span>• Kho: {variant.stock || 0}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditVariant(index)}
                    className="h-10 w-10 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVariant(index)}
                    className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Variant */}
          <div className="space-y-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-300">
            <p className="font-semibold text-gray-700 text-sm">Thêm Vị Mới</p>
            <Input
              placeholder="Tên vị (VD: Nguyên chất, Nhân sâm)"
              value={newVariant.name}
              onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
              className="bg-white border-indigo-200 focus:border-indigo-500"
            />
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Cách định giá</label>
              <select
                value={newVariant.pricing_type}
                onChange={(e) => setNewVariant({ ...newVariant, pricing_type: e.target.value })}
                className="w-full p-2 border border-indigo-200 rounded-lg bg-white"
              >
                <option value="none">Không thay đổi giá (chỉ chọn vị)</option>
                <option value="adjustment">Cộng thêm vào giá gốc</option>
                <option value="fixed">Giá riêng</option>
              </select>
            </div>
            {newVariant.pricing_type !== "none" && (
              <>
              <Input
                type="number"
                placeholder={newVariant.pricing_type === "adjustment" ? "Số tiền cộng thêm (VND)" : "Giá riêng (VND)"}
                value={newVariant.price_value}
                onChange={(e) => setNewVariant({ ...newVariant, price_value: e.target.value })}
                className="bg-white border-indigo-200 focus:border-indigo-500"
              />
              <div className="p-3 bg-amber-50 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-amber-800">Giảm giá cho vị này (tuỳ chọn)</p>
                <select className="w-full p-2 border rounded text-sm" value={newVariant.discount_type} onChange={(e) => setNewVariant({...newVariant, discount_type: e.target.value, discount_value: ""})}>
                  <option value="">Không giảm giá</option>
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Giá trị (VND)</option>
                </select>
                {newVariant.discount_type && (
                  <Input type="number" placeholder={newVariant.discount_type === "percentage" ? "VD: 10" : "VD: 50000"} value={newVariant.discount_value} onChange={(e) => setNewVariant({...newVariant, discount_value: e.target.value})} className="bg-white" />
                )}
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <input type="checkbox" id="new-variant-freeship" checked={newVariant.freeship} onChange={(e) => setNewVariant({...newVariant, freeship: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="new-variant-freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho vị này</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Số lượng kho"
                value={newVariant.stock}
                onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                className="bg-white border-indigo-200 focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  disabled={uploadingImage}
                  className="hidden"
                  id="variant-image"
                />
                <label htmlFor="variant-image" className="flex-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-indigo-200 hover:bg-indigo-50" 
                    disabled={uploadingImage}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingImage ? "Đang tải..." : newVariant.image_url ? "✓ Đã có ảnh" : "Upload ảnh"}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            </>
            )}
            <Button
              type="button"
              onClick={handleAddVariant}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm Vị
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packaging Options Section */}
      <Card className="border-2 border-emerald-100 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <CardTitle className="text-xl flex items-center gap-3">
            <Package className="w-6 h-6" />
            Nhóm Đóng Gói (Giá Riêng)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {packagingOptions.length > 0 && (
            <div className="space-y-3">
              {packagingOptions.map((pkg, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all shadow-sm">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{pkg.name}</p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span className="font-medium">Số lượng: {pkg.quantity} hũ</span>
                      {pkg.pricing_type === "adjustment" && <span className="text-emerald-700">• +{formatPrice(pkg.price_value || 0)}</span>}
                      {pkg.pricing_type === "fixed" && <span className="text-emerald-700">• Giá: {formatPrice(pkg.price_value || 0)}</span>}
                    </div>
                    {pkg.description && (
                      <p className="text-sm text-gray-500 mt-1 italic">{pkg.description}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPackaging(index)}
                    className="h-10 w-10 text-emerald-600 hover:bg-emerald-50 rounded-full"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePackaging(index)}
                    className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Packaging */}
          <div className="space-y-4 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-dashed border-emerald-300">
            <p className="font-semibold text-gray-700 text-sm">Thêm Nhóm Mới</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Tên nhóm (VD: 6 hũ, 10 hũ)"
                value={newPackaging.name}
                onChange={(e) => setNewPackaging({ ...newPackaging, name: e.target.value })}
                className="bg-white border-emerald-200 focus:border-emerald-500"
              />
              <Input
                type="number"
                placeholder="Số lượng hũ"
                value={newPackaging.quantity}
                onChange={(e) => setNewPackaging({ ...newPackaging, quantity: e.target.value })}
                className="bg-white border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Cách định giá</label>
              <select
                value={newPackaging.pricing_type}
                onChange={(e) => setNewPackaging({ ...newPackaging, pricing_type: e.target.value })}
                className="w-full p-2 border border-emerald-200 rounded-lg bg-white"
              >
                <option value="adjustment">Cộng thêm vào giá gốc</option>
                <option value="fixed">Giá riêng</option>
              </select>
            </div>
            <Input
              type="number"
              placeholder={newPackaging.pricing_type === "adjustment" ? "Số tiền cộng thêm (VND)" : "Giá riêng (VND)"}
              value={newPackaging.price_value}
              onChange={(e) => setNewPackaging({ ...newPackaging, price_value: e.target.value })}
              className="bg-white border-emerald-200 focus:border-emerald-500"
            />
            <div className="p-3 bg-amber-50 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-amber-800">Giảm giá cho nhóm này (tuỳ chọn)</p>
              <select className="w-full p-2 border rounded text-sm" value={newPackaging.discount_type} onChange={(e) => setNewPackaging({...newPackaging, discount_type: e.target.value, discount_value: ""})}>
                <option value="">Không giảm giá</option>
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Giá trị (VND)</option>
              </select>
              {newPackaging.discount_type && (
                <Input type="number" placeholder={newPackaging.discount_type === "percentage" ? "VD: 10" : "VD: 50000"} value={newPackaging.discount_value} onChange={(e) => setNewPackaging({...newPackaging, discount_value: e.target.value})} className="bg-white" />
              )}
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <input type="checkbox" id="new-packaging-freeship" checked={newPackaging.freeship} onChange={(e) => setNewPackaging({...newPackaging, freeship: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="new-packaging-freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho nhóm này</label>
            </div>
            <Textarea
              placeholder="Mô tả nhóm (VD: Tiết kiệm 10%...)"
              value={newPackaging.description}
              onChange={(e) => setNewPackaging({ ...newPackaging, description: e.target.value })}
              className="bg-white border-emerald-200 focus:border-emerald-500 h-20"
            />
            <Button
              type="button"
              onClick={handleAddPackaging}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm Nhóm Đóng Gói
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Sets Section */}
      <Card className="border-2 border-amber-100 shadow-xl bg-gradient-to-br from-white to-amber-50/30">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <CardTitle className="text-xl flex items-center gap-3">
            <Package className="w-6 h-6" />
            Bộ Sản Phẩm (Set Quà)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {productSets.length > 0 && (
            <div className="space-y-3">
              {productSets.map((set, index) => (
                <div key={index} className="p-4 bg-white rounded-xl border-2 border-amber-100 hover:border-amber-300 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-3 flex-1">
                      {set.image_url && (
                        <img src={set.image_url} alt={set.name} className="w-20 h-20 object-cover rounded-lg border-2 border-amber-200" />
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-lg">{set.name}</p>
                        {set.description && (
                          <p className="text-sm text-gray-600 mt-1">{set.description}</p>
                        )}
                        {set.price_value && (
                          <p className="text-lg font-bold text-[#D4AF37] mt-2">
                            {set.pricing_type === "adjustment" ? `+${formatPrice(set.price_value)}` : formatPrice(set.price_value)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSet(index)}
                        className="h-10 w-10 text-amber-600 hover:bg-amber-50 rounded-full"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updatedSets = productSets.filter((_, i) => i !== index);
                          onChange({ variants, packaging_options: packagingOptions, product_sets: updatedSets });
                          toast.success("Đã xóa set");
                        }}
                        className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  {set.items?.length > 0 && (
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-xs font-semibold text-amber-900 mb-2">Nội dung set:</p>
                      {set.items.map((item, i) => (
                        <p key={i} className="text-sm text-amber-700">
                          • {item.quantity}x {item.item_name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Set */}
          <div className="space-y-4 p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-dashed border-amber-300">
            <p className="font-semibold text-gray-700 text-sm">Thêm Set Mới</p>
            <Input
              placeholder="Tên set (VD: Set Quà Tết)"
              value={newSet.name}
              onChange={(e) => setNewSet({ ...newSet, name: e.target.value })}
              className="bg-white border-amber-200"
            />
            <Textarea
              placeholder="Mô tả set..."
              value={newSet.description}
              onChange={(e) => setNewSet({ ...newSet, description: e.target.value })}
              className="bg-white border-amber-200 h-20"
            />
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Cách định giá</label>
              <select
                value={newSet.pricing_type}
                onChange={(e) => setNewSet({ ...newSet, pricing_type: e.target.value })}
                className="w-full p-2 border border-amber-200 rounded-lg bg-white"
              >
                <option value="adjustment">Cộng thêm vào giá gốc</option>
                <option value="fixed">Giá riêng</option>
              </select>
            </div>
            <Input
              type="number"
              placeholder={newSet.pricing_type === "adjustment" ? "Số tiền cộng thêm (VND)" : "Giá set (VND)"}
              value={newSet.price_value}
              onChange={(e) => setNewSet({ ...newSet, price_value: e.target.value })}
              className="bg-white border-amber-200"
            />
            <div className="p-3 bg-amber-50 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-amber-800">Giảm giá cho set này (tuỳ chọn)</p>
              <select className="w-full p-2 border rounded text-sm" value={newSet.discount_type} onChange={(e) => setNewSet({...newSet, discount_type: e.target.value, discount_value: ""})}>
                <option value="">Không giảm giá</option>
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Giá trị (VND)</option>
              </select>
              {newSet.discount_type && (
                <Input type="number" placeholder={newSet.discount_type === "percentage" ? "VD: 10" : "VD: 50000"} value={newSet.discount_value} onChange={(e) => setNewSet({...newSet, discount_value: e.target.value})} className="bg-white" />
              )}
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <input type="checkbox" id="new-set-freeship" checked={newSet.freeship} onChange={(e) => setNewSet({...newSet, freeship: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="new-set-freeship" className="text-sm font-medium text-green-800 cursor-pointer">🚚 Miễn phí vận chuyển cho set này</label>
            </div>
            {/* Add items to set */}
            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <p className="font-semibold text-sm mb-3">Nội dung set:</p>
              {newSet.items.length > 0 && (
                <div className="space-y-2 mb-3">
                  {newSet.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                      <span className="text-sm">{item.quantity}x {item.item_name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNewSet({ 
                            ...newSet, 
                            items: newSet.items.filter((_, idx) => idx !== i) 
                          });
                        }}
                        className="h-6 w-6"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Tên món (VD: Hũ yến)"
                  value={newSetItem.item_name}
                  onChange={(e) => setNewSetItem({ ...newSetItem, item_name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="SL"
                  value={newSetItem.quantity}
                  onChange={(e) => setNewSetItem({ ...newSetItem, quantity: e.target.value })}
                  className="w-20"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!newSetItem.item_name.trim() || !newSetItem.quantity) return;
                    setNewSet({
                      ...newSet,
                      items: [...newSet.items, {
                        item_name: newSetItem.item_name.trim(),
                        quantity: parseInt(newSetItem.quantity)
                      }]
                    });
                    setNewSetItem({ item_name: "", quantity: "" });
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Upload set image */}
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleSetImageUpload(e, false)}
                disabled={uploadingSetImage}
                className="hidden"
                id="set-image-upload"
              />
              <label htmlFor="set-image-upload" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-amber-200 hover:bg-amber-50"
                  disabled={uploadingSetImage}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingSetImage ? "Đang tải..." : newSet.image_url ? "✓ Đã có ảnh" : "Upload ảnh set"}
                  </span>
                </Button>
              </label>
            </div>
            {newSet.image_url && (
              <img src={newSet.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
            )}

            <Button
              type="button"
              onClick={() => {
                if (!newSet.name.trim()) {
                  toast.error("Vui lòng nhập tên set");
                  return;
                }
                if (!newSet.price_value) {
                  toast.error("Vui lòng nhập giá set");
                  return;
                }
                if (newSet.items.length === 0) {
                  toast.error("Vui lòng thêm ít nhất 1 món vào set");
                  return;
                }

                const updatedSets = [...productSets, {
                  name: newSet.name.trim(),
                  description: newSet.description.trim(),
                  items: newSet.items,
                  pricing_type: newSet.pricing_type,
                  price_value: parseFloat(newSet.price_value),
                  image_url: newSet.image_url || "",
                  discount_type: newSet.discount_type || null,
                  discount_value: newSet.discount_value ? parseFloat(newSet.discount_value) : null,
                  freeship: newSet.freeship || false
                }];

                onChange({
                  variants,
                  packaging_options: packagingOptions,
                  product_sets: updatedSets
                });

                setNewSet({ name: "", description: "", items: [], pricing_type: "fixed", price_value: "", image_url: "", discount_type: "", discount_value: "", freeship: false });
                setNewSetItem({ item_name: "", quantity: "" });
                toast.success("Đã thêm set sản phẩm!");
              }}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm Set Sản Phẩm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}