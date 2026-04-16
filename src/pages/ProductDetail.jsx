import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, Plus, Minus, Star, Shield, Truck, Award, User, Package, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import VariantSelector from "../components/VariantSelector";
import { notifyProductView, notifyAddToCart } from "@/components/DiscordNotifications";
import { useQuery as useAuthQuery } from "@tanstack/react-query";

export default function ProductDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedPackaging, setSelectedPackaging] = useState("");
  const [variantErrors, setVariantErrors] = useState({});
  const [selectedSet, setSelectedSet] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    customer_name: "",
    customer_email: "",
    rating: 5,
    review_text: ""
  });

  // Get current user for tracking
  const { data: currentUser } = useAuthQuery({
    queryKey: ["current-user-tracking"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    }
  });

  // Inject OG meta tags when product loads
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const products = await base44.entities.Product.list();
      const foundProduct = products.find(p => p.id === productId);
      
      // Notify Discord when product is viewed (with privacy-safe options)
      if (foundProduct) {
        notifyProductView(foundProduct.name, foundProduct.price, foundProduct.id, {
          isLoggedIn: !!currentUser,
          userId: currentUser?.id || null,
          category: foundProduct.category,
          imageUrl: foundProduct.image_url
        });
      }
      
      return foundProduct;
    },
    enabled: !!productId
  });

  // Inject OG meta tags when product loads
  useEffect(() => {
    if (!product) return;
    const ogImage = product.image_url || (product.images && product.images[0]) || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png";
    const setMeta = (prop, content, isName = false) => {
      const attr = isName ? "name" : "property";
      let el = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title", product.name);
    setMeta("og:description", (product.description || "").slice(0, 150));
    setMeta("og:image", ogImage);
    setMeta("og:url", window.location.href);
    setMeta("og:type", "product");
    setMeta("twitter:card", "summary_large_image", true);
    setMeta("twitter:image", ogImage, true);
    document.title = product.meta_title || `${product.name} - Yến Sào Khang Long`;
  }, [product]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => base44.entities.Review.filter({ product_id: productId, status: "approved" }, "-created_date"),
    enabled: !!productId
  });

  // Fetch related products from same category
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.category],
    queryFn: async () => {
      if (!product) return [];
      const products = await base44.entities.Product.filter({ category: product.category });
      return products.filter(p => p.id !== productId).slice(0, 4);
    },
    enabled: !!product
  });



  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      setShowReviewForm(false);
      setReviewData({
        customer_name: "",
        customer_email: "",
        rating: 5,
        review_text: ""
      });
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));

  const calcDiscountedPrice = (origPrice, dType, dValue) => {
    if (!dType || !dValue) return origPrice;
    if (dType === "percentage") return origPrice - (origPrice * dValue / 100);
    if (dType === "fixed") return origPrice - dValue;
    return origPrice;
  };

  const getActiveDiscount = () => {
    if (!product) return { discountType: null, discountValue: null };
    // Priority: variant > set > base
    if (selectedVariant && product.variants) {
      const v = product.variants.find(v => v.name === selectedVariant);
      if (v?.discount_type && v?.discount_value) return { discountType: v.discount_type, discountValue: v.discount_value };
    }
    if (selectedSet && selectedSet.discount_type && selectedSet.discount_value) {
      return { discountType: selectedSet.discount_type, discountValue: selectedSet.discount_value };
    }
    if (selectedPackaging && product.packaging_options) {
      const p = product.packaging_options.find(p => p.name === selectedPackaging);
      if (p?.discount_type && p?.discount_value) return { discountType: p.discount_type, discountValue: p.discount_value };
    }
    if (product.discount_type && product.discount_value) return { discountType: product.discount_type, discountValue: product.discount_value };
    return { discountType: null, discountValue: null };
  };

  const calculateFinalPrice = () => {
    if (!product) return 0;
    
    let finalPrice = product.price || 0;
    
    // If set is selected, calculate set price
    if (selectedSet) {
      if (selectedSet.pricing_type === "fixed") {
        return selectedSet.price_value || 0;
      } else if (selectedSet.pricing_type === "adjustment") {
        return finalPrice + (selectedSet.price_value || 0);
      }
    }

    // If variant is selected, adjust price
    if (selectedVariant && product.variants) {
      const variant = product.variants.find(v => v.name === selectedVariant);
      if (variant) {
        if (variant.pricing_type === "fixed") {
          finalPrice = variant.price_value || finalPrice;
        } else if (variant.pricing_type === "adjustment") {
          finalPrice += variant.price_value || 0;
        }
        // pricing_type === "none" means no change
      }
    }

    // If packaging is selected, adjust price
    if (selectedPackaging && product.packaging_options) {
      const packaging = product.packaging_options.find(p => p.name === selectedPackaging);
      if (packaging) {
        if (packaging.pricing_type === "fixed") {
          return packaging.price_value || finalPrice;
        } else if (packaging.pricing_type === "adjustment") {
          finalPrice += packaging.price_value || 0;
        }
      }
    }

    return finalPrice;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const addToCart = () => {
    if (!product) return;

    const newErrors = {};
    if (product.variants?.length > 0 && !selectedVariant) {
      newErrors.variant = "Vui lòng chọn vị trước khi đặt hàng";
    }
    if (product.packaging_options?.length > 0 && !selectedPackaging) {
      newErrors.packaging = "Vui lòng chọn số lượng hũ trước khi đặt hàng";
    }
    if (Object.keys(newErrors).length > 0) {
      setVariantErrors(newErrors);
      return;
    }
    setVariantErrors({});

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Find existing item with the same product, variant, and packaging
    const existingItem = cart.find(item =>
      item.id === product.id &&
      item.variant === selectedVariant &&
      item.packaging === selectedPackaging &&
      item.setDisplay === (selectedSet?.name || null)
    );

    const finalPrice = calculateFinalPrice();

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const variantFreeship = selectedVariant ? product.variants?.find(v => v.name === selectedVariant)?.freeship : false;
    const packagingFreeship = selectedPackaging ? product.packaging_options?.find(p => p.name === selectedPackaging)?.freeship : false;
    const setFreeship = selectedSet?.freeship || false;
    const categoryFreeship = product.category_freeship || false;
    const itemFreeship = categoryFreeship || setFreeship || variantFreeship || packagingFreeship;

    cart.push({
        id: product.id,
        name: product.name,
        price: finalPrice,
        image_url: selectedSet?.image_url || product.image_url,
        quantity: quantity,
        variant: selectedVariant || null,
        packaging: selectedPackaging || null,
        variantDisplay: selectedVariant || null,
        packagingDisplay: selectedPackaging || null,
        setDisplay: selectedSet?.name || null,
        setItems: selectedSet?.items || null,
        isSet: !!selectedSet,
        freeship: itemFreeship
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));

    // Notify Discord about add to cart (with privacy-safe options)
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    notifyAddToCart(
      `${product.name}${selectedVariant ? ` - ${selectedVariant}` : ''}${selectedPackaging ? ` (${selectedPackaging})` : ''}${selectedSet ? ` [${selectedSet.name}]` : ''}`,
      quantity,
      finalPrice,
      {
        isLoggedIn: !!currentUser,
        userId: currentUser?.id || null,
        variant: selectedVariant || selectedPackaging || selectedSet?.name || null,
        cartTotal: cartTotal,
        imageUrl: product.image_url
      }
    );

    toast.success("Đã thêm vào giỏ hàng!", {
      description: `${product.name}${selectedVariant ? ` - ${selectedVariant}` : ''}${selectedPackaging ? ` (${selectedPackaging})` : ''}`,
      duration: 3000,
    });

    navigate(createPageUrl("Cart"));
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    createReviewMutation.mutate({
      ...reviewData,
      product_id: productId
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFFBF5]/80 to-white/50 backdrop-blur-3xl">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFFBF5]/80 to-white/50 backdrop-blur-3xl">
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border border-white/30">
          <h2 className="text-2xl font-bold text-[#4A3F35] mb-4">Không tìm thấy sản phẩm</h2>
          <Button onClick={() => navigate(createPageUrl("Products"))} className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white">
            Quay lại Sản phẩm
          </Button>
        </div>
      </div>
    );
  }

  const images = [product.image_url, ...(product.images || [])].filter(Boolean);

  // Add variant image if selected
  if (selectedVariant && product.variants) {
    const variant = product.variants.find(v => v.name === selectedVariant);
    if (variant?.image_url && !images.includes(variant.image_url)) {
      images.unshift(variant.image_url);
    }
  }

  return (
    <>
      {/* SEO Meta Tags & Schema Markup */}
      {product && (
        <>
          <title>{product.meta_title || `${product.name} - Yến Sào Khang Long`}</title>
          <meta name="description" content={product.meta_description || product.description} />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "image": product.image_url,
              "description": product.description,
              "brand": {
                "@type": "Brand",
                "name": "Yến Sào Khang Long"
              },
              "offers": {
                "@type": "Offer",
                "url": window.location.href,
                "priceCurrency": "VND",
                "price": product.price,
                "availability": "https://schema.org/InStock"
              },
              "aggregateRating": reviews.length > 0 ? {
                "@type": "AggregateRating",
                "ratingValue": averageRating.toFixed(1),
                "reviewCount": reviews.length
              } : undefined
            })}
          </script>
        </>
      )}
      <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl py-12" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Products"))}
          className="mb-8 hover:bg-[#F5E6D3]/50 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Sản phẩm
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="sticky top-24">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl mb-4 shadow-2xl border border-white/30">
                {images[selectedImage] ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-9xl text-[#D4AF37]/30">燕</span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all backdrop-blur-md ${
                        selectedImage === idx ? "border-[#D4AF37] shadow-xl scale-105" : "border-transparent opacity-60 hover:opacity-100 bg-white/50"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/30">
              <Badge className="bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md text-white mb-4 border border-white/20">
                {product.category?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#4A3F35] mb-4 leading-tight" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                {product.name}
              </h1>

              {reviews.length > 0 && (
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(averageRating)
                            ? "text-[#D4AF37] fill-[#D4AF37]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-[#4A3F35]">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-[#6B5742]">
                    ({reviews.length} đánh giá)
                  </span>
                </div>
              )}

              <div className="mb-6">
                {(() => {
                  const orig = calculateFinalPrice();
                  const { discountType, discountValue } = getActiveDiscount();
                  const hasDiscount = discountType && discountValue;
                  const discounted = hasDiscount ? calcDiscountedPrice(orig, discountType, discountValue) : orig;
                  // Freeship logic
                  const variantObj = selectedVariant ? product.variants?.find(v => v.name === selectedVariant) : null;
                  const packagingObj = selectedPackaging ? product.packaging_options?.find(p => p.name === selectedPackaging) : null;
                  const showFreeship = (variantObj?.freeship) || (packagingObj?.freeship) || (selectedSet?.freeship) || (!selectedVariant && !selectedPackaging && !selectedSet && product.category_freeship);
                  return (
                    <div>
                      <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                        {hasDiscount ? (
                          <>
                            <p className="text-2xl" style={{ textDecoration: "line-through", color: "gray" }}>{formatPrice(orig)}</p>
                            <p className="text-4xl font-bold" style={{ color: "red" }}>{formatPrice(Math.max(0, discounted))}</p>
                          </>
                        ) : (
                          <p className="text-4xl font-bold text-[#D4AF37]">{formatPrice(orig)}</p>
                        )}
                        {product.weight && <span className="text-lg text-[#6B5742]">/ {product.weight}</span>}
                      </div>
                      {hasDiscount && (
                        <div className="mt-1">
                          {discountType === "percentage" ? (
                            <span style={{ background: "#ff4d4d", color: "white", borderRadius: "4px", padding: "2px 6px", fontSize: "0.8em", fontWeight: "bold" }}>-{discountValue}%</span>
                          ) : (
                            <span style={{ color: "#e67e00", fontSize: "0.85em" }}>💰 Tiết kiệm {formatPrice(discountValue)}</span>
                          )}
                        </div>
                      )}
                      {showFreeship && (
                        <div className="mt-2">
                          <span style={{ background: "#38a169", color: "white", borderRadius: "4px", padding: "3px 8px", fontSize: "0.85em", fontWeight: "bold" }}>🚚 Miễn phí vận chuyển</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {(selectedVariant || selectedPackaging || selectedSet) && (
                  <div className="text-sm text-[#6B5742] bg-amber-50/50 px-3 py-1 rounded-full inline-block mt-2">
                    💰 Giá đã bao gồm {selectedVariant && 'vị'}{selectedPackaging && ' + nhóm'}{selectedSet && ' + set'}
                  </div>
                )}
              </div>

              <p className="text-lg text-[#6B5742] leading-relaxed mb-6">
                {product.full_description || product.description || "Sản phẩm yến sào chất lượng cao, được lấy và chuẩn bị cẩn thận để mang lại lợi ích sức khỏe tự nhiên tốt nhất."}
              </p>

              {/* Variant & Packaging Selector */}
              {(product.variants?.length > 0 || product.packaging_options?.length > 0) && (
                <div className="mb-6">
                  <VariantSelector
                    product={product}
                    selectedVariant={selectedVariant}
                    selectedPackaging={selectedPackaging}
                    onVariantChange={(v) => { setSelectedVariant(v); setVariantErrors(prev => ({ ...prev, variant: undefined })); }}
                    onPackagingChange={(p) => { setSelectedPackaging(p); setVariantErrors(prev => ({ ...prev, packaging: undefined })); }}
                    errors={variantErrors}
                  />
                </div>
              )}

              {/* Product Sets */}
              {product.product_sets?.length > 0 && (
                <div className="mb-6">
                  <Label className="text-base font-semibold text-[#4A3F35] mb-3 block">
                    Chọn Bộ Sản Phẩm (Set)
                  </Label>
                  <div className="space-y-2">
                    {product.product_sets.map((set, idx) => {
                      const setBasePrice = set.pricing_type === "fixed" ? (set.price_value || 0) : (product.price + (set.price_value || 0));
                      const setHasDiscount = set.discount_type && set.discount_value;
                      const setDiscounted = setHasDiscount ? calcDiscountedPrice(setBasePrice, set.discount_type, set.discount_value) : null;
                      return (
                        <motion.button
                          key={idx}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSet(set)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            selectedSet?.name === set.name
                              ? "border-[#D4AF37] bg-gradient-to-br from-amber-50 to-orange-50"
                              : "border-gray-200 hover:border-[#D4AF37]/50 bg-white/50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-[#4A3F35]">{set.name}</div>
                              {set.description && <div className="text-sm text-gray-600 mt-2">{set.description}</div>}
                              {set.items?.length > 0 && (
                                <div className="bg-amber-50 p-2 rounded mt-2 text-xs text-amber-800">
                                  {set.items.map((item, i) => <div key={i}>• {item.quantity}x {item.item_name}</div>)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              {setHasDiscount && setDiscounted !== null ? (
                                <>
                                  <div className="text-sm line-through text-gray-400">{formatPrice(setBasePrice)}</div>
                                  <div className="text-lg font-bold" style={{ color: "red" }}>{formatPrice(Math.max(0, setDiscounted))}</div>
                                  <div className="mt-1">{set.discount_type === "percentage" ? <span style={{ background: "#ff4d4d", color: "white", borderRadius: "4px", padding: "2px 5px", fontSize: "0.75em", fontWeight: "bold" }}>-{set.discount_value}%</span> : <span style={{ color: "#e67e00", fontSize: "0.8em" }}>💰 -{formatPrice(set.discount_value)}</span>}</div>
                                </>
                              ) : (
                                set.price_value && <div className="text-lg font-bold text-[#D4AF37]">{set.pricing_type === "adjustment" ? `+${formatPrice(set.price_value)}` : formatPrice(set.price_value)}</div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 py-6 border-y border-[#F5E6D3]/50 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <p className="text-sm text-[#6B5742]">Đã Chứng Nhận</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <p className="text-sm text-[#6B5742]">Cao Cấp</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                    <Truck className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <p className="text-sm text-[#6B5742]">Giao Hàng Nhanh</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#4A3F35] mb-3">Số Lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-[#F5E6D3] rounded-full bg-white/50 backdrop-blur-md shadow-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-full hover:bg-[#F5E6D3]/50"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-16 text-center font-semibold text-[#4A3F35]">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="rounded-full hover:bg-[#F5E6D3]/50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {product.stock !== undefined && (
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      product.stock > 10 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : product.stock > 0 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {product.stock > 0 ? (
                        <>📦 Còn {product.stock} sản phẩm</>
                      ) : (
                        <>❌ Hết hàng</>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={addToCart}
                className="w-full bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-2xl text-white py-4 md:py-6 text-base md:text-lg rounded-full transition-all duration-200 hover:scale-105 border border-white/20"
              >
                <ShoppingCart className="w-4 md:w-5 h-4 md:h-5 mr-2" />
                <span className="block sm:inline">Thêm vào Giỏ</span>
                <span className="hidden sm:inline"> - {formatPrice(calculateFinalPrice() * quantity)}</span>
              </Button>

              {/* Phone CTA */}
              <a href="tel:0909475099" className="flex items-center justify-center gap-2 w-full py-3 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-amber-50 transition-colors mt-3">
                <Phone className="w-4 h-4" />
                Gọi đặt hàng: 0909 475 099
              </a>
            </div>

            {/* Additional Info */}
            {product.ingredients && (
              <div className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
                <h3 className="font-bold text-[#4A3F35] mb-2">Ingredients</h3>
                <p className="text-[#6B5742]">{product.ingredients}</p>
              </div>
            )}

            {product.nutrition_info && (
              <div className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/30">
                <h3 className="font-bold text-[#4A3F35] mb-2">Nutrition Information</h3>
                <p className="text-[#6B5742]">{product.nutrition_info}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-[#4A3F35]">Đánh Giá Khách Hàng</h2>
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              variant="outline"
              className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#F5E6D3]/50 bg-white/70 backdrop-blur-md"
            >
              Viết Đánh Giá
            </Button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mb-8"
            >
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#4A3F35] mb-4">Viết Đánh Giá Của Bạn</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <Label>Tên của bạn *</Label>
                      <Input
                        required
                        value={reviewData.customer_name}
                        onChange={(e) => setReviewData({...reviewData, customer_name: e.target.value})}
                        className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        required
                        value={reviewData.customer_email}
                        onChange={(e) => setReviewData({...reviewData, customer_email: e.target.value})}
                        className="mt-2 bg-white/80 backdrop-blur-sm border-[#F5E6D3]"
                      />
                    </div>
                    <div>
                      <Label>Đánh giá *</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewData({...reviewData, rating: star})}
                          >
                            <Star
                              className={`w-8 h-8 cursor-pointer transition-colors ${
                                star <= reviewData.rating
                                  ? "text-[#D4AF37] fill-[#D4AF37]"
                                  : "text-gray-300 hover:text-[#D4AF37]"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Nhận xét của bạn</Label>
                      <Textarea
                        value={reviewData.review_text}
                        onChange={(e) => setReviewData({...reviewData, review_text: e.target.value})}
                        className="mt-2 border-[#F5E6D3] h-32 bg-white/80 backdrop-blur-sm"
                        placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={createReviewMutation.isPending}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white backdrop-blur-md"
                      >
                        {createReviewMutation.isPending ? "Đang gửi..." : "Gửi Đánh Giá"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                        className="bg-white/70 backdrop-blur-md"
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Rating Distribution */}
          {reviews.length > 0 && (
            <Card className="mb-8 shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-[#D4AF37] mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= Math.round(averageRating)
                              ? "text-[#D4AF37] fill-[#D4AF37]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[#6B5742]">Dựa trên {reviews.length} đánh giá</p>
                  </div>
                  <div className="space-y-2">
                    {ratingDistribution.map(({ star, count }) => (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-sm text-[#6B5742] w-12">{star} sao</span>
                        <div className="flex-1 h-2 bg-gray-200/80 backdrop-blur-sm rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D4AF37]"
                            style={{
                              width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-[#6B5742] w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Card className="shadow-2xl hover:shadow-3xl transition-shadow border-0 bg-white/70 backdrop-blur-xl">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5E6D3]/80 to-[#F8F5F0]/80 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-lg">
                          <User className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-[#4A3F35]">{review.customer_name}</h4>
                              {review.verified_purchase && (
                                <Badge variant="outline" className="text-xs mt-1 bg-white/50 backdrop-blur-sm">
                                  Đã mua hàng
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "text-[#D4AF37] fill-[#D4AF37]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.review_text && (
                            <p className="text-[#6B5742] leading-relaxed mb-2">
                              {review.review_text}
                            </p>
                          )}
                          <p className="text-sm text-gray-400">
                            {new Date(review.created_date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                    <Star className="w-10 h-10 text-[#D4AF37]/30" />
                  </div>
                  <h3 className="text-xl font-bold text-[#4A3F35] mb-2">Chưa có đánh giá</h3>
                  <p className="text-[#6B5742] mb-4">Hãy là người đầu tiên đánh giá sản phẩm này!</p>
                  <Button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white backdrop-blur-md"
                  >
                    Viết Đánh Giá
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-[#4A3F35] mb-8">Sản Phẩm Liên Quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    window.location.href = createPageUrl("ProductDetail") + "?id=" + relatedProduct.id;
                  }}
                  className="cursor-pointer group"
                >
                  <Card className="overflow-hidden shadow-xl hover:shadow-2xl transition-all border-0 bg-white/70 backdrop-blur-xl">
                    <div className="aspect-square bg-gradient-to-br from-[#F8F5F0] to-[#F5E6D3] relative overflow-hidden">
                      {relatedProduct.image_url ? (
                        <img
                          src={relatedProduct.image_url}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl text-[#D4AF37]/30">燕</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-[#4A3F35] mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        {formatPrice(relatedProduct.price)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}