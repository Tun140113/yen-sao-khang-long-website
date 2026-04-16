import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";

export default function Account() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5] to-white py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
          <Lock className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#4A3F35] mb-3">
          Trang tài khoản đang tạm ẩn
        </h1>
        <p className="text-[#6B5742] mb-8">
          Website này công khai. Chỉ khu vực quản trị mới cần đăng nhập.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </Link>
          <Link to={createPageUrl("AdminDashboard")}>
            <Button className="rounded-full bg-gradient-to-r from-[#4A3F35] to-[#6B5742] text-white">
              Vào quản trị
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

