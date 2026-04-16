import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ShoppingBag, Package, DollarSign, MessageSquare, Tag, Film, Award, 
  User, Mail, Lock, Upload, LogOut, Shield, LayoutDashboard,
  ArrowRight, TrendingUp, Users, Calendar, BarChart3, Truck
} from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import LoadingScreen from "@/components/LoadingScreen";
import { logoutAndRedirect } from "@/lib/logout";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    avatar_url: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
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

      setCurrentUser(user);
      setProfileData({
        full_name: user.full_name || "",
        email: user.email || "",
        avatar_url: user.avatar_url || ""
      });
    } catch (error) {
      console.error("Auth error:", error);
      navigate(createPageUrl("Home"));
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => base44.entities.Product.list(),
    enabled: !isCheckingAuth && !!currentUser
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => base44.entities.Order.list("-created_date"),
    enabled: !isCheckingAuth && !!currentUser
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations-count"],
    queryFn: () => base44.entities.Conversation.list(),
    enabled: !isCheckingAuth && !!currentUser
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: result.file_url });
      setProfileData({ ...profileData, avatar_url: result.file_url });
      setCurrentUser({ ...currentUser, avatar_url: result.file_url });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Lỗi upload ảnh đại diện");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await base44.auth.updateMe({
        full_name: profileData.full_name
      });
      setCurrentUser({ ...currentUser, full_name: profileData.full_name });
      alert("Cập nhật profile thành công!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Lỗi cập nhật profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    alert("Chức năng đổi mật khẩu sẽ được triển khai sớm");
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleLogout = () => {
    logoutAndRedirect(createPageUrl("Home"));
  };

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  if (!currentUser) return null;

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const pendingOrders = orders.filter(order => order.status === "pending").length;
  const unreadChats = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.created_date);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }).length;

  const mainStats = [
    { title: "Tổng Doanh Thu", value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue), icon: DollarSign, color: "from-emerald-500 to-emerald-600", change: "+12%" },
    { title: "Đơn Hàng Hôm Nay", value: todayOrders, icon: Calendar, color: "from-blue-500 to-blue-600", change: "+5%" },
    { title: "Đơn Chờ Xử Lý", value: pendingOrders, icon: TrendingUp, color: "from-orange-500 to-orange-600", badge: true },
    { title: "Chat Chưa Đọc", value: unreadChats, icon: MessageSquare, color: "from-purple-500 to-purple-600", badge: true }
  ];

  const quickActions = [
    { title: "Sản Phẩm", value: products.length, icon: Package, page: "AdminProducts", color: "from-[#D4AF37] to-[#B8941E]" },
    { title: "Đơn Hàng", value: orders.length, icon: ShoppingBag, page: "AdminOrders", color: "from-blue-500 to-blue-600" },
    { title: "Chat", value: unreadChats, icon: MessageSquare, page: "AdminCustomerChat", color: "from-green-500 to-green-600", badge: unreadChats },
    { title: "Voucher", icon: Tag, page: "AdminVouchers", color: "from-purple-500 to-purple-600" },
    { title: "Email Marketing", icon: Mail, page: "AdminEmailCampaigns", color: "from-cyan-500 to-cyan-600" },
    { title: "Email Automation", icon: Mail, page: "AdminEmailAutomation", color: "from-indigo-500 to-indigo-600" },
    { title: "Video", icon: Film, page: "AdminVideos", color: "from-pink-500 to-pink-600" },
    { title: "Chứng Nhận", icon: Award, page: "AdminCertificates", color: "from-orange-500 to-orange-600" },
    { title: "Thanh Toán", icon: DollarSign, page: "AdminPaymentInfo", color: "from-emerald-500 to-emerald-600" },
    { title: "Vận Chuyển", icon: Truck, page: "AdminShippingMethods", color: "from-sky-500 to-sky-600" }
  ];

  const recentOrders = orders.slice(0, 5);

  // Analytics data
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_date);
      return orderDate.toDateString() === date.toDateString();
    });
    return {
      date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0) / 1000000
    };
  });

  const ordersByStatus = [
    { name: 'Chờ xử lý', value: orders.filter(o => o.status === 'pending').length, color: '#FCD34D' },
    { name: 'Đang xử lý', value: orders.filter(o => o.status === 'processing').length, color: '#60A5FA' },
    { name: 'Đã giao', value: orders.filter(o => o.status === 'delivered').length, color: '#34D399' },
    { name: 'Đã hủy', value: orders.filter(o => o.status === 'cancelled').length, color: '#EF4444' }
  ];

  const topProducts = products.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0)).slice(0, 5).map(p => ({
    name: p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name,
    sales: p.popularity_score || 0
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-3xl" style={{ fontFamily: "'Lora', serif" }}>
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-3 border-white/30 shadow-2xl">
                <AvatarImage src={currentUser.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#B8941E] text-white text-xl font-bold">
                  {currentUser.full_name?.charAt(0) || currentUser.email?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Xin chào, {currentUser.full_name || "Admin"}!</h1>
                <p className="text-white/80 text-sm">Quản lý cửa hàng của bạn</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to={createPageUrl("Home")}>
                <Button variant="outline" className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border-white/30">
                  Xem Cửa Hàng
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" className="bg-red-500/90 backdrop-blur-md text-white hover:bg-red-600 border-white/30">
                <LogOut className="w-4 h-4 mr-2" />
                Đăng Xuất
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/70 backdrop-blur-xl shadow-xl border border-white/30 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:to-[#B8941E] data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tổng Quan
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:to-[#B8941E] data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Phân Tích
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:to-[#B8941E] data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Hồ Sơ
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mainStats.map((stat, index) => (
                <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                    <CardContent className="p-6 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        {stat.change && <span className="text-sm font-semibold text-green-600">{stat.change}</span>}
                        {stat.badge && stat.value > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{stat.value}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions Grid */}
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Quản Lý Nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {quickActions.map((action) => (
                    <Link key={action.title} to={createPageUrl(action.page)}>
                      <Card className={`border-0 bg-gradient-to-br ${action.color} text-white hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden`}>
                        <CardContent className="p-6 relative z-10">
                          <action.icon className="w-8 h-8 mb-3 opacity-90" />
                          <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                          {action.value !== undefined && (
                            <p className="text-2xl font-bold">{action.value}</p>
                          )}
                          {action.badge > 0 && (
                            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                              {action.badge}
                            </span>
                          )}
                          <ArrowRight className="w-5 h-5 absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Đơn Hàng Gần Đây</CardTitle>
                  <Link to={createPageUrl("AdminOrders")}>
                    <Button variant="ghost" size="sm">Xem Tất Cả <ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {recentOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-md rounded-xl border border-white/30 hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8941E] rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                            <p className="text-sm text-gray-500">{new Date(order.created_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#D4AF37]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            order.status === "processing" ? "bg-blue-100 text-blue-800" :
                            order.status === "delivered" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Chưa có đơn hàng</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Revenue Chart */}
            <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle>Doanh Thu & Đơn Hàng 7 Ngày Qua</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={last7Days}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#6B5742" />
                    <YAxis yAxisId="left" stroke="#6B5742" />
                    <YAxis yAxisId="right" orientation="right" stroke="#6B5742" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRevenue)" name="Doanh thu (triệu VND)" />
                    <Bar yAxisId="right" dataKey="orders" fill="#B8941E" name="Đơn hàng" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle>Phân Bố Trạng Thái Đơn</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ordersByStatus.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle>Top 5 Sản Phẩm Phổ Biến</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#6B5742" />
                      <YAxis dataKey="name" type="category" width={150} stroke="#6B5742" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none' }}
                      />
                      <Bar dataKey="sales" fill="#D4AF37" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                <CardContent className="p-8 text-center">
                  <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/30 shadow-2xl">
                    <AvatarImage src={profileData.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-[#D4AF37] to-[#B8941E] text-white text-4xl">
                      {currentUser.full_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold text-[#4A3F35] mb-2">{currentUser.full_name || "Admin"}</h3>
                  <p className="text-sm text-[#6B5742] mb-4">{currentUser.email}</p>
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Shield className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm font-semibold text-[#D4AF37]">Administrator</span>
                  </div>
                  <Input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" id="avatar-upload" />
                  <label htmlFor="avatar-upload">
                    <Button type="button" disabled={uploadingAvatar} className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white" asChild>
                      <span><Upload className="w-4 h-4 mr-2" />{uploadingAvatar ? "Đang tải..." : "Đổi Ảnh"}</span>
                    </Button>
                  </label>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-[#D4AF37]" />Thông Tin</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <Label>Họ và Tên</Label>
                        <Input value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })} className="mt-2 bg-white/80 backdrop-blur-sm" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input value={profileData.email} disabled className="mt-2 pl-10 bg-gray-100/80" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">Cập Nhật</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-xl">
                  <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5 text-[#D4AF37]" />Đổi Mật Khẩu</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <Label>Mật Khẩu Hiện Tại</Label>
                        <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="mt-2 bg-white/80" />
                      </div>
                      <div>
                        <Label>Mật Khẩu Mới</Label>
                        <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="mt-2 bg-white/80" />
                      </div>
                      <div>
                        <Label>Xác Nhận Mật Khẩu</Label>
                        <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="mt-2 bg-white/80" />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white">Đổi Mật Khẩu</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
