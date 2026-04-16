import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getFromUrl = (search) => {
  try {
    const params = new URLSearchParams(search);
    const from = params.get("from_url");
    return from ? decodeURIComponent(from) : null;
  } catch {
    return null;
  }
};

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromUrl = useMemo(() => getFromUrl(location.search), [location.search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState({ type: "", message: "" });
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  useEffect(() => {
    // If already authenticated, bounce back to from_url (or home)
    let cancelled = false;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!cancelled && authed) {
          const target = fromUrl || "/";
          window.location.href = target;
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromUrl]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      // Force a full reload to ensure appParams/AuthContext rehydrate cleanly
      const target = fromUrl || "/";
      window.location.href = target;
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại. Kiểm tra lại email/mật khẩu.";
      setError(String(message));
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotStatus({ type: "", message: "" });
    setForgotSubmitting(true);
    try {
      await base44.auth.resetPasswordRequest(forgotEmail.trim());
      setForgotStatus({
        type: "success",
        message: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả Spam)."
      });
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        "Gửi email đặt lại mật khẩu thất bại. Thử lại sau.";
      setForgotStatus({ type: "error", message: String(message) });
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-sm text-gray-600 mt-1">
            Đăng nhập để tiếp tục sử dụng các tính năng tài khoản.
          </p>
        </div>

        <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {error ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !email.trim() || !password}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <Button
            type="button"
            variant="link"
            className="w-full text-sm text-gray-600"
            onClick={() => {
              setForgotEmail(email.trim());
              setForgotStatus({ type: "", message: "" });
              setForgotOpen(true);
            }}
          >
            Quên mật khẩu?
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={handleBackHome}>
            Về trang chủ
          </Button>
        </form>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            {forgotStatus.message ? (
              <div
                className={`text-sm rounded-lg p-3 border ${
                  forgotStatus.type === "success"
                    ? "text-green-700 bg-green-50 border-green-100"
                    : "text-red-600 bg-red-50 border-red-100"
                }`}
              >
                {forgotStatus.message}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={forgotSubmitting || !forgotEmail.trim()}>
              {forgotSubmitting ? "Đang gửi..." : "Gửi email reset"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
