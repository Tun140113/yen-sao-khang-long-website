import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function SavingsBadge({ discountType, discountValue, price }) {
  if (!discountType || !discountValue) return null;
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  if (discountType === "percentage") {
    return (
      <span style={{ background: "#ff4d4d", color: "white", borderRadius: "4px", padding: "2px 6px", fontSize: "0.8em", fontWeight: "bold" }}>
        -{discountValue}%
      </span>
    );
  }
  return (
    <span style={{ color: "#e67e00", fontSize: "0.85em" }}>
      💰 Tiết kiệm {formatPrice(discountValue)}
    </span>
  );
}

export default function VariantSelector({
  product,
  selectedVariant,
  selectedPackaging,
  onVariantChange,
  onPackagingChange,
  errors = {}
}) {
  const formatPrice = (price) => {
    if (price === 0) return "";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const calcDiscounted = (origPrice, dType, dValue) => {
    if (!dType || !dValue) return origPrice;
    if (dType === "percentage") return origPrice - (origPrice * dValue / 100);
    if (dType === "fixed") return origPrice - dValue;
    return origPrice;
  };

  return (
    <div className="space-y-6">
      {/* Variants (Flavors) */}
      {product.variants && product.variants.length > 0 && (
        <div>
          <Label className="block mb-3 text-sm font-semibold text-[#4A3F35]">
            Chọn Vị <span style={{ color: "#e53e3e" }}>*</span>
          </Label>
          <div
            className="grid grid-cols-2 gap-3"
            style={errors.variant ? { border: "2px solid #e53e3e", borderRadius: "6px", padding: "8px" } : {}}
          >
            {product.variants.map((variant) => {
              const basePrice = (() => {
                if (variant.pricing_type === "fixed") return variant.price_value || product.price;
                if (variant.pricing_type === "adjustment") return product.price + (variant.price_value || 0);
                return product.price;
              })();
              const hasDiscount = variant.discount_type && variant.discount_value;
              const discountedPrice = hasDiscount ? calcDiscounted(basePrice, variant.discount_type, variant.discount_value) : null;

              return (
                <button
                  key={variant.name}
                  onClick={() => onVariantChange(variant.name)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedVariant === variant.name
                      ? "border-[#D4AF37] bg-gradient-to-br from-[#F5E6D3]/50 to-white/80 shadow-lg scale-105"
                      : "border-[#F5E6D3]/50 bg-white/50 hover:border-[#D4AF37]/50 hover:bg-[#F5E6D3]/30"
                  } backdrop-blur-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-[#4A3F35] mb-1">{variant.name}</p>
                      {variant.pricing_type === "adjustment" && variant.price_value && !hasDiscount && (
                        <p className="text-xs text-emerald-600 font-semibold">+{formatPrice(variant.price_value)}</p>
                      )}
                      {variant.pricing_type === "fixed" && variant.price_value && !hasDiscount && (
                        <p className="text-sm font-semibold text-[#D4AF37]">{formatPrice(variant.price_value)}</p>
                      )}
                      {hasDiscount && discountedPrice !== null && (
                        <div className="flex flex-wrap gap-1 items-center mt-1">
                          <span style={{ textDecoration: "line-through", color: "gray", fontSize: "0.8em" }}>{formatPrice(basePrice)}</span>
                          <span style={{ color: "red", fontWeight: "bold", fontSize: "0.95em" }}>{formatPrice(Math.max(0, discountedPrice))}</span>
                          <SavingsBadge discountType={variant.discount_type} discountValue={variant.discount_value} price={basePrice} />
                        </div>
                      )}
                    </div>
                    {selectedVariant === variant.name && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center flex-shrink-0 ml-2">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.variant && (
            <p className="text-sm mt-1" style={{ color: "#e53e3e" }}>{errors.variant}</p>
          )}
        </div>
      )}

      {/* Packaging Options */}
      {product.packaging_options && product.packaging_options.length > 0 && (
        <div>
          <Label className="block mb-3 text-sm font-semibold text-[#4A3F35]">
            Chọn Nhóm Sản Phẩm <span style={{ color: "#e53e3e" }}>*</span>
          </Label>
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
            style={errors.packaging ? { border: "2px solid #e53e3e", borderRadius: "6px", padding: "8px" } : {}}
          >
            {product.packaging_options.map((option) => {
              const basePrice = option.pricing_type === "fixed" ? option.price_value : (product.price + (option.price_value || 0));
              const hasDiscount = option.discount_type && option.discount_value;
              const discountedPrice = hasDiscount ? calcDiscounted(basePrice, option.discount_type, option.discount_value) : null;

              return (
                <button
                  key={option.name}
                  onClick={() => onPackagingChange(option.name)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedPackaging === option.name
                      ? "border-[#D4AF37] bg-gradient-to-br from-[#F5E6D3]/50 to-white/80 shadow-lg scale-105"
                      : "border-[#F5E6D3]/50 bg-white/50 hover:border-[#D4AF37]/50 hover:bg-[#F5E6D3]/30"
                  } backdrop-blur-md`}
                >
                  <div>
                    <p className="font-bold text-[#4A3F35] text-lg mb-1">{option.name}</p>
                    {option.quantity && (
                      <Badge variant="outline" className="bg-white/50 text-xs mb-2">{option.quantity} hũ</Badge>
                    )}
                    {option.description && (
                      <p className="text-xs text-[#6B5742] mb-2 line-clamp-2">{option.description}</p>
                    )}
                    {!hasDiscount && option.pricing_type === "adjustment" && option.price_value && (
                      <p className="text-sm font-semibold text-emerald-600">+{formatPrice(option.price_value)}</p>
                    )}
                    {!hasDiscount && option.pricing_type === "fixed" && option.price_value && (
                      <p className="text-sm font-semibold text-[#D4AF37]">{formatPrice(option.price_value)}</p>
                    )}
                    {hasDiscount && discountedPrice !== null && (
                      <div className="flex flex-wrap gap-1 items-center justify-center mt-1">
                        <span style={{ textDecoration: "line-through", color: "gray", fontSize: "0.8em" }}>{formatPrice(basePrice)}</span>
                        <span style={{ color: "red", fontWeight: "bold", fontSize: "0.95em" }}>{formatPrice(Math.max(0, discountedPrice))}</span>
                        <SavingsBadge discountType={option.discount_type} discountValue={option.discount_value} price={basePrice} />
                      </div>
                    )}
                    {selectedPackaging === option.name && (
                      <div className="mt-2 mx-auto w-5 h-5 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941E] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.packaging && (
            <p className="text-sm mt-1" style={{ color: "#e53e3e" }}>{errors.packaging}</p>
          )}
        </div>
      )}
    </div>
  );
}