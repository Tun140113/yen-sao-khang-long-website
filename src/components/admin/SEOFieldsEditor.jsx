import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function SEOFieldsEditor({ data, onChange }) {
  const handleNameChange = (name) => {
    onChange({
      ...data,
      name,
      slug: data.slug || generateSlug(name)
    });
  };

  return (
    <div className="space-y-4 border-t pt-6 mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h3>
      
      <div>
        <Label>URL Slug (Tự động tạo từ tên)</Label>
        <Input
          value={data.slug || ""}
          onChange={(e) => onChange({ ...data, slug: e.target.value })}
          placeholder="san-pham-yen-sao"
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">Để trống để tự động tạo từ tên sản phẩm</p>
      </div>

      <div>
        <Label>Meta Title (Tiêu đề SEO)</Label>
        <Input
          value={data.meta_title || ""}
          onChange={(e) => onChange({ ...data, meta_title: e.target.value })}
          placeholder={`${data.name} - Yến Sào Khang Long`}
          maxLength={60}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">{(data.meta_title || "").length}/60 ký tự</p>
      </div>

      <div>
        <Label>Meta Description (Mô tả SEO)</Label>
        <Textarea
          value={data.meta_description || ""}
          onChange={(e) => onChange({ ...data, meta_description: e.target.value })}
          placeholder="Mô tả ngắn gọn về sản phẩm cho kết quả tìm kiếm"
          maxLength={160}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">{(data.meta_description || "").length}/160 ký tự</p>
      </div>
    </div>
  );
}

export { generateSlug };