import { useState, useEffect } from 'react';
import CustomerHome from './pages/CustomerHome';
import CustomerCategories from './pages/CustomerCategories';
import CustomerProfile from './pages/CustomerProfile';
import CustomerFavorites from './pages/CustomerFavorites';
import CustomerCart from './pages/CustomerCart';
import CustomerCheckout from './pages/CustomerCheckout';
import ProductPage from './pages/ProductPage';
import CustomerOrders from './pages/CustomerOrders';
import CustomerAddresses from './pages/CustomerAddresses';
import { supabase } from './supabaseClient';
import OtpFlow from './components/OtpFlow'; // ✅ Import OtpFlow

const CustomerLayout = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [isProductPage, setIsProductPage] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [toast, setToast] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('fyntas_mobile') ? true : false);
  const [userMobile, setUserMobile] = useState(() => localStorage.getItem('fyntas_mobile') || '');
  const [userName, setUserName] = useState(() => localStorage.getItem('fyntas_name') || '');

  // Login Modal State
  const [showLogin, setShowLogin] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast('Item Added to Cart ✔️');
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsProductPage(true);
  };

  const handleBack = () => {
    setIsProductPage(false);
    setSelectedProduct(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('fyntas_mobile');
    localStorage.removeItem('fyntas_name');
    setIsLoggedIn(false);
    setUserMobile('');
    setUserName('');
    setShowLogin(false);
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'favorite', label: 'Favorite', icon: '❤️' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const drawerItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'orders', label: 'My Orders', icon: '📦' },
    { id: 'cart', label: 'My Cart', icon: '🛒' },
    { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
    { id: 'addresses', label: 'Manage Addresses', icon: '📍' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
    { id: 'privacy', label: 'Privacy Policy', icon: '🛡️' },
    { id: 'terms', label: 'Terms & Conditions', icon: '📜' },
    { id: 'refund', label: 'Refund Policy', icon: '💰' },
  ];

  if (isProductPage && selectedProduct) {
    return <ProductPage product={selectedProduct} addToCart={addToCart} onBack={handleBack} />;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '480px', margin: '0 auto', paddingBottom: '80px', background: '#f8f9fa', color: '#111111', minHeight: '100vh', position: 'relative' }}>
      
      {/* Toast Popup */}
      {toast && (
        <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', background: '#111111', color: '#fff', padding: '10px 20px', borderRadius: '20px', zIndex: 500, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Drawer Overlay */}
      {isDrawerOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setIsDrawerOpen(false)}></div>}

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: '#ffffff', zIndex: 300, transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease', boxShadow: '2px 0 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#ffffff', padding: '30px 20px', textAlign: 'center', color: '#111111', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#111111', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', color: '#ffffff' }}>👤</div>
          {isLoggedIn ? (
            <>
              <h3 style={{ margin: '0', fontWeight: 'bold', color: '#111111' }}>{userName || userMobile}</h3>
              <button onClick={handleLogout} style={{ background: '#111111', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0', fontWeight: 'bold', color: '#111111' }}>Guest User</h3>
              <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#6b7280' }}>Sign in to get started</p>
              <button onClick={() => setShowLogin(true)} style={{ background: '#111111', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '5px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
            </>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {drawerItems.map(item => (
            <div key={item.id} onClick={() => { setActiveTab(item.id); setIsDrawerOpen(false); setIsCheckout(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: '20px', color: '#111111' }}>{item.icon}</span>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#111111' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#ffffff', borderBottom: '1px solid #f3f4f6' }}>
        <div onClick={() => setIsDrawerOpen(true)} style={{ fontSize: '24px', cursor: 'pointer', color: '#111111', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ width: '24px', height: '2px', background: '#111111' }}></div>
          <div style={{ width: '24px', height: '2px', background: '#111111' }}></div>
          <div style={{ width: '24px', height: '2px', background: '#111111' }}></div>
        </div>
        <h2 style={{ margin: 0, color: '#111111', fontWeight: 'bold' }}>Fyntas Food</h2>
        <div style={{ fontSize: '20px', color: '#111111' }}>🔔</div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '0px' }}>
        {activeTab === 'home' && <CustomerHome addToCart={addToCart} onProductClick={handleProductClick} />}
        {activeTab === 'categories' && <CustomerCategories addToCart={addToCart} onProductClick={handleProductClick} />}
        {activeTab === 'favorite' && <CustomerFavorites />}
        {activeTab === 'profile' && <CustomerProfile onShowOrders={() => setActiveTab('orders')} />}
        {activeTab === 'orders' && <CustomerOrders savedMobile={userMobile} isLoggedIn={isLoggedIn} />}
        {activeTab === 'addresses' && <CustomerAddresses savedMobile={userMobile} isLoggedIn={isLoggedIn} />}
        {activeTab === 'cart' && !isCheckout && <CustomerCart cart={cart} setCart={setCart} onCheckout={() => setIsCheckout(true)} />}
        {activeTab === 'cart' && isCheckout && <CustomerCheckout cart={cart} setCart={setCart} savedMobile={userMobile} isLoggedIn={isLoggedIn} onSuccess={() => { setIsCheckout(false); setCart([]); setActiveTab('home'); }} onBack={() => setIsCheckout(false)} />}
        {activeTab === 'wishlist' && <div style={{ padding: '20px' }}><p>Wishlist</p></div>}
        {activeTab === 'about' && <div style={{ padding: '20px' }}><p>About Us</p></div>}
        {activeTab === 'privacy' && <div style={{ padding: '20px' }}><p>Privacy Policy</p></div>}
        {activeTab === 'terms' && <div style={{ padding: '20px' }}><p>Terms & Conditions</p></div>}
        {activeTab === 'refund' && <div style={{ padding: '20px' }}><p>Refund Policy</p></div>}
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '480px', margin: '0 auto', background: '#ffffff', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #f3f4f6', zIndex: 100 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: activeTab === tab.id ? '#111111' : '#9ca3af' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{tab.label}</span>
          </div>
        ))}
      </div>

      {/* Login Modal (No Prompt!) */}
      {showLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowLogin(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <OtpFlow 
              theme="black" 
              requiresName={true} 
              onLogin={(user) => {
                localStorage.setItem('fyntas_mobile', user.mobile);
                if (user.name) localStorage.setItem('fyntas_name', user.name);
                setUserMobile(user.mobile);
                setUserName(user.name || 'User');
                setIsLoggedIn(true);
                setShowLogin(false);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLayout;
