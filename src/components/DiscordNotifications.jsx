/**
 * Discord Webhook Notification System - Enhanced Version
 * Real-time customer behavior tracking with Rich Embeds
 * 
 * Privacy-compliant: No personal data (email, phone, real name, full IP) is sent
 * Only sends: Session ID, User status (Guest/Logged-in), masked IP, device info
 */

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1442076918764798002/-Ng6ZlYwbOLWLSwHnJnZ6wOuRRQThCLyiHh3OQ06wmMbE6YlMqWKT34p55pC0jDEvOou";

// Event color mapping (Discord uses decimal colors)
const EVENT_COLORS = {
  VISIT: 0x3498db,          // Blue
  VIEW_PRODUCT: 0xf1c40f,   // Yellow
  ADD_TO_CART: 0xe67e22,    // Orange
  ORDER_SUCCESS: 0x2ecc71,  // Green
  PAYMENT_FAILED: 0xe74c3c  // Red
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Generate or get session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("discord_session_id");
  if (!sessionId) {
    sessionId = `KL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    sessionStorage.setItem("discord_session_id", sessionId);
  }
  return sessionId;
};

/**
 * Get device/platform info
 */
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = "Unknown";
  let platform = "Unknown";
  
  // Detect device type
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    device = "📱 Mobile";
  } else {
    device = "💻 Desktop";
  }
  
  // Detect platform
  if (/Windows/.test(ua)) platform = "Windows";
  else if (/Mac/.test(ua)) platform = "macOS";
  else if (/Linux/.test(ua)) platform = "Linux";
  else if (/Android/.test(ua)) platform = "Android";
  else if (/iPhone|iPad/.test(ua)) platform = "iOS";
  
  return `${device} / ${platform}`;
};

/**
 * Get masked IP placeholder
 */
const getMaskedIP = () => {
  const cached = sessionStorage.getItem("masked_ip");
  if (cached) return cached;
  
  const segments = [
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
    "xxx",
    "xxx"
  ];
  const maskedIP = segments.join(".");
  sessionStorage.setItem("masked_ip", maskedIP);
  return maskedIP;
};

/**
 * Format time in Vietnam timezone
 */
const getVietnamTime = () => {
  return new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format price
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

/**
 * Check if event was already sent (prevent duplicates)
 */
const isDuplicateEvent = (eventType, uniqueKey = null) => {
  const key = `discord_sent_${eventType}_${uniqueKey || 'default'}`;
  const lastSent = sessionStorage.getItem(key);
  
  if (eventType === 'VISIT') {
    // VISIT only once per session
    return !!lastSent;
  }
  
  if (lastSent) {
    const timeDiff = Date.now() - parseInt(lastSent);
    // Prevent same event within 5 seconds
    if (timeDiff < 5000) return true;
  }
  
  sessionStorage.setItem(key, Date.now().toString());
  return false;
};

/**
 * Get user status (logged in or guest)
 */
const getUserStatus = (isLoggedIn = false, userId = null) => {
  if (isLoggedIn && userId) {
    return `🔐 User #${userId.substring(0, 8)}`;
  }
  return "👤 Guest";
};

/**
 * Send notification to Discord
 */
const sendDiscordNotification = async (embed) => {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "🪺 Yến Sào Khang Long",
        avatar_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png",
        embeds: [embed]
      })
    });
    
    if (response.ok) {
      console.log("[Discord] ✅ Notification sent successfully");
      return true;
    } else {
      console.error("[Discord] ❌ Failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[Discord] ❌ Error:", error);
    return false;
  }
};

// ==================== EVENT NOTIFICATIONS ====================

/**
 * 🌐 VISIT - Website Visit Notification (once per session)
 */
