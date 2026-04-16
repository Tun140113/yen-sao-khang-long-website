
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Play, Film, User, Book, Star, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Videos() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => base44.entities.Video.list("order"),
  });

  const categories = [
    { value: "all", label: "Tất Cả", icon: Film },
    { value: "product_intro", label: "Giới Thiệu Sản Phẩm", icon: Star },
    { value: "customer_review", label: "Đánh Giá Khách Hàng", icon: User },
    { value: "tutorial", label: "Hướng Dẫn", icon: Book },
    { value: "brand_story", label: "Câu Chuyện Thương Hiệu", icon: Award }
  ];

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{10,12})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const filteredVideos = categoryFilter === "all" 
    ? videos 
    : videos.filter(v => v.category === categoryFilter);

  const featuredVideos = videos.filter(v => v.is_featured);

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
              <Film className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">
              Thư Viện Video
            </h1>
            <p className="text-lg md:text-xl text-[#6B5742] max-w-3xl mx-auto leading-relaxed">
              Khám phá câu chuyện về yến sào và những chia sẻ từ khách hàng
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <section className="py-16 bg-white/40 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-bold text-[#4A3F35] mb-8">Video Nổi Bật</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredVideos.slice(0, 2).map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer group hover:shadow-3xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#F8F5F0] to-[#F5E6D3]">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-20 h-20 text-[#D4AF37]/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-[#D4AF37] ml-1" />
                        </div>
                      </div>
                      <Badge className="absolute top-4 right-4 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-white border-0">
                        Nổi bật
                      </Badge>
                    </div>
                    <CardContent className="p-6 bg-white/60 backdrop-blur-sm">
                      <h3 className="font-serif text-xl font-bold text-[#4A3F35] mb-2 group-hover:text-[#D4AF37] transition-colors">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-[#6B5742] line-clamp-2">{video.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="py-8 bg-white/50 backdrop-blur-xl sticky top-20 z-40 border-y border-[#F5E6D3]/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 shadow-lg ${
                    categoryFilter === cat.value
                      ? "bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md text-white scale-105 border border-white/20"
                      : "bg-white/70 backdrop-blur-xl text-[#6B5742] hover:bg-[#F5E6D3]/50 border border-white/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-16 bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[#6B5742]">Đang tải video...</p>
            </div>
          ) : filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVideos.map((video, index) => {
                const category = categories.find(c => c.category === video.category);
                const Icon = category?.icon || Film;
                
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Card
                      className="overflow-hidden cursor-pointer group hover:shadow-3xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#F8F5F0] to-[#F5E6D3]">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="w-16 h-16 text-[#D4AF37]/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-7 h-7 text-[#D4AF37] ml-1" />
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-5 bg-white/60 backdrop-blur-sm">
                        <h3 className="font-serif text-lg font-bold text-[#4A3F35] mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-sm text-[#6B5742] line-clamp-2">
                            {video.description}
                          </p>
                        )}
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
                <Film className="w-16 h-16 text-[#D4AF37]/30" />
              </div>
              <h3 className="text-2xl font-bold text-[#4A3F35] mb-2">Chưa có video</h3>
              <p className="text-[#6B5742]">Video sẽ được cập nhật sớm</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Video Dialog */}
      <AnimatePresence>
        {selectedVideo && (
          <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border-0 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                  {selectedVideo.video_type === 'youtube' && selectedVideo.youtube_url ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedVideo.youtube_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : selectedVideo.video_url ? (
                    <video
                      src={selectedVideo.video_url}
                      controls
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F8F5F0] to-[#F5E6D3]">
                      <Film className="w-32 h-32 text-[#D4AF37]/30" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="font-serif text-3xl font-bold text-[#4A3F35] mb-4">
                    {selectedVideo.title}
                  </h2>
                  {selectedVideo.description && (
                    <p className="text-[#6B5742] leading-relaxed">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
