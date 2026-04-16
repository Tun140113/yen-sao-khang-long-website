import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

const DEFAULT_METHODS = [
  { name: "Giao hàng tiêu chuẩn", price: 25000, estimatedTime: "3–5 ngày", is_active: true },
  { name: "Giao hàng nhanh", price: 45000, estimatedTime: "1–2 ngày", is_active: true },
  { name: "Giao trong ngày", price: 75000, estimatedTime: "Trong ngày", is_active: true },
];

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function AdminShippingMethods() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", estimatedTime: "" });
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    (async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.pathname); return; }
      const user = await base44.auth.me();
      if (user.role !== "admin") { navigate(createPageUrl("Home")); return; }
      setIsCheckingAuth(false);
    })();
  }, []);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: () => base44.entities.ShippingMethod.list(),
    enabled: !isCheckingAuth,
    onSuccess: async (data) => {
      if (data.length === 0 && !seeded) {
        setSeeded(true);
        await Promise.all(DEFAULT_METHODS.map(m => base44.entities.ShippingMethod.create(m)));
        queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      }
    }
  });

  // Seed defaults if empty after first load
  useEffect(() => {
    if (!isLoading && methods.length === 0 && !seeded && !isCheckingAuth) {
      setSeeded(true);
      Promise.all(DEFAULT_METHODS.map(m => base44.entities.ShippingMethod.create(m))).then(() => {
        queryClient.invalidateQueries({ queryKey: ["shipping-methods"] });
      });
    }
  }, [isLoading, methods, seeded, isCheckingAuth]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShippingMethod.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shipping-methods"] }); toast.success("Đã thêm phương thức vận chuyển"); setEditItem(null); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShippingMethod.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shipping-methods"] }); toast.success("Đã cập nhật"); setEditItem(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ShippingMethod.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shipping-methods"] }); toast.success("Đã xóa"); setDeleteItem(null); }
  });

  const openCreate = () => {
    setForm({ name: "", price: "", estimatedTime: "" });
    setEditItem({ _new: true });
  };

  const openEdit = (m) => {
    setForm({ name: m.name, price: String(m.price), estimatedTime: m.estimatedTime || "" });
    setEditItem(m);
  };

  const handleSave = () => {
    const data = { name: form.name, price: Number(form.price), estimatedTime: form.estimatedTime, is_active: true };
    if (editItem._new) createMutation.mutate(data);
    else updateMutation.mutate({ id: editItem.id, data });
  };

  if (isCheckingAuth) return <LoadingScreen message="Đang xác thực..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6" style={{ fontFamily: "'Lora', serif" }}>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("AdminDashboard"))} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Truck className="w-7 h-7 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Phương Thức Vận Chuyển</h1>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Thêm mới
          </Button>
        </div>

        <div className="space-y-3">
          {methods.map((m) => (
            <Card key={m.id} className="border-0 shadow-md bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-lg">{m.name}</p>
                  {m.estimatedTime && <p className="text-sm text-gray-500">⏱ {m.estimatedTime}</p>}
                  <p className="text-amber-600 font-bold mt-1">{formatPrice(m.price)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setDeleteItem(m)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {methods.length === 0 && !isLoading && (
            <p className="text-center text-gray-400 py-12">Chưa có phương thức vận chuyển nào</p>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?._new ? "Thêm phương thức mới" : "Chỉnh sửa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Tên phương thức *</Label>
              <Input className="mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Giao hàng tiêu chuẩn" />
            </div>
            <div>
              <Label>Phí vận chuyển (VND) *</Label>
              <Input className="mt-1" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="25000" />
            </div>
            <div>
              <Label>Thời gian giao hàng</Label>
              <Input className="mt-1" value={form.estimatedTime} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="3–5 ngày" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.price} className="bg-amber-600 hover:bg-amber-700 text-white">
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p>Bạn có chắc muốn xóa "{deleteItem?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Hủy</Button>
            <Button onClick={() => deleteMutation.mutate(deleteItem.id)} className="bg-red-600 hover:bg-red-700 text-white">
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}