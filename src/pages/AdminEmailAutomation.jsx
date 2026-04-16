import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, ArrowLeft, Plus, Edit, Trash2, Play, Pause, Clock, Users, TrendingUp, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminEmailAutomation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [flowForm, setFlowForm] = useState({
    name: "",
    flow_type: "welcome_series",
    trigger: "user_created",
    delay_hours: 0,
    subject: "",
    body: "",
    sequence_order: 1,
    is_active: true
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

  const { data: flows = [] } = useQuery({
    queryKey: ["email-flows"],
    queryFn: () => base44.entities.EmailFlow.list("-created_date"),
    enabled: !isCheckingAuth
  });

  const { data: emailLogs = [] } = useQuery({
    queryKey: ["email-logs"],
    queryFn: () => base44.entities.EmailLog.list("-created_date", 50),
    enabled: !isCheckingAuth
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders-for-automation"],
    queryFn: () => base44.entities.Order.list("-created_date", 100),
    enabled: !isCheckingAuth
  });

  const { data: loyaltyPoints = [] } = useQuery({
    queryKey: ["loyalty-for-automation"],
    queryFn: () => base44.entities.LoyaltyPoint.list(),
    enabled: !isCheckingAuth
  });

  const createFlowMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailFlow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-flows"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Tạo flow thành công!");
    },
    onError: () => toast.error("Lỗi tạo flow")
  });

  const updateFlowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailFlow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-flows"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Cập nhật flow thành công!");
    },
    onError: () => toast.error("Lỗi cập nhật flow")
  });

  const deleteFlowMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailFlow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-flows"] });
      toast.success("Xóa flow thành công!");
    },
    onError: () => toast.error("Lỗi xóa flow")
  });

  const runFlowMutation = useMutation({
    mutationFn: async (flow) => {
      let recipients = [];
      
      if (flow.flow_type === "welcome_series") {
        const allUsers = await base44.entities.User.list();
        recipients = allUsers.map(u => u.email);
      } else if (flow.flow_type === "post_purchase") {
        const recentOrders = orders.filter(o => 
          new Date(o.created_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        recipients = [...new Set(recentOrders.map(o => o.customer_email))];
      } else if (flow.flow_type === "cart_recovery") {
        const carts = await base44.entities.CartAbandonment.filter({ 
          email_sent: false,
          recovered: false 
        });
        recipients = carts.map(c => c.user_email);
      } else if (flow.flow_type === "loyalty_reward") {
        const goldMembers = loyaltyPoints.filter(lp => 
          lp.tier === "gold" || lp.tier === "platinum"
        );
        recipients = goldMembers.map(lp => lp.user_email);
      }

      let successCount = 0;
      for (const email of recipients) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: flow.subject,
            body: flow.body
          });
          
          await base44.entities.EmailLog.create({
            flow_id: flow.id,
            recipient_email: email,
            subject: flow.subject,
            status: "sent",
            sent_date: new Date().toISOString()
          });
          
          successCount++;
        } catch (err) {
          await base44.entities.EmailLog.create({
            flow_id: flow.id,
            recipient_email: email,
            subject: flow.subject,
            status: "failed",
            error_message: err.message
          });
        }
      }

      return { successCount, total: recipients.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
      toast.success(`Đã gửi ${data.successCount}/${data.total} emails thành công!`);
    },
    onError: () => toast.error("Lỗi chạy flow")
  });

  const resetForm = () => {
    setFlowForm({
      name: "",
      flow_type: "welcome_series",
      trigger: "user_created",
      delay_hours: 0,
      subject: "",
      body: "",
      sequence_order: 1,
      is_active: true
    });
    setEditingFlow(null);
  };

  const handleOpenDialog = (flow = null) => {
    if (flow) {
      setEditingFlow(flow);
      setFlowForm(flow);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingFlow) {
      updateFlowMutation.mutate({ id: editingFlow.id, data: flowForm });
    } else {
      createFlowMutation.mutate(flowForm);
    }
  };

  const flowTypeLabels = {
    welcome_series: "Chào mừng",
    post_purchase: "Sau mua hàng",
    cart_recovery: "Giỏ hàng bỏ quên",
    loyalty_reward: "Thưởng khách hàng thân thiết"
  };

  const triggerLabels = {
    user_created: "Người dùng mới",
    order_completed: "Hoàn tất đơn hàng",
    cart_abandoned: "Bỏ giỏ hàng",
    loyalty_tier_up: "Lên hạng thành viên"
  };

  const sentCount = emailLogs.filter(l => l.status === "sent").length;
  const failedCount = emailLogs.filter(l => l.status === "failed").length;
  const activeFlows = flows.filter(f => f.is_active).length;

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80">
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <Link to={createPageUrl("AdminDashboard")}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Email Automation</h1>
              <p className="text-gray-200">Quản lý các flow email tự động</p>
            </div>
            <Button onClick={() => handleOpenDialog()} className="bg-white text-[#4A3F35] hover:bg-gray-100">
              <Plus className="w-4 h-4 mr-2" />
              Tạo Flow Mới
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Play, label: "Flows Hoạt Động", value: activeFlows, color: "from-green-500 to-green-600" },
            { icon: Mail, label: "Email Đã Gửi", value: sentCount, color: "from-blue-500 to-blue-600" },
            { icon: CheckCircle, label: "Thành Công", value: sentCount, color: "from-emerald-500 to-emerald-600" },
            { icon: TrendingUp, label: "Thất Bại", value: failedCount, color: "from-red-500 to-red-600" }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="flows" className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-xl">
            <TabsTrigger value="flows">Email Flows</TabsTrigger>
            <TabsTrigger value="logs">Lịch Sử Gửi</TabsTrigger>
          </TabsList>

          <TabsContent value="flows" className="space-y-4">
            {flows.map((flow, index) => (
              <motion.div key={flow.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#4A3F35]">{flow.name}</h3>
                          <Badge className={flow.is_active ? "bg-green-500" : "bg-gray-400"}>
                            {flow.is_active ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                          <Badge variant="outline">{flowTypeLabels[flow.flow_type]}</Badge>
                        </div>
                        <p className="text-gray-600 mb-2"><strong>Trigger:</strong> {triggerLabels[flow.trigger]}</p>
                        <p className="text-gray-600 mb-2"><strong>Delay:</strong> {flow.delay_hours} giờ</p>
                        <p className="text-gray-600"><strong>Tiêu đề:</strong> {flow.subject}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => runFlowMutation.mutate(flow)} disabled={runFlowMutation.isPending} size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600">
                          <Play className="w-4 h-4 mr-2" />
                          Chạy Ngay
                        </Button>
                        <Button onClick={() => handleOpenDialog(flow)} variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => deleteFlowMutation.mutate(flow.id)} variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="logs">
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {emailLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{log.recipient_email}</p>
                        <p className="text-sm text-gray-600">{log.subject}</p>
                        <p className="text-xs text-gray-500">{new Date(log.sent_date || log.created_date).toLocaleString('vi-VN')}</p>
                      </div>
                      <Badge className={log.status === "sent" ? "bg-green-500" : "bg-red-500"}>
                        {log.status === "sent" ? "Thành công" : "Thất bại"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{editingFlow ? "Chỉnh Sửa Flow" : "Tạo Flow Mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tên Flow</Label>
              <Input value={flowForm.name} onChange={(e) => setFlowForm({...flowForm, name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại Flow</Label>
                <Select value={flowForm.flow_type} onValueChange={(v) => setFlowForm({...flowForm, flow_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome_series">Chào mừng</SelectItem>
                    <SelectItem value="post_purchase">Sau mua hàng</SelectItem>
                    <SelectItem value="cart_recovery">Giỏ hàng bỏ quên</SelectItem>
                    <SelectItem value="loyalty_reward">Thưởng khách thân thiết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trigger</Label>
                <Select value={flowForm.trigger} onValueChange={(v) => setFlowForm({...flowForm, trigger: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_created">Người dùng mới</SelectItem>
                    <SelectItem value="order_completed">Hoàn tất đơn hàng</SelectItem>
                    <SelectItem value="cart_abandoned">Bỏ giỏ hàng</SelectItem>
                    <SelectItem value="loyalty_tier_up">Lên hạng thành viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Delay (giờ)</Label>
              <Input type="number" value={flowForm.delay_hours} onChange={(e) => setFlowForm({...flowForm, delay_hours: parseInt(e.target.value)})} />
            </div>
            <div>
              <Label>Tiêu đề Email</Label>
              <Input value={flowForm.subject} onChange={(e) => setFlowForm({...flowForm, subject: e.target.value})} required />
            </div>
            <div>
              <Label>Nội dung Email</Label>
              <Textarea value={flowForm.body} onChange={(e) => setFlowForm({...flowForm, body: e.target.value})} rows={8} required />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={flowForm.is_active} onCheckedChange={(v) => setFlowForm({...flowForm, is_active: v})} />
              <Label>Kích hoạt ngay</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E]">
                {editingFlow ? "Cập Nhật" : "Tạo Flow"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}