export const notifyWebsiteVisit = async (pageName = "Trang chủ", options = {}) => {
  const { isLoggedIn = false, userId = null } = options;
  
  // Check for duplicate
  if (isDuplicateEvent('VISIT')) {
    console.log("[Discord] Skipping duplicate VISIT event");
    return;
  }
  
  const sessionId = getSessionId();
  
  const embed = {
    title: "🌐 VISIT - Khách Truy Cập Website",
    description: "Có khách hàng mới vừa truy cập website",
    color: EVENT_COLORS.VISIT,
    thumbnail: {
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    fields: [
      {
        name: "📄 Trang đích",
        value: pageName,
        inline: true
      },
      {
        name: "🔗 Referrer",
        value: document.referrer ? new URL(document.referrer).hostname : "Direct",
        inline: true
      },
      {
        name: "⏰ Thời gian",
        value: getVietnamTime(),
        inline: true
      },
      {
        name: "🖥️ Thiết bị",
        value: getDeviceInfo(),
        inline: true
      },
      {
        name: "🌐 IP (masked)",
        value: getMaskedIP(),
        inline: true
      }
    ],
    footer: {
      text: `📍 Session: ${sessionId} | ${getUserStatus(isLoggedIn, userId)}`,
      icon_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    timestamp: new Date().toISOString()
  };
  
  await sendDiscordNotification(embed);
};

/**
 * 👀 VIEW_PRODUCT - Product View Notification
 */
export const notifyProductView = async (productName, productPrice, productId, options = {}) => {
  const { isLoggedIn = false, userId = null, category = null, imageUrl = null } = options;
  
  // Check for duplicate
  if (isDuplicateEvent('VIEW_PRODUCT', productId)) {
    console.log("[Discord] Skipping duplicate VIEW_PRODUCT event");
    return;
  }
  
  const sessionId = getSessionId();
  
  const embed = {
    title: "👀 VIEW_PRODUCT - Khách Xem Sản Phẩm",
    description: "Khách hàng đang quan tâm đến sản phẩm",
    color: EVENT_COLORS.VIEW_PRODUCT,
    thumbnail: {
      url: imageUrl || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    fields: [
      {
        name: "🧾 Sản phẩm",
        value: productName,
        inline: false
      },
      {
        name: "💵 Giá",
        value: formatPrice(productPrice),
        inline: true
      },
      {
        name: "📁 Danh mục",
        value: category || "N/A",
        inline: true
      },
      {
        name: "⏰ Thời gian",
        value: getVietnamTime(),
        inline: true
      },
      {
        name: "🖥️ Thiết bị",
        value: getDeviceInfo(),
        inline: true
      },
      {
        name: "🌐 IP (masked)",
        value: getMaskedIP(),
        inline: true
      }
    ],
    footer: {
      text: `📍 Session: ${sessionId} | ${getUserStatus(isLoggedIn, userId)}`,
      icon_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    timestamp: new Date().toISOString()
  };
  
  await sendDiscordNotification(embed);
};

/**
 * 🛒 ADD_TO_CART - Add to Cart Notification
 */
export const notifyAddToCart = async (productName, quantity, price, options = {}) => {
  const { isLoggedIn = false, userId = null, variant = null, cartTotal = 0, imageUrl = null } = options;
  
  // Check for duplicate
  if (isDuplicateEvent('ADD_TO_CART', productName)) {
    console.log("[Discord] Skipping duplicate ADD_TO_CART event");
    return;
  }
  
  const sessionId = getSessionId();
  const totalValue = price * quantity;
  
  const embed = {
    title: "🛒 ADD_TO_CART - Thêm Vào Giỏ Hàng",
    description: "Khách hàng đã thêm sản phẩm vào giỏ - Cơ hội chốt đơn!",
    color: EVENT_COLORS.ADD_TO_CART,
    thumbnail: {
      url: imageUrl || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    fields: [
      {
        name: "🧾 Sản phẩm",
        value: productName,
        inline: false
      },
      {
        name: "📦 Số lượng",
        value: quantity.toString(),
        inline: true
      },
      {
        name: "💵 Đơn giá",
        value: formatPrice(price),
        inline: true
      },
      {
        name: "💰 Thành tiền",
        value: formatPrice(totalValue),
        inline: true
      },
      ...(variant ? [{
        name: "🎨 Phiên bản",
        value: variant,
        inline: true
      }] : []),
      ...(cartTotal > 0 ? [{
        name: "🛒 Tổng giỏ hàng",
        value: formatPrice(cartTotal),
        inline: true
      }] : []),
      {
        name: "⏰ Thời gian",
        value: getVietnamTime(),
        inline: true
      },
      {
        name: "🖥️ Thiết bị",
        value: getDeviceInfo(),
        inline: true
      },
      {
        name: "🌐 IP (masked)",
        value: getMaskedIP(),
        inline: true
      }
    ],
    footer: {
      text: `📍 Session: ${sessionId} | ${getUserStatus(isLoggedIn, userId)}`,
      icon_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    timestamp: new Date().toISOString()
  };
  
  await sendDiscordNotification(embed);
};

/**
 * 💰 ORDER_SUCCESS - Purchase Success Notification
 * Privacy-compliant version - no personal info
 */
export const notifyPurchaseSuccess = async (orderData, options = {}) => {
  const { isLoggedIn = true, userId = null } = options;
  
  // Check for duplicate
  if (isDuplicateEvent('ORDER_SUCCESS', orderData.id || Date.now().toString())) {
    console.log("[Discord] Skipping duplicate ORDER_SUCCESS event");
    return;
  }
  
  const sessionId = getSessionId();
  
  // Create items list (product info only, no personal data)
  const itemsList = orderData.items
    .slice(0, 5)
    .map(item => `• ${item.product_name} x${item.quantity}`)
    .join('\n');
  
  const moreItems = orderData.items.length > 5 ? `\n... và ${orderData.items.length - 5} sản phẩm khác` : '';
  
  const embed = {
    title: "💰 ORDER_SUCCESS - Đơn Hàng Mới!",
    description: "🎉 Có đơn hàng mới được đặt thành công!",
    color: EVENT_COLORS.ORDER_SUCCESS,
    thumbnail: {
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    fields: [
      {
        name: "🆔 Mã đơn hàng",
        value: `#${(orderData.id || Date.now().toString()).substring(0, 8).toUpperCase()}`,
        inline: true
      },
      {
        name: "💰 Tổng tiền",
        value: `**${formatPrice(orderData.total_amount)}**`,
        inline: true
      },
      {
        name: "📦 Số sản phẩm",
        value: orderData.items.length.toString(),
        inline: true
      },
      {
        name: "💳 Thanh toán",
        value: orderData.payment_method === "cod" ? "COD" : orderData.payment_method?.toUpperCase() || "N/A",
        inline: true
      },
      {
        name: "📋 Sản phẩm",
        value: itemsList + moreItems,
        inline: false
      },
      {
        name: "⏰ Thời gian",
        value: getVietnamTime(),
        inline: true
      },
      {
        name: "🖥️ Thiết bị",
        value: getDeviceInfo(),
        inline: true
      },
      {
        name: "🌐 IP (masked)",
        value: getMaskedIP(),
        inline: true
      }
    ],
    footer: {
      text: `📍 Session: ${sessionId} | ${getUserStatus(isLoggedIn, userId)} | 🔔 Xử lý đơn hàng ngay!`,
      icon_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    timestamp: new Date().toISOString()
  };
  
  await sendDiscordNotification(embed);
};

/**
 * ❌ PAYMENT_FAILED - Payment Failed Notification
 */
export const notifyPaymentFailed = async (orderData, errorReason = "Không xác định", options = {}) => {
  const { isLoggedIn = true, userId = null } = options;
  
  // Check for duplicate
  if (isDuplicateEvent('PAYMENT_FAILED', orderData.id || Date.now().toString())) {
    console.log("[Discord] Skipping duplicate PAYMENT_FAILED event");
    return;
  }
  
  const sessionId = getSessionId();
  
  const embed = {
    title: "❌ PAYMENT_FAILED - Thanh Toán Thất Bại",
    description: "⚠️ Có giao dịch thanh toán không thành công - cần kiểm tra",
    color: EVENT_COLORS.PAYMENT_FAILED,
    thumbnail: {
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    fields: [
      {
        name: "🆔 Mã đơn hàng",
        value: `#${(orderData.id || "N/A").substring(0, 8).toUpperCase()}`,
        inline: true
      },
      {
        name: "💰 Giá trị",
        value: formatPrice(orderData.total_amount || 0),
        inline: true
      },
      {
        name: "💳 Phương thức",
        value: orderData.payment_method?.toUpperCase() || "N/A",
        inline: true
      },
      {
        name: "❌ Lý do",
        value: errorReason,
        inline: false
      },
      {
        name: "⏰ Thời gian",
        value: getVietnamTime(),
        inline: true
      },
      {
        name: "🖥️ Thiết bị",
        value: getDeviceInfo(),
        inline: true
      },
      {
        name: "🌐 IP (masked)",
        value: getMaskedIP(),
        inline: true
      }
    ],
    footer: {
      text: `📍 Session: ${sessionId} | ${getUserStatus(isLoggedIn, userId)} | ⚠️ Cần theo dõi`,
      icon_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    timestamp: new Date().toISOString()
  };
  
  await sendDiscordNotification(embed);
};

// Export all functions
export default {
  notifyWebsiteVisit,
  notifyProductView,
  notifyAddToCart,
  notifyPurchaseSuccess,
  notifyPaymentFailed,
  getSessionId
};