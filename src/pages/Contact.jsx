import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await base44.integrations.Core.SendEmail({
        to: "huyenphamthanh80@gmail.com",
        subject: `Contact Form: ${formData.subject}`,
        body: `
          Name: ${formData.name}
          Email: ${formData.email}
          Subject: ${formData.subject}
          
          Message:
          ${formData.message}
        `
      });

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    detail: "0909475099",
    link: "tel:0909475099"
  },
  {
    icon: Mail,
    title: "Email",
    detail: "huyenphamthanh80@gmail.com",
    link: "mailto:huyenphamthanh80@gmail.com"
  },
  {
    icon: MapPin,
    title: "Address",
    detail: "Truong Son street, Ho Chi Minh City, Vietnam"
  },
  {
    icon: Clock,
    title: "Business Hours",
    detail: "Mon-Sat: 9AM-8PM, Sun: 10AM-6PM"
  }];


  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF5]/80 via-white/50 to-[#F5E6D3]/80 backdrop-blur-3xl" style={{ fontFamily: "'Lora', serif" }}>
      {/* Header */}
      <section className="bg-gradient-to-br from-[#F8F5F0]/80 to-[#F5E6D3]/80 backdrop-blur-xl py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white/20 backdrop-blur-2xl rounded-3xl p-12 border border-white/30 shadow-2xl">

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#4A3F35] mb-4 drop-shadow-lg">Liên Hệ Chúng Tôi

            </h1>
            <p className="text-lg text-[#6B5742] max-w-2xl mx-auto"> Chúng tôi rất mong nhận được phản hồi từ bạn. Hãy gửi tin nhắn cho chúng tôi và chúng tôi sẽ phản hồi sớm nhất có thể.

            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 bg-white/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) =>
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}>

                <Card className="text-center h-full shadow-2xl hover:shadow-3xl transition-shadow border-0 bg-white/70 backdrop-blur-xl">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#F5E6D3]/80 to-white/80 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                      <info.icon className="w-8 h-8 text-[#D4AF37]" />
                    </div>
                    <h3 className="font-bold text-[#4A3F35] mb-2">{info.title}</h3>
                    {info.link ?
                  <a href={info.link} className="text-[#6B5742] text-xs hover:text-[#D4AF37] transition-colors">
                        {info.detail}
                      </a> :

                  <p className="text-[#6B5742]">{info.detail}</p>
                  }
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 bg-white/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}>

              <Card className="shadow-2xl border-0 bg-white/70 backdrop-blur-xl">
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-[#4A3F35] mb-6">Send us a Message</h2>
                  
                  {submitted &&
                  <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-md border border-green-200 rounded-lg text-green-800">
                      Thank you! Your message has been sent successfully.
                    </div>
                  }

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm" />

                    </div>

                    <div>
                      <Label htmlFor="email">Your Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm" />

                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] bg-white/80 backdrop-blur-sm" />

                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="mt-2 border-[#F5E6D3] focus:border-[#D4AF37] h-32 bg-white/80 backdrop-blur-sm" />

                    </div>

                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-gradient-to-r from-[#D4AF37]/90 to-[#B8941E]/90 backdrop-blur-md hover:shadow-xl text-white py-6 text-lg rounded-full transition-all duration-300 hover:scale-105 border border-white/20">

                      {sending ? "Sending..." :
                      <>
                          Send Message
                          <Send className="ml-2 w-5 h-5" />
                        </>
                      }
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}>

              <Card className="h-full shadow-2xl overflow-hidden border-0 bg-white/70 backdrop-blur-xl">
                <div className="h-full min-h-[500px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4958831831636!2d106.69831631471892!3d10.776513992321962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc%3A0xf93c1583f0c90281!2sTruong%20Son%20Street!5e0!3m2!1sen!2s!4v1234567890123"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full">
                  </iframe>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>);

}