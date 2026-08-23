import { useState } from 'react';

const CustomerLayout = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '480px', margin: '0 auto', paddingBottom: '80px', background: '#ffffff', minHeight: '100vh', position: 'relative' }}>
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} onClick={() => setIsDrawerOpen(false)}></div>
      )}

      {/* Drawer (White theme, Blue Header) */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', 
        background: '#ffffff', zIndex: 300, 
        transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)', 
        transition: 'transform 0.3s ease', 
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)', 
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ background: '#1e40af', padding: '30px 20px', textAlign: 'center', color: '#ffffff' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#ffffff', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', color: '#1e40af' }}>👤</div>
          <h3 style={{ margin: '0', fontWeight: 'bold' }}>Guest User</h3>
          <p style={{ margin: '5px 0 0', fontSize: '14px', opacity: 0.9 }}>Sign in to get started</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {drawerItems.map(item => (
            <div key={item.id} onClick={() => { setActiveTab(item.id); setIsDrawerOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '20px', color: '#1e40af' }}>{item.icon}</span>
              <span style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>{item.label}</span>
            </div>
          ))}
          <div onClick={() => { setIsDrawerOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 20px', cursor: 'pointer', borderTop: '1px solid #f0f0f0', marginTop: '10px' }}>
            <span style={{ fontSize: '20px', color: '#1e40af' }}>🚪</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>Login</span>
          </div>
        </div>

        <div style={{ padding: '10px 0', textAlign: 'center', color: '#999', fontSize: '12px' }}>
          Version 1.0.0
        </div>
      </div>

      {/* Header with Hamburger (3 Lines) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div onClick={() => setIsDrawerOpen(true)} style={{ fontSize: '24px', cursor: 'pointer', color: '#111827', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ width: '24px', height: '2px', background: '#111827' }}></div>
          <div style={{ width: '24px', height: '2px', background: '#111827' }}></div>
          <div style={{ width: '24px', height: '2px', background: '#111827' }}></div>
        </div>
        <h2 style={{ margin: 0, color: '#111827', fontWeight: 'bold' }}>Fyntas Food</h2>
        <div style={{ fontSize: '20px', color: '#1e40af' }}>🔔</div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '15px' }}>
        {activeTab === 'home' && <p style={{ color: '#333' }}>Home Screen</p>}
        {activeTab === 'favorite' && <p style={{ color: '#333' }}>Wishlist</p>}
        {activeTab === 'cart' && <p style={{ color: '#333' }}>Cart (Empty)</p>}
        {activeTab === 'categories' && <p style={{ color: '#333' }}>Categories</p>}
        {activeTab === 'profile' && <p style={{ color: '#333' }}>My Profile</p>}
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '480px', margin: '0 auto', background: '#ffffff', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #e5e7eb', zIndex: 100 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: activeTab === tab.id ? '#1e40af' : '#6b7280' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerLayout;
