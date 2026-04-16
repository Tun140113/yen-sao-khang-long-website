import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Edit, Eye, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import LoadingScreen from "@/components/LoadingScreen";

export default function AdminEmailTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState("");

  const [formData, setFormData] = useState({
    template_type: "order_confirmation",
    subject: "",
    html_content: "",
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

  const { data: templates = [] } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => base44.entities.EmailTemplate.list("-created_date"),
    enabled: !isCheckingAuth
  });

  const getTemplateHistory = (template) => {
    return [
      { action: "Tạo mới", date: template.created_date, user: template.created_by },
      { action: "Cập nhật", date: template.updated_date, user: template.created_by }
    ].filter(h => h.date);
  };

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Đã tạo template thành công!");
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Đã cập nhật template!");
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Đã xóa template!");
    }
  });

  const resetForm = () => {
    setFormData({
      template_type: "order_confirmation",
      subject: "",
      html_content: "",
      is_active: true
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      template_type: template.template_type,
      subject: template.subject,
      html_content: template.html_content,
      is_active: template.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const handlePreview = (template) => {
    const sampleData = {
      order_id: "ORD-12345",
      customer_name: "Nguyễn Văn A",
      total_amount: "2.500.000đ",
      delivery_address: "123 Đường ABC, Quận 1, TP.HCM",
      order_date: new Date().toLocaleDateString('vi-VN'),
      tracking_number: "VN123456789",
      customer_email: "customer@example.com"
    };

    let preview = template.html_content;
    Object.keys(sampleData).forEach(key => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key]);
    });

    setPreviewContent(preview);
    setPreviewOpen(true);
  };

  const templateTypes = {
    order_confirmation: "Xác nhận đơn hàng",
    order_processing: "Đơn hàng đang xử lý",
    order_shipped: "Đơn hàng đã gửi",
    order_delivered: "Đơn hàng đã giao",
    order_cancelled: "Đơn hàng đã hủy",
    welcome_customer: "Chào mừng khách hàng mới"
  };

  const placeholdersGuide = {
    order_confirmation: "{{order_id}}, {{customer_name}}, {{total_amount}}, {{delivery_address}}, {{order_date}}",
    order_processing: "{{order_id}}, {{customer_name}}, {{total_amount}}",
    order_shipped: "{{order_id}}, {{customer_name}}, {{tracking_number}}",
    order_delivered: "{{order_id}}, {{customer_name}}",
    order_cancelled: "{{order_id}}, {{customer_name}}",
    welcome_customer: "{{customer_name}}, {{customer_email}}"
  };

  const defaultTemplates = {
    order_confirmation: {
      subject: "✅ Xác nhận đơn hàng #{{order_id}} - Yến Sào Khang Long",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Xác nhận đơn hàng</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f7f4ec; font-family:'Lora', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:auto; background:#fcfaf5; padding:45px 32px; border-radius:16px;
      border:3px solid #d4c09a; 
      box-shadow:0 0 60px rgba(180, 150, 90, 0.22),
                 inset 0 0 18px rgba(255,255,255,0.9),
                 inset 0 0 40px rgba(212,180,120,0.3);">
    <tr>
      <td style="text-align:center; padding-bottom:30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" alt="logo" style="width:120px; height:auto;">
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0; font-size:34px; color:#5a4528; font-family:'Playfair Display', serif; letter-spacing:0.6px;">
          XÁC NHẬN ĐƠN HÀNG
        </h1>
        <p style="color:#7d6a4c; font-size:16px; margin-top:12px;">
          Chân thành cảm ơn Quý khách {{customer_name}} đã lựa chọn sản phẩm của chúng tôi.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fffdf8; border:1px solid #e8dec8; border-radius:14px; 
                 padding:28px; 
                 box-shadow:0 0 18px rgba(150,120,60,0.08);">
        <h2 style="margin-top:0; color:#5a4528; font-size:22px; margin-bottom:18px; font-family:'Playfair Display', serif;">
          Thông tin đơn hàng
        </h2>
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Mã đơn:
          <strong style="color:#3b2c17; font-family:'Lora', serif;">{{order_id}}</strong>
        </p>
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Ngày đặt: 
          <strong style="color:#3b2c17;">{{order_date}}</strong>
        </p>
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Tổng tiền: 
          <strong style="color:#3b2c17;">{{total_amount}}</strong>
        </p>
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Địa chỉ giao hàng:
          <strong style="color:#3b2c17;">{{delivery_address}}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:40px;">
        <a href="#"
           style="display:inline-block;
                  padding:15px 36px;
                  background:linear-gradient(135deg, #d2b07a, #b9955d);
                  color:#fff;
                  text-transform:uppercase;
                  text-decoration:none;
                  font-weight:600;
                  letter-spacing:0.7px;
                  border-radius:8px;
                  font-family:'Playfair Display', serif;
                  box-shadow:0 6px 18px rgba(150,120,60,0.35),
                             inset 0 0 10px rgba(255,255,255,0.5);">
          Theo dõi đơn hàng
        </a>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:30px;">
        <p style="color:#a3947a; font-size:14px; margin:0;">
          Mọi thắc mắc xin vui lòng phản hồi trực tiếp email này.
        </p>
        <p style="color:#b7ac97; font-size:12px; margin-top:10px;">
          © 2025 Yến Sào Khang Long – Thương hiệu truyền thống & chất lượng.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
    },
    order_processing: {
      subject: "🔄 Đơn hàng #{{order_id}} đang được xử lý",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f7f4ec; font-family:'Lora', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:auto; background:#fcfaf5; padding:45px 32px; border-radius:16px; border:3px solid #d4c09a; box-shadow:0 0 60px rgba(180, 150, 90, 0.22), inset 0 0 18px rgba(255,255,255,0.9), inset 0 0 40px rgba(212,180,120,0.3);">
    <tr>
      <td style="text-align:center; padding-bottom:30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" alt="logo" style="width:120px; height:auto;">
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0; font-size:34px; color:#5a4528; font-family:'Playfair Display', serif;">
          ĐƠN HÀNG ĐANG XỬ LÝ
        </h1>
        <p style="color:#7d6a4c; font-size:16px; margin-top:12px;">
          Kính gửi {{customer_name}}, đơn hàng của bạn đang được chuẩn bị.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fffdf8; border:1px solid #e8dec8; border-radius:14px; padding:28px;">
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Mã đơn: <strong style="color:#3b2c17;">{{order_id}}</strong>
        </p>
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Tổng tiền: <strong style="color:#3b2c17;">{{total_amount}}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:30px;">
        <p style="color:#a3947a; font-size:14px;">© 2025 Yến Sào Khang Long</p>
      </td>
    </tr>
  </table>
</body>
</html>`
    },
    order_shipped: {
      subject: "🚚 Đơn hàng #{{order_id}} đã được gửi đi",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f7f4ec; font-family:'Lora', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:auto; background:#fcfaf5; padding:45px 32px; border-radius:16px; border:3px solid #d4c09a; box-shadow:0 0 60px rgba(180, 150, 90, 0.22), inset 0 0 18px rgba(255,255,255,0.9), inset 0 0 40px rgba(212,180,120,0.3);">
    <tr>
      <td style="text-align:center; padding-bottom:30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" alt="logo" style="width:120px; height:auto;">
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0; font-size:34px; color:#5a4528; font-family:'Playfair Display', serif;">
          ĐƠN HÀNG ĐÃ ĐƯỢC GỬI ĐI
        </h1>
        <p style="color:#7d6a4c; font-size:16px; margin-top:12px;">
          Kính gửi {{customer_name}}, đơn hàng của bạn đang trên đường giao đến.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fffdf8; border:1px solid #e8dec8; border-radius:14px; padding:28px;">
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Mã đơn: <strong style="color:#3b2c17;">{{order_id}}</strong>
        </p>
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Mã vận đơn: <strong style="color:#3b2c17;">{{tracking_number}}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:30px;">
        <p style="color:#a3947a; font-size:14px;">© 2025 Yến Sào Khang Long</p>
      </td>
    </tr>
  </table>
</body>
</html>`
    },
    order_delivered: {
      subject: "✅ Đơn hàng #{{order_id}} đã được giao thành công",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f7f4ec; font-family:'Lora', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:auto; background:#fcfaf5; padding:45px 32px; border-radius:16px; border:3px solid #d4c09a; box-shadow:0 0 60px rgba(180, 150, 90, 0.22), inset 0 0 18px rgba(255,255,255,0.9), inset 0 0 40px rgba(212,180,120,0.3);">
    <tr>
      <td style="text-align:center; padding-bottom:30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" alt="logo" style="width:120px; height:auto;">
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0; font-size:34px; color:#5a4528; font-family:'Playfair Display', serif;">
          GIAO HÀNG THÀNH CÔNG
        </h1>
        <p style="color:#7d6a4c; font-size:16px; margin-top:12px;">
          Cảm ơn {{customer_name}} đã tin tưởng và sử dụng sản phẩm của chúng tôi!
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fffdf8; border:1px solid #e8dec8; border-radius:14px; padding:28px;">
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Mã đơn: <strong style="color:#3b2c17;">{{order_id}}</strong>
        </p>
        <p style="margin:10px 0 0; color:#4e3f2a; font-size:16px;">
          Hãy đánh giá trải nghiệm của bạn để giúp chúng tôi cải thiện dịch vụ!
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:30px;">
        <p style="color:#a3947a; font-size:14px;">© 2025 Yến Sào Khang Long</p>
      </td>
    </tr>
  </table>
</body>
</html>`
    },
    order_cancelled: {
      subject: "❌ Đơn hàng #{{order_id}} đã bị hủy",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f7f4ec; font-family:'Lora', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:auto; background:#fcfaf5; padding:45px 32px; border-radius:16px; border:3px solid #d4c09a; box-shadow:0 0 60px rgba(180, 150, 90, 0.22), inset 0 0 18px rgba(255,255,255,0.9), inset 0 0 40px rgba(212,180,120,0.3);">
    <tr>
      <td style="text-align:center; padding-bottom:30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" alt="logo" style="width:120px; height:auto;">
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0; font-size:34px; color:#5a4528; font-family:'Playfair Display', serif;">
          ĐƠN HÀNG ĐÃ BỊ HỦY
        </h1>
        <p style="color:#7d6a4c; font-size:16px; margin-top:12px;">
          Kính gửi {{customer_name}}, đơn hàng của bạn đã bị hủy.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fffdf8; border:1px solid #e8dec8; border-radius:14px; padding:28px;">
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Mã đơn: <strong style="color:#3b2c17;">{{order_id}}</strong>
        </p>
        <p style="margin:10px 0 0; color:#4e3f2a; font-size:16px;">
          Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:30px;">
        <p style="color:#a3947a; font-size:14px;">© 2025 Yến Sào Khang Long</p>
      </td>
    </tr>
  </table>
</body>
</html>`
    },
    welcome_customer: {
      subject: "🎉 Chào mừng bạn đến với Yến Sào Khang Long",
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=Lora:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f7f4ec; font-family:'Lora', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px; margin:auto; background:#fcfaf5; padding:45px 32px; border-radius:16px; border:3px solid #d4c09a; box-shadow:0 0 60px rgba(180, 150, 90, 0.22), inset 0 0 18px rgba(255,255,255,0.9), inset 0 0 40px rgba(212,180,120,0.3);">
    <tr>
      <td style="text-align:center; padding-bottom:30px;">
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png" alt="logo" style="width:120px; height:auto;">
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-bottom:20px;">
        <h1 style="margin:0; font-size:34px; color:#5a4528; font-family:'Playfair Display', serif;">
          CHÀO MỪNG BẠN
        </h1>
        <p style="color:#7d6a4c; font-size:16px; margin-top:12px;">
          Xin chào {{customer_name}}, cảm ơn bạn đã tham gia cùng chúng tôi!
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#fffdf8; border:1px solid #e8dec8; border-radius:14px; padding:28px;">
        <p style="margin:6px 0; color:#4e3f2a; font-size:16px;">
          Chúng tôi rất vui được phục vụ bạn những sản phẩm yến sào chất lượng cao nhất.
        </p>
        <p style="margin:10px 0 0; color:#4e3f2a; font-size:16px;">
          Email của bạn: <strong style="color:#3b2c17;">{{customer_email}}</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:40px;">
        <a href="#" style="display:inline-block; padding:15px 36px; background:linear-gradient(135deg, #d2b07a, #b9955d); color:#fff; text-transform:uppercase; text-decoration:none; font-weight:600; letter-spacing:0.7px; border-radius:8px; font-family:'Playfair Display', serif; box-shadow:0 6px 18px rgba(150,120,60,0.35), inset 0 0 10px rgba(255,255,255,0.5);">
          Khám Phá Sản Phẩm
        </a>
      </td>
    </tr>
    <tr>
      <td style="text-align:center; padding-top:30px;">
        <p style="color:#a3947a; font-size:14px;">© 2025 Yến Sào Khang Long</p>
      </td>
    </tr>
  </table>
</body>
</html>`
    }
  };

  const insertDefaultTemplate = () => {
    const template = defaultTemplates[formData.template_type];
    if (template) {
      setFormData({
        ...formData,
        subject: template.subject,
        html_content: template.html
      });
      toast.success("Đã chèn template mẫu!");
    }
  };

  if (isCheckingAuth) {
    return <LoadingScreen message="Đang xác thực..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("AdminDashboard"))}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Email Templates</h1>
            <p className="text-gray-600 mt-2">Tùy chỉnh nội dung email gửi cho khách hàng</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Chỉnh Sửa Template" : "Tạo Template Mới"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>Loại Template *</Label>
                  <Select
                    value={formData.template_type}
                    onValueChange={(value) => setFormData({ ...formData, template_type: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(templateTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">📝 Placeholders khả dụng:</p>
                  <code className="text-xs text-blue-700">{placeholdersGuide[formData.template_type]}</code>
                </div>

                <div>
                  <Label>Tiêu đề Email *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="VD: Xác nhận đơn hàng #{{order_id}}"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Nội dung HTML *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={insertDefaultTemplate}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Chèn Template Mẫu
                    </Button>
                  </div>
                  <Textarea
                    value={formData.html_content}
                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                    placeholder="Nhập nội dung HTML..."
                    required
                    className="mt-2 font-mono text-sm"
                    rows={15}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                    className="bg-gradient-to-r from-amber-600 to-orange-600"
                  >
                    {editingTemplate ? "Cập Nhật" : "Tạo Template"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có template nào. Tạo template đầu tiên!</p>
              </CardContent>
            </Card>
          ) : (
            templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-amber-600" />
                          {templateTypes[template.template_type]}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                      </div>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Đang dùng" : "Tắt"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-xs text-gray-600 mb-2">Preview HTML:</p>
                      <code className="text-xs text-gray-800 line-clamp-3">{template.html_content}</code>
                    </div>
                    
                    {/* Activity History */}
                    <div className="bg-blue-50 p-3 rounded-lg mb-4 text-xs">
                      <p className="font-semibold text-blue-900 mb-2">📋 Lịch sử hoạt động</p>
                      {getTemplateHistory(template).map((h, i) => (
                        <div key={i} className="text-blue-700 mb-1">
                          • {h.action} bởi {h.user} lúc {new Date(h.date).toLocaleString('vi-VN')}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Xóa template này?")) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Email</DialogTitle>
            </DialogHeader>
            <div 
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}