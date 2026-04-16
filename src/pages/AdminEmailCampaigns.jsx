import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Send, Users } from "lucide-react";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminEmailCampaigns() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    target: "all" // all, customers, abandoned_cart
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

  const { data: orders = [] } = useQuery({
    queryKey: ["all-orders"],
    queryFn: () => base44.entities.Order.list(),
    enabled: !isCheckingAuth
  });

  const { data: abandonedCarts = [] } = useQuery({
    queryKey: ["abandoned-carts"],
    queryFn: () => base44.entities.CartAbandonment.filter({ email_sent: false }),
    enabled: !isCheckingAuth
  });

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      let recipients = [];

      if (formData.target === "all") {
        const uniqueEmails = [...new Set(orders.map(o => o.customer_email))];
        recipients = uniqueEmails;
      } else if (formData.target === "customers") {
        const uniqueEmails = [...new Set(orders.filter(o => o.status === "delivered").map(o => o.customer_email))];
        recipients = uniqueEmails;
      } else if (formData.target === "abandoned_cart") {
        recipients = abandonedCarts.map(c => c.user_email);
      }

      let successCount = 0;
      for (const email of recipients) {
        try {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: formData.subject,
            body: formData.body
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
        }
      }

      toast.success(`Đã gửi ${successCount}/${recipients.length} email thành công!`);
      setFormData({ subject: "", body: "", target: "all" });
    } catch (error) {
      toast.error("Lỗi gửi email: " + error.message);
    } finally {
      setSending(false);
    }
  };

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  const customerCount = [...new Set(orders.map(o => o.customer_email))].length;
  const loyalCustomerCount = [...new Set(orders.filter(o => o.status === "delivered").map(o => o.customer_email))].length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80">
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to={createPageUrl("AdminDashboard")}>
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Email Marketing</h1>
          <p className="text-gray-200">Gửi chiến dịch email đến khách hàng</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{customerCount}</p>
              <p className="text-sm text-gray-600">Tổng khách hàng</p>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{loyalCustomerCount}</p>
              <p className="text-sm text-gray-600">Khách hàng trung thành</p>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Send className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{abandonedCarts.length}</p>
              <p className="text-sm text-gray-600">Giỏ hàng bỏ quên</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Tạo Chiến Dịch Email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendCampaign} className="space-y-6">
              <div>
                <Label>Đối tượng nhận</Label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({...formData, target: e.target.value})}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="all">Tất cả khách hàng ({customerCount})</option>
                  <option value="customers">Khách hàng trung thành ({loyalCustomerCount})</option>
                  <option value="abandoned_cart">Giỏ hàng bỏ quên ({abandonedCarts.length})</option>
                </select>
              </div>

              <div>
                <Label>Tiêu đề email *</Label>
                <Input
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="VD: 🎁 Ưu đãi đặc biệt dành cho bạn"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Nội dung email *</Label>
                <Textarea
                  required
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                  placeholder="Viết nội dung email của bạn..."
                  className="mt-2 h-64"
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 Mẹo: Sử dụng HTML để định dạng email đẹp hơn
                </p>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white py-6"
              >
                <Send className="w-5 h-5 mr-2" />
                {sending ? "Đang gửi..." : "Gửi Email"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}