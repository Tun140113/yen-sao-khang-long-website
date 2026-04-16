import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, ShoppingCart, User, LogOut, Home, Package, Phone, Info, LayoutDashboard, X, Sparkles, Moon, Sun, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logoutAndRedirect } from "@/lib/logout";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  useEffect(() => {
    checkAuth();
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setCartCount(total);
  };

  const handleLogout = async () => {
    setUser(null);
    logoutAndRedirect(window.location.href);
  };

  const navLinks = [
    { name: "Trang Chủ", path: "Home", icon: Home },
    { name: "Sản Phẩm", path: "Products", icon: Package },
    { name: "Giới Thiệu", path: "About", icon: Info },
    { name: "Liên Hệ", path: "Contact", icon: Phone },
  ];

  const isActive = (path) => currentPageName === path;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white" style={{ fontFamily: "'Lora', serif" }}>
      {/* Modern Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg"
            : "bg-white/80 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 sm:gap-3 group">
              <motion.img
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
                alt="Khang Long"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
              <div className="hidden sm:block">
                <div className="font-bold text-lg sm:text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Khang Long
                </div>
                <div className="text-[10px] sm:text-xs text-amber-600 font-medium -mt-0.5" style={{ fontFamily: "'Lora', serif" }}>
                  Yến Sào Cao Cấp
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={createPageUrl(link.path)}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      className={`relative rounded-full px-4 py-2 transition-all ${
                        isActive(link.path)
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                          : "text-gray-700 hover:bg-amber-50"
                      }`}
                    >
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.name}
                      {isActive(link.path) && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 -z-10"
                        />
                      )}
                    </Button>
                  </motion.div>
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cart */}
              <Link to={createPageUrl("Cart")}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-amber-50">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                    {cartCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-lg"
                      >
                        {cartCount}
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </Link>

              {/* User Actions - Desktop */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to={createPageUrl("OrderHistory")}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="sm" className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Đơn hàng
                      </Button>
                    </motion.div>
                  </Link>
                  {user.role === "admin" && (
                    <Link to={createPageUrl("AdminDashboard")}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </motion.div>
                    </Link>
                  )}
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="rounded-full hover:bg-amber-50"
                    >
                      {darkMode ? <Sun className="w-5 h-5 text-amber-600" /> : <Moon className="w-5 h-5 text-gray-700" />}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="rounded-full hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="hidden sm:flex rounded-full hover:bg-amber-50"
                    >
                      {darkMode ? <Sun className="w-5 h-5 text-amber-600" /> : <Moon className="w-5 h-5 text-gray-700" />}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => base44.auth.redirectToLogin()}
                      size="sm"
                      className="hidden sm:flex bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-full shadow-lg"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Đăng Nhập
                    </Button>
                  </motion.div>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-gradient-to-b from-white to-amber-50/30">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8 pt-2">
                      <div className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        Menu
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <nav className="flex flex-col gap-2 flex-1">
                      {navLinks.map((link) => (
                        <Link key={link.path} to={createPageUrl(link.path)} onClick={() => setMobileMenuOpen(false)}>
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start rounded-xl py-6 text-base ${
                                isActive(link.path)
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                                  : "text-gray-700 hover:bg-amber-50"
                              }`}
                            >
                              <link.icon className="w-5 h-5 mr-3" />
                              {link.name}
                            </Button>
                          </motion.div>
                        </Link>
                      ))}

                      {user && user.role === "admin" && (
                        <Link to={createPageUrl("AdminDashboard")} onClick={() => setMobileMenuOpen(false)}>
                          <motion.div whileTap={{ scale: 0.95 }}>
                            <Button variant="ghost" className="w-full justify-start rounded-xl py-6 text-base text-gray-700 hover:bg-amber-50">
                              <LayoutDashboard className="w-5 h-5 mr-3" />
                              Admin Dashboard
                            </Button>
                          </motion.div>
                        </Link>
                      )}
                    </nav>

                    <div className="pt-6 border-t border-amber-200">
                      {user ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{user.full_name}</div>
                              <div className="text-xs text-gray-600 truncate">{user.email}</div>
                            </div>
                          </div>
                          <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Đăng Xuất
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            base44.auth.redirectToLogin();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl py-6"
                        >
                          <User className="w-5 h-5 mr-2" />
                          Đăng Nhập
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 pt-16 sm:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.1),transparent)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
                  alt="Khang Long"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <div className="font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    Khang Long
                  </div>
                  <div className="text-sm text-gray-400">Yến Sào Cao Cấp</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Mang đến sản phẩm yến sào chất lượng cao với sự tận tâm và chuyên nghiệp.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-amber-400">Liên Kết</h3>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link key={link.path} to={createPageUrl(link.path)}>
                    <div className="text-gray-400 hover:text-amber-400 transition-colors text-sm flex items-center gap-2">
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-amber-400">Liên Hệ</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Email: info@khanglong.com</p>
                <p>Hotline: 1900 xxxx</p>
                <p>Địa chỉ: TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-amber-400">Giờ Làm Việc</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                <p>Thứ 7: 8:00 - 17:00</p>
                <p>Chủ Nhật: Nghỉ</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Yến Sào Khang Long. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
