export const clearAuthToken = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem("base44_access_token");
    window.localStorage.removeItem("token");
  } catch {
    // ignore
  }
};

export const logoutAndRedirect = (redirectUrl = "/") => {
  clearAuthToken();
  if (typeof window !== "undefined") {
    window.location.href = redirectUrl;
  }
};

