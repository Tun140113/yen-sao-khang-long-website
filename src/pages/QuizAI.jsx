
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, ArrowLeft, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "../components/ProductCard";

export default function QuizAI() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: questions = [] } = useQuery({
    queryKey: ["quiz-questions"],
    queryFn: () => base44.entities.QuizQuestion.filter({ is_active: true }, "order"),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-quiz"],
    queryFn: () => base44.entities.Product.list(),
  });

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
    
    if (!isLastQuestion) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Build prompt for AI based on answers
      const answerTexts = questions.map((q) => {
        const answer = answers[q.id];
        const option = q.options?.find(opt => opt.value === answer);
        return `${q.question}: ${option?.text || answer}`;
      }).join('\n');

      const prompt = `Dựa trên câu trả lời của khách hàng về nhu cầu mua yến sào:

${answerTexts}

Danh sách sản phẩm hiện có:
${products.map(p => `- ${p.name}: ${p.description || ''} (${p.category})`).join('\n')}

Hãy gợi ý 3 sản phẩm phù hợp nhất cho khách hàng. Trả về JSON array với format:
[
  {
    "product_name": "tên sản phẩm",
    "reason": "lý do gợi ý ngắn gọn (1-2 câu)"
  }
]`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Match recommended products with actual products
      const recommendedProducts = result.recommendations?.map(rec => {
        const product = products.find(p => 
          p.name.toLowerCase().includes(rec.product_name.toLowerCase()) ||
          rec.product_name.toLowerCase().includes(p.name.toLowerCase())
        );
        return {
          product,
          reason: rec.reason
        };
      }).filter(r => r.product);

      setRecommendations(recommendedProducts);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      // Fallback to random products
      const randomProducts = products
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(p => ({ product: p, reason: "Sản phẩm phổ biến được nhiều người tin dùng" }));
      setRecommendations(randomProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendations(null);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 to-white/50 backdrop-blur-3xl flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border border-white/30">
          <Sparkles className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#4A3F35] mb-2">Trắc nghiệm đang được cập nhật</h2>
          <p className="text-[#6B5742]">Vui lòng quay lại sau</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {!recommendations ? (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37]/80 to-[#B8941E]/80 backdrop-blur-md rounded-full mb-6 shadow-2xl border border-white/30">
                <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">
                Tìm Yến Sào Phù Hợp Với Bạn
              </h1>
              <p className="text-lg text-[#6B5742]">
                Trả lời vài câu hỏi để nhận gợi ý sản phẩm phù hợp nhất
              </p>
            </motion.div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#6B5742]">
                  Câu hỏi {currentStep + 1} / {questions.length}
                </span>
                <span className="text-sm font-medium text-[#D4AF37]">
                  {Math.round(((currentStep + 1) / questions.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-white/60 backdrop-blur-md rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                    <CardContent className="p-8 md:p-12">
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#4A3F35] mb-8">
                        {currentQuestion.question}
                      </h2>

                      <div className="grid gap-4">
                        {currentQuestion.options?.map((option, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleAnswer(option.value)}
                            className={`p-6 text-left border-2 rounded-xl transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#F5E6D3]/30 hover:scale-[1.02] backdrop-blur-sm ${
                              answers[currentQuestion.id] === option.value
                                ? 'border-[#D4AF37] bg-[#F5E6D3]/50 shadow-xl'
                                : 'border-[#F5E6D3] bg-white/50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {option.icon && (
                                <span className="text-3xl">{option.icon}</span>
                              )}
                              <span className="text-lg font-medium text-[#4A3F35]">
                                {option.text}
                              </span>
                            </div>
                          </motion.button>
                        ))}
                      </div>

                      <div className="flex justify-between mt-8">
                        <Button
                          variant="ghost"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                          className="hover:bg-[#F5E6D3]/50 backdrop-blur-sm"
                        >
                          <ArrowLeft className="w-5 h-5 mr-2" />
                          Quay lại
                        </Button>

                        {isLastQuestion && answers[currentQuestion.id] && (
                          <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-xl text-white px-8 border border-white/20"
                          >
                            {loading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Đang phân tích...
                              </>
                            ) : (
                              <>
                                Xem gợi ý
                                <Sparkles className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Results */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/80 to-green-600/80 backdrop-blur-md rounded-full mb-6 shadow-2xl border border-white/30">
                <Sparkles className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">
                Gợi Ý Dành Cho Bạn! ✨
              </h2>
              <p className="text-lg text-[#6B5742]">
                Dựa trên câu trả lời của bạn, chúng tôi gợi ý những sản phẩm sau:
              </p>
            </div>

            <div className="space-y-8 mb-8">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="overflow-hidden shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                    <CardContent className="p-0">
                      <div className="grid md:grid-cols-3 gap-6 p-6">
                        <div className="md:col-span-1">
                          <ProductCard product={rec.product} />
                        </div>
                        <div className="md:col-span-2 flex flex-col justify-center bg-white/40 backdrop-blur-sm rounded-xl p-6">
                          <Badge className="w-fit bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md text-white border-0 mb-3 border-white/20 shadow-lg">
                            Gợi ý #{index + 1}
                          </Badge>
                          <h3 className="font-serif text-2xl font-bold text-[#4A3F35] mb-3">
                            {rec.product.name}
                          </h3>
                          <p className="text-[#6B5742] mb-4 leading-relaxed">
                            <strong className="text-[#D4AF37]">Tại sao phù hợp:</strong> {rec.reason}
                          </p>
                          <Button
                            onClick={() => navigate(createPageUrl(`ProductDetail?id=${rec.product.id}`))}
                            className="w-fit bg-gradient-to-r from-[#D4AF37] to-[#B8941E] backdrop-blur-md hover:shadow-xl text-white"
                          >
                            Xem chi tiết
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleRestart}
                variant="outline"
                className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#F5E6D3]/50 bg-white/70 backdrop-blur-md"
              >
                Làm lại trắc nghiệm
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Products"))}
                className="bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-xl text-white border border-white/20"
              >
                Xem tất cả sản phẩm
                <ShoppingCart className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
