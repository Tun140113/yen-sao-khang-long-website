/**
 * Discord Webhook Service for Real-time Customer Behavior Tracking
 * Sends Rich Embed notifications to Discord for important customer actions
 * 
 * Privacy-compliant: No personal data (email, phone, real name, full IP) is sent
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

// Event emoji mapping
const EVENT_EMOJIS = {
  VISIT: "🌐",
  VIEW_PRODUCT: "👀",
  ADD_TO_CART: "🛒",
  ORDER_SUCCESS: "💰",
  PAYMENT_FAILED: "❌"
};

// Event descriptions
const EVENT_DESCRIPTIONS = {
  VISIT: "Khách hàng mới truy cập website",
  VIEW_PRODUCT: "Khách hàng đang xem chi tiết sản phẩm",
  ADD_TO_CART: "Khách hàng đã thêm sản phẩm vào giỏ hàng",
  ORDER_SUCCESS: "Đơn hàng mới đã được đặt thành công!",
  PAYMENT_FAILED: "Thanh toán thất bại - cần kiểm tra"
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = () => {
  const existing = sessionStorage.getItem("discord_session_id");
  if (existing) return existing;
  
  const sessionId = `KL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  sessionStorage.setItem("discord_session_id", sessionId);
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
 * Get masked IP placeholder (we can't get real IP from frontend)
 * In production, this should come from backend
 */
const getMaskedIP = () => {
  // Generate a pseudo-random masked IP for demo
  // In real implementation, backend should provide masked IP
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
 * Format price to VND
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(price);
};

/**
 * Format timestamp
 */
