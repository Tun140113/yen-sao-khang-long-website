
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Award, Shield, CheckCircle, Calendar, Building } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Certificates() {
  const [selectedCert, setSelectedCert] = useState(null);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: () => base44.entities.Certificate.list("order"),
  });

  const getCategoryInfo = (type) => {
    const info = {
      quality: { label: "Chất Lượng", icon: Award, color: "from-blue-500 to-blue-600" },
      safety: { label: "An Toàn", icon: Shield, color: "from-green-500 to-green-600" },
      origin: { label: "Xuất Xứ", icon: CheckCircle, color: "from-purple-500 to-purple-600" },
      award: { label: "Giải Thưởng", icon: Award, color: "from-yellow-500 to-yellow-600" },
      other: { label: "Khác", icon: CheckCircle, color: "from-gray-500 to-gray-600" }
    };
    return info[type] || info.other;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center bg-white/20 backdrop-blur-2xl rounded-3xl p-12 border border-white/30 shadow-2xl"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37]/80 to-[#B8941E]/80 backdrop-blur-md rounded-full mb-6 shadow-xl border border-white/30">
              <Award className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">
              Giấy Chứng Nhận
            </h1>
            <p className="text-lg md:text-xl text-[#6B5742] max-w-3xl mx-auto leading-relaxed">
              Cam kết chất lượng được chứng nhận bởi các tổ chức uy tín
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certificates Grid */}
      <section className="py-20 bg-white/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#6B5742]">Đang tải chứng nhận...</p>
            </div>
          ) : certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificates.map((cert, index) => {
                const categoryInfo = getCategoryInfo(cert.certificate_type);
                const Icon = categoryInfo.icon;
                
                return (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer group hover:shadow-3xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl"
                      onClick={() => setSelectedCert(cert)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#F8F5F0] to-[#F5E6D3]">
                        {cert.image_url ? (
                          <img
                            src={cert.image_url}
                            alt={cert.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="w-20 h-20 text-[#D4AF37]/30" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <Badge className={`bg-gradient-to-r ${categoryInfo.color} text-white border-0 px-3 py-1`}>
                            {categoryInfo.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6 bg-white/60 backdrop-blur-sm">
                        <h3 className="font-serif text-xl font-bold text-[#4A3F35] mb-3 group-hover:text-[#D4AF37] transition-colors">
                          {cert.name}
                        </h3>
                        
                        {cert.description && (
                          <p className="text-sm text-[#6B5742] mb-4 line-clamp-2">
                            {cert.description}
                          </p>
                        )}
                        
                        <div className="space-y-2 text-sm text-[#6B5742]">
                          {cert.issued_by && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-[#D4AF37]" />
                              <span>{cert.issued_by}</span>
                            </div>
                          )}
                          {cert.issued_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-[#D4AF37]" />
                              <span>{new Date(cert.issued_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[#F5E6D3]/80 to-[#F8F5F0]/80 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/30">
                <Award className="w-16 h-16 text-[#D4AF37]/30" />
              </div>
              <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Chưa có chứng nhận</h3>
              <p className="text-[#6B5742]">Chứng nhận sẽ được cập nhật sớm</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Detail Dialog */}
      <AnimatePresence>
        {selectedCert && (
          <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative aspect-video w-full mb-6 rounded-lg overflow-hidden bg-gradient-to-br from-[#F8F5F0] to-[#F5E6D3]">
                  {selectedCert.image_url ? (
                    <img
                      src={selectedCert.image_url}
                      alt={selectedCert.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-32 h-32 text-[#D4AF37]/30" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Badge className={`bg-gradient-to-r ${getCategoryInfo(selectedCert.certificate_type).color} text-white border-0 mb-3`}>
                      {getCategoryInfo(selectedCert.certificate_type).label}
                    </Badge>
                    <h2 className="font-serif text-3xl font-bold text-[#4A3F35] mb-2">
                      {selectedCert.name}
                    </h2>
                  </div>
                  
                  {selectedCert.description && (
                    <p className="text-[#6B5742] leading-relaxed">
                      {selectedCert.description}
                    </p>
                  )}
                  
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#F5E6D3]">
                    {selectedCert.issued_by && (
                      <div className="flex items-start gap-3">
                        <Building className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                        <div>
                          <p className="text-sm text-[#6B5742]/70">Đơn vị cấp</p>
                          <p className="font-semibold text-[#4A3F35]">{selectedCert.issued_by}</p>
                        </div>
                      </div>
                    )}
                    {selectedCert.issued_date && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#D4AF37] mt-0.5" />
                        <div>
                          <p className="text-sm text-[#6B5742]/70">Ngày cấp</p>
                          <p className="font-semibold text-[#4A3F35]">
                            {new Date(selectedCert.issued_date).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Trust Section */}
      <section className="py-20 bg-gradient-to-br from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-md rounded-full mb-6 shadow-xl">
              <Shield className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
              Cam Kết Chất Lượng
            </h2>
            <p className="text-lg text-gray-200 leading-relaxed">
              Mỗi chứng nhận là minh chứng cho sự tận tâm của chúng tôi trong việc mang đến sản phẩm yến sào cao cấp, an toàn và chất lượng nhất cho khách hàng.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
