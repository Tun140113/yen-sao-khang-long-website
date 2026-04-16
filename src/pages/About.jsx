import React from "react";
import { motion } from "framer-motion";
import { Award, Heart, Leaf, Users, CheckCircle } from "lucide-react";

export default function About() {
  const values = [
  {
    icon: Heart,
    title: "Quality First",
    description: "We never compromise on quality. Every product undergoes rigorous testing."
  },
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Pure and natural ingredients with no artificial additives or preservatives."
  },
  {
    icon: Award,
    title: "Certified Excellence",
    description: "Meeting international standards with full quality certifications."
  },
  {
    icon: Users,
    title: "Customer Focused",
    description: "Your health and satisfaction are at the heart of everything we do."
  }];


  const milestones = [
  { year: "2010", event: "Thành lập Yến Sào Khang Long với tầm nhìn về chất lượng" },
  { year: "2015", event: "Đạt được chứng nhận chất lượng quốc tế" },
  { year: "2018", event: "Mở rộng phục vụ hơn 10.000 khách hàng hài lòng" },
  { year: "2023", event: "Ra mắt sáng kiến nguồn cung bền vững" }];


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl" style={{ fontFamily: "'Lora', serif" }}>
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-2xl rounded-3xl p-12 border border-white/30 shadow-2xl">

            <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#4A3F35] mb-6 drop-shadow-lg">Về Chúng Tôi

            </h1>
            <p className="text-xl text-[#6B5742] leading-relaxed">
              Hành trình của đam mê, chất lượng và sự cống hiến để mang đến cho bạn những sản phẩm yến sào tốt nhất
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-white/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#F8F5F0]/80 to-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/30">

              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/80 to-[#F5E6D3]/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Heart className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#4A3F35] mb-4">Sứ Mệnh Của Chúng Tôi</h2>
              <p className="text-lg text-[#6B5742] leading-relaxed">Cung cấp những sản phẩm yến sào chất lượng cao nhất. Hỗ trợ tăng cường sức khỏe cho người tiêu dùng, bằng sự tận tâm, nhiệt huyết và cống hiến vì sức khỏe cộng đồng

              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/30">

              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/80 to-[#B8941E]/80 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Award className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-[#4A3F35] mb-4">Tầm Nhìn Của Chúng Tôi</h2>
              <p className="text-lg text-[#6B5742] leading-relaxed">Trở thành một thương hiệu đáng tin cậy nhất trong các sản phẩm yến sào trên toàn cầu, thiết lập tiêu chuẩn về chất lượng, độ tinh khiết và sự hài lòng của khách hàng.

              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-sm">
              Our Core Values
            </h2>
            <p className="text-lg text-[#6B5742] max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) =>
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group">

                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37] to-[#F5E6D3] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-xl rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/30 shadow-xl">
                    <value.icon className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#4A3F35] mb-3">{value.title}</h3>
                <p className="text-[#6B5742] leading-relaxed">{value.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Quality Process */}
      <section className="py-24 bg-gradient-to-b from-[#FFFBF5]/60 to-white/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-sm">
              Our Quality Process
            </h2>
            <p className="text-lg text-[#6B5742] max-w-2xl mx-auto">
              From source to your table, every step is carefully controlled
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
            { step: "1", title: "Ethical Sourcing", desc: "Partnering with certified farms that follow sustainable practices" },
            { step: "2", title: "Quality Testing", desc: "Rigorous laboratory testing to ensure purity and safety" },
            { step: "3", title: "Expert Processing", desc: "Traditional methods combined with modern hygiene standards" }].
            map((item, index) =>
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative">

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-shadow border border-white/30">
                  <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8941E] backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {item.step}
                  </div>
                  <div className="pt-4">
                    <CheckCircle className="w-8 h-8 text-[#D4AF37] mb-4" />
                    <h3 className="text-xl font-bold text-[#4A3F35] mb-3">{item.title}</h3>
                    <p className="text-[#6B5742] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-gradient-to-br from-[#4A3F35] to-[#6B5742] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16">

            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Our Journey</h2>
            <p className="text-xl text-gray-200">Key milestones in our story</p>
          </motion.div>

          <div className="space-y-8">
            {milestones.map((milestone, index) =>
            <motion.div
              key={milestone.year}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-6">

                <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl border border-white/30">
                  {milestone.year}
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
                  <p className="text-lg text-gray-100">{milestone.event}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>);

}