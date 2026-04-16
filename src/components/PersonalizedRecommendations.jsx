import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";

export default function PersonalizedRecommendations({ userEmail }) {
  const { data: activities = [] } = useQuery({
    queryKey: ["user-activities", userEmail],
    queryFn: () => base44.entities.UserActivity.filter({ user_email: userEmail }, "-created_date", 20),
    enabled: !!userEmail
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list()
  });

  // Analyze user behavior to recommend products
  const getRecommendedProducts = () => {
    if (activities.length === 0 || allProducts.length === 0) return [];

    // Count category views
    const categoryCount = {};
    activities.forEach(activity => {
      if (activity.category) {
        categoryCount[activity.category] = (categoryCount[activity.category] || 0) + 1;
      }
    });

    // Get top viewed category
    const topCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, null
    );

    // Get viewed product IDs
    const viewedProductIds = new Set(
      activities.filter(a => a.product_id).map(a => a.product_id)
    );

    // Filter products: same category, not viewed, or popular
    let recommended = allProducts.filter(p => 
      p.category === topCategory && !viewedProductIds.has(p.id)
    );

    // If not enough, add popular products
    if (recommended.length < 3) {
      const popular = allProducts
        .filter(p => !viewedProductIds.has(p.id))
        .sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
      recommended = [...recommended, ...popular].slice(0, 4);
    }

    return recommended.slice(0, 4);
  };

  const recommendedProducts = getRecommendedProducts();

  if (recommendedProducts.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-[#FFFBF5]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Dành Riêng Cho Bạn</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#4A3F35] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Gợi Ý Sản Phẩm
          </h2>
          <p className="text-lg text-[#6B5742]">Dựa trên sở thích của bạn</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}