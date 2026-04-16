import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [minRating, setMinRating] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-popularity_score"),
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: () => base44.entities.Review.filter({ status: "approved" }),
  });

  const categories = [
    { value: "all", label: "Tất cả sản phẩm" },
    { value: "raw", label: "Yến sào thô" },
    { value: "ready_to_eat", label: "Yến sào chế biến sẵn" },
    { value: "gift_sets", label: "Bộ quà tặng" },
    { value: "supplements", label: "Thực phẩm bổ sung" }
  ];

  const productsWithRatings = products.map(product => {
    const productReviews = allReviews.filter(r => r.product_id === product.id);
    const avgRating = productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / productReviews.length
      : 0;
    return { ...product, avgRating, reviewCount: productReviews.length };
  });

  const filteredProducts = productsWithRatings
    .filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.full_description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesRating = minRating === "all" || product.avgRating >= parseInt(minRating);
      return matchesSearch && matchesCategory && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "rating":
          return (b.avgRating || 0) - (a.avgRating || 0);
        case "newest":
          return new Date(b.created_date) - new Date(a.created_date);
        case "popularity":
        default:
          return (b.popularity_score || 0) - (a.popularity_score || 0);
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center bg-white/20 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-white/30 shadow-2xl"
          >
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">
              Sản Phẩm Của Chúng Tôi
            </h1>
            <p className="text-base md:text-lg text-[#6B5742] max-w-2xl mx-auto">
              Khám phá bộ sưu tập sản phẩm yến sào cao cấp
            </p>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Filters & Search */}
      <section className="py-8 border-b border-[#F5E6D3]/50 bg-white/50 backdrop-blur-xl sticky top-20 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B5742]/50" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#F5E6D3] focus:border-[#D4AF37] rounded-full w-full bg-white/80 backdrop-blur-md shadow-lg"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 border-[#F5E6D3] rounded-full bg-white/80 backdrop-blur-md shadow-lg">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-white/30">
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="w-full md:w-48 border-[#F5E6D3] rounded-full bg-white/80 backdrop-blur-md shadow-lg">
                  <Star className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Đánh giá" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-white/30">
                  <SelectItem value="all">Tất cả đánh giá</SelectItem>
                  <SelectItem value="4">4+ sao</SelectItem>
                  <SelectItem value="3">3+ sao</SelectItem>
                  <SelectItem value="2">2+ sao</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 border-[#F5E6D3] rounded-full bg-white/80 backdrop-blur-md shadow-lg">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border-white/30">
                  <SelectItem value="popularity">Phổ biến nhất</SelectItem>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price_low">Giá: Thấp đến cao</SelectItem>
                  <SelectItem value="price_high">Giá: Cao đến thấp</SelectItem>
                  <SelectItem value="name">Tên: A đến Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#6B5742]">Đang tải sản phẩm...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <p className="text-[#6B5742] mb-8 bg-white/50 backdrop-blur-md rounded-full px-6 py-2 inline-block shadow-lg">
                Hiển thị {filteredProducts.length} {filteredProducts.length === 1 ? 'sản phẩm' : 'sản phẩm'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#F5E6D3]/80 to-[#F8F5F0]/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
                <Search className="w-12 h-12 text-[#D4AF37]/50" />
              </div>
              <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-[#6B5742]">Thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
              <p className="text-[#6B5742] text-sm mt-2">
                Nếu danh sách đang trống: hãy tạo/import sản phẩm trong Base44 Dashboard → Entities → Product.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
