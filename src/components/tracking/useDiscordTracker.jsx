/**
 * Custom Hook for Discord Tracking
 * Provides easy-to-use tracking methods for components
 */

import { useEffect, useCallback, useRef } from 'react';
import { sendDiscordWebhook, generateSessionId, EVENTS } from './DiscordWebhookService';

/**
 * Hook to track customer behavior and send to Discord
 * @param {Object} options - Configuration options
 * @param {boolean} options.trackVisit - Auto-track page visit (default: false)
 * @param {Object} options.user - Current user object (for logged-in status)
 */
export const useDiscordTracker = (options = {}) => {
  const { trackVisit = false, user = null } = options;
  const hasTrackedVisit = useRef(false);
  
  // Get session ID
  const sessionId = generateSessionId();
  
  // Base data for all events
  const getBaseData = useCallback(() => ({
    isLoggedIn: !!user,
    userId: user?.id || null,
    sessionId
  }), [user, sessionId]);
  
  // Track page visit (only once per session)
  useEffect(() => {
    if (trackVisit && !hasTrackedVisit.current) {
      const visitKey = sessionStorage.getItem('discord_visit_tracked');
      if (!visitKey) {
        sendDiscordWebhook(EVENTS.VISIT, {
          ...getBaseData(),
          page: window.location.pathname
        });
        sessionStorage.setItem('discord_visit_tracked', 'true');
        hasTrackedVisit.current = true;
      }
    }
  }, [trackVisit, getBaseData]);
  
  // Track product view
  const trackProductView = useCallback((product) => {
    if (!product) return;
    
    sendDiscordWebhook(EVENTS.VIEW_PRODUCT, {
      ...getBaseData(),
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.image_url,
      category: product.category
    });
  }, [getBaseData]);
  
  // Track add to cart
  const trackAddToCart = useCallback((product, quantity = 1, variant = null, cartTotal = 0) => {
    if (!product) return;
    
    sendDiscordWebhook(EVENTS.ADD_TO_CART, {
      ...getBaseData(),
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.image_url,
      quantity,
      variant,
      cartTotal
    });
  }, [getBaseData]);
  
  // Track order success
  const trackOrderSuccess = useCallback((order) => {
    if (!order) return;
    
    sendDiscordWebhook(EVENTS.ORDER_SUCCESS, {
      ...getBaseData(),
      orderId: order.id,
      totalAmount: order.total_amount,
      itemCount: order.items?.length || 0,
      items: order.items,
      paymentMethod: order.payment_method
    });
  }, [getBaseData]);
  
  // Track payment failed
  const trackPaymentFailed = useCallback((order, errorReason = "Không xác định") => {
    if (!order) return;
    
    sendDiscordWebhook(EVENTS.PAYMENT_FAILED, {
      ...getBaseData(),
      orderId: order.id,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      errorReason
    });
  }, [getBaseData]);
  
  return {
    sessionId,
    trackProductView,
    trackAddToCart,
    trackOrderSuccess,
    trackPaymentFailed
  };
};

export default useDiscordTracker;