const formatTime = () => {
  return new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
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
 * Build Discord Embed payload
 */
const buildEmbed = (eventType, data = {}) => {
  const sessionId = generateSessionId();
  const isLoggedIn = data.isLoggedIn || false;
  const userId = data.userId || null;
  
  const embed = {
    title: `${EVENT_EMOJIS[eventType]} ${eventType}`,
    description: EVENT_DESCRIPTIONS[eventType],
    color: EVENT_COLORS[eventType],
    timestamp: new Date().toISOString(),
    footer: {
      text: `📍 Session: ${sessionId} | ${isLoggedIn ? `🔐 User #${userId?.substring(0, 8) || 'N/A'}` : '👤 Guest'}`,
      icon_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    thumbnail: {
      url: data.productImage || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png"
    },
    fields: []
  };
  
  // Add common fields
  embed.fields.push({
    name: "⏰ Thời gian",
    value: formatTime(),
    inline: true
  });
  
  embed.fields.push({
    name: "🖥️ Thiết bị",
    value: getDeviceInfo(),
    inline: true
  });
  
  embed.fields.push({
    name: "🌐 IP (masked)",
    value: getMaskedIP(),
    inline: true
  });
  
  // Add event-specific fields
  switch (eventType) {
    case 'VISIT':
      embed.fields.push({
        name: "📄 Trang đích",
        value: data.page || window.location.pathname,
        inline: true
      });
      embed.fields.push({
        name: "🔗 Referrer",
        value: document.referrer ? new URL(document.referrer).hostname : "Direct",
        inline: true
      });
      break;
      
    case 'VIEW_PRODUCT':
      if (data.productName) {
        embed.fields.push({
          name: "🧾 Sản phẩm",
          value: data.productName,
          inline: false
        });
      }
      if (data.productPrice) {
        embed.fields.push({
          name: "💵 Giá",
          value: formatPrice(data.productPrice),
          inline: true
        });
      }
      if (data.category) {
        embed.fields.push({
          name: "📁 Danh mục",
          value: data.category,
          inline: true
        });
      }
      break;
      
    case 'ADD_TO_CART':
      if (data.productName) {
        embed.fields.push({
          name: "🧾 Sản phẩm",
          value: data.productName,
          inline: false
        });
      }
      if (data.quantity) {
        embed.fields.push({
          name: "📦 Số lượng",
          value: data.quantity.toString(),
          inline: true
        });
      }
      if (data.productPrice) {
        embed.fields.push({
          name: "💵 Đơn giá",
          value: formatPrice(data.productPrice),
          inline: true
        });
      }
      if (data.variant) {
        embed.fields.push({
          name: "🎨 Phiên bản",
          value: data.variant,
          inline: true
        });
      }
      if (data.cartTotal) {
        embed.fields.push({
          name: "🛒 Tổng giỏ hàng",
          value: formatPrice(data.cartTotal),
          inline: true
        });
      }
      break;
      
    case 'ORDER_SUCCESS':
      embed.description = `🎉 ${EVENT_DESCRIPTIONS[eventType]}`;
      if (data.orderId) {
        embed.fields.push({
          name: "🆔 Mã đơn hàng",
          value: `#${data.orderId.substring(0, 8).toUpperCase()}`,
          inline: true
        });
      }
      if (data.totalAmount) {
        embed.fields.push({
          name: "💰 Tổng tiền",
          value: formatPrice(data.totalAmount),
          inline: true
        });
      }
      if (data.itemCount) {
        embed.fields.push({
          name: "📦 Số sản phẩm",
          value: data.itemCount.toString(),
          inline: true
        });
      }
      if (data.paymentMethod) {
        embed.fields.push({
          name: "💳 Thanh toán",
          value: data.paymentMethod,
          inline: true
        });
      }
      // Add items summary
      if (data.items && data.items.length > 0) {
        const itemsList = data.items.slice(0, 5).map(item => 
          `• ${item.product_name} x${item.quantity}`
        ).join('\n');
        embed.fields.push({
          name: "📋 Sản phẩm",
          value: itemsList + (data.items.length > 5 ? `\n... và ${data.items.length - 5} sản phẩm khác` : ''),
          inline: false
        });
      }
      break;
      
    case 'PAYMENT_FAILED':
      embed.description = `⚠️ ${EVENT_DESCRIPTIONS[eventType]}`;
      if (data.orderId) {
        embed.fields.push({
          name: "🆔 Mã đơn hàng",
          value: `#${data.orderId.substring(0, 8).toUpperCase()}`,
          inline: true
        });
      }
      if (data.totalAmount) {
        embed.fields.push({
          name: "💰 Giá trị",
          value: formatPrice(data.totalAmount),
          inline: true
        });
      }
      if (data.errorReason) {
        embed.fields.push({
          name: "❌ Lý do",
          value: data.errorReason,
          inline: false
        });
      }
      if (data.paymentMethod) {
        embed.fields.push({
          name: "💳 Phương thức",
          value: data.paymentMethod,
          inline: true
        });
      }
      break;
  }
  
  return embed;
};

/**
 * Send Discord Webhook
 */
export const sendDiscordWebhook = async (eventType, data = {}) => {
  // Check for duplicates
  const uniqueKey = data.productId || data.orderId || null;
  if (isDuplicateEvent(eventType, uniqueKey)) {
    console.log(`[Discord] Skipping duplicate event: ${eventType}`);
    return false;
  }
  
  const embed = buildEmbed(eventType, data);
  
  const payload = {
    username: "🪺 Yến Sào Khang Long",
    avatar_url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6917431a7ad8262745a06e71/70f41e0cd_vn-11134216-7r98o-lvndg1x71yt58d-removebg-preview.png",
    embeds: [embed]
  };
  
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log(`[Discord] ✅ Sent ${eventType} event`);
      return true;
    } else {
      console.error(`[Discord] ❌ Failed to send ${eventType}:`, response.status);
      return false;
    }
  } catch (error) {
    console.error(`[Discord] ❌ Error sending ${eventType}:`, error);
    return false;
  }
};

// Export event types for easy usage
export const EVENTS = {
  VISIT: 'VISIT',
  VIEW_PRODUCT: 'VIEW_PRODUCT',
  ADD_TO_CART: 'ADD_TO_CART',
  ORDER_SUCCESS: 'ORDER_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
};

export default {
  sendDiscordWebhook,
  generateSessionId,
  EVENTS
};