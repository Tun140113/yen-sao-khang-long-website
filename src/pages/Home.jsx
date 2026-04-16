import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Award, Shield, Leaf, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { notifyWebsiteVisit } from "@/components/DiscordNotifications";

export default function Home() {
  const [showVoucherPopup, setShowVoucherPopup] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const featuredProductsQuery = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => base44.entities.Product.filter({ is_featured: true })
  });

  const allProductsQuery = useQuery({
    queryKey: ["home-products-fallback"],
    queryFn: () => base44.entities.Product.list("-popularity_score"),
    enabled:
      featuredProductsQuery.isSuccess &&
      (featuredProductsQuery.data?.length ?? 0) === 0
  });

  const products =
    (featuredProductsQuery.data?.length ?? 0) > 0
      ? featuredProductsQuery.data
      : allProductsQuery.data ?? [];

  const showingFeatured = (featuredProductsQuery.data?.length ?? 0) > 0;

  // Get current user for tracking
  const { data: currentUser } = useQuery({
    queryKey: ["current-user-tracking"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });



  // Track website visit (once per session)
  useEffect(() => {
    const hasTracked = sessionStorage.getItem("hasTrackedVisit");
    if (!hasTracked) {
      notifyWebsiteVisit("Trang chủ", {
        isLoggedIn: !!currentUser,
        userId: currentUser?.id || null
      });
      sessionStorage.setItem("hasTrackedVisit", "true");
    }
  }, [currentUser]);



  const features = [
  {
    icon: Award,
    title: "Chất Lượng Hàng Đầu",
    description: "100% yến sào tự nhiên từ các trang trại uy tín"
  },
  {
    icon: Shield,
    title: "An Toàn & Chứng Nhận",
    description: "Đạt chuẩn ATTP và các chứng nhận quốc tế"
  },
  {
    icon: Leaf,
    title: "Tự Nhiên & Tinh Khiết",
    description: "Không chất bảo quản, chỉ là sự tốt lành từ thiên nhiên"
  },
  {
    icon: Sparkles,
    title: "Giàu Dinh Dưỡng",
    description: "Protein cao, khoáng chất và vitamin thiết yếu"
  }];


  return (
    <div className="bg-white" style={{ fontFamily: "'Lora', serif" }}>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="absolute inset-0 opacity-10">
          <div className="bg-rose-500 opacity-100 absolute inset-0" style={{
            backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691041e8b13e0de707277619/f29176ceb_z7192650661205_6bb2f0b509f5cb3ad705e4ccffbee2ac.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-amber-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-orange-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}>

            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-100 rounded-full mb-6 sm:mb-8">
              <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-amber-600" />
              <span className="text-xs sm:text-sm font-semibold text-amber-900">Yến Sào Cao Cấp Khang Long</span>
            </div>
            
            <h1 className="text-orange-900 mb-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl sm:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Yến Sào Khang Long


            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>Trao tặng sức khoẻ, gửi trọn yêu thương

            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md sm:max-w-none mx-auto">
              <Link to={createPageUrl("Products")} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-95">
                  Khám Phá Sản Phẩm
                  <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                </Button>
              </Link>
              <Link to={createPageUrl("About")} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-amber-600 text-amber-600 hover:bg-amber-50 active:bg-amber-100 px-6 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-base md:text-lg rounded-full active:scale-95">
                  Về Chúng Tôi
                  <ChevronRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16">

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Tại Sao Chọn Khang Long?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Chúng tôi cam kết mang đến sản phẩm yến sào chất lượng tốt nhất với sự tận tâm và chuyên nghiệp
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) =>
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
              className="text-center group">

                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed" style={{ fontFamily: "'Lora', serif" }}>{feature.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 md:mb-16">

            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-100 rounded-full mb-3 sm:mb-4">
              <Star className="w-3 sm:w-4 h-3 sm:h-4 text-amber-600 fill-amber-600" />
              <span className="text-xs sm:text-sm font-semibold text-amber-900">Sản Phẩm Nổi Bật</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Các Sản Phẩm Cao Cấp

            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Khám phá các sản phẩm yến sào đặc biệt được yêu thích nhất
            </p>
          </motion.div>

          {products.length > 0 ?
          <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
                {products.slice(0, 3).map((product, index) =>
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}>

                    <ProductCard product={product} />
                  </motion.div>
              )}
              </div>
              
              <div className="text-center">
                <Link to={createPageUrl("Products")}>
                  <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95">
                    {showingFeatured ? "Xem Tất Cả Sản Phẩm" : "Xem Danh Sách Sản Phẩm"}
                    <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                  </Button>
                </Link>
              </div>
            </> :

          <div className="text-center py-12 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200">
              <p className="text-gray-700 text-lg font-semibold">Chưa có sản phẩm để hiển thị</p>
              <p className="text-gray-600 text-sm mt-2">
                Nếu bạn đang dùng Base44 backend: hãy vào Base44 Dashboard → Entities → Product để tạo/import sản phẩm.
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Để hiện ở mục “Nổi Bật”, bật trường <span className="font-mono">is_featured</span>.
              </p>
            </div>
          }
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691041e8b13e0de707277619/f29176ceb_z7192650661205_6bb2f0b509f5cb3ad705e4ccffbee2ac.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Sẵn Sàng Trải Nghiệm Chất Lượng Tinh Khiết?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 md:mb-10 leading-relaxed">
              Tham gia cùng hàng nghìn khách hàng tin tưởng Yến Sào Khang Long cho sức khỏe gia đình
            </p>
            <Link to={createPageUrl("Contact")}>
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
                Liên Hệ Ngay
                <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>);

}
