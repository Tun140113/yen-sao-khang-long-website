import About from './pages/About';
import AdminShippingMethods from './pages/AdminShippingMethods';
import OrderHistory from './pages/OrderHistory';
import Account from './pages/Account';
import AdminCertificates from './pages/AdminCertificates';
import AdminCustomerChat from './pages/AdminCustomerChat';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmailAutomation from './pages/AdminEmailAutomation';
import AdminEmailCampaigns from './pages/AdminEmailCampaigns';
import AdminEmailTemplates from './pages/AdminEmailTemplates';
import AdminOrders from './pages/AdminOrders';
import AdminPaymentInfo from './pages/AdminPaymentInfo';
import AdminProducts from './pages/AdminProducts';
import AdminVideos from './pages/AdminVideos';
import AdminVouchers from './pages/AdminVouchers';
import Cart from './pages/Cart';
import Certificates from './pages/Certificates';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Home from './pages/Home';
import OrderTracking from './pages/OrderTracking';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import QuizAI from './pages/QuizAI';
import SellerChat from './pages/SellerChat';
import Videos from './pages/Videos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Account": Account,
    "AdminCertificates": AdminCertificates,
    "AdminCustomerChat": AdminCustomerChat,
    "AdminDashboard": AdminDashboard,
    "AdminEmailAutomation": AdminEmailAutomation,
    "AdminEmailCampaigns": AdminEmailCampaigns,
    "AdminEmailTemplates": AdminEmailTemplates,
    "AdminOrders": AdminOrders,
    "AdminPaymentInfo": AdminPaymentInfo,
    "AdminProducts": AdminProducts,
    "AdminVideos": AdminVideos,
    "AdminVouchers": AdminVouchers,
    "AdminShippingMethods": AdminShippingMethods,
    "Cart": Cart,
    "Certificates": Certificates,
    "Checkout": Checkout,
    "Contact": Contact,
    "Home": Home,
    "OrderTracking": OrderTracking,
    "ProductDetail": ProductDetail,
    "Products": Products,
    "QuizAI": QuizAI,
    "SellerChat": SellerChat,
    "Videos": Videos,
    "OrderHistory": OrderHistory,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};