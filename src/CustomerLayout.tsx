import { useState } from 'react';
import CustomerHome from './pages/CustomerHome';
import CustomerCategories from './pages/CustomerCategories';
import CustomerProfile from './pages/CustomerProfile';
import CustomerFavorites from './pages/CustomerFavorites';

const CustomerLayout = () => {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'favorite', label: 'Favorite', icon: '❤️' },
    { id: 'cart', label: 'Cart', icon: '🛒' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '480px', margin: '0 auto', paddingBottom: '80px', background: '#f8f9fa', minHeight: '100vh', position: 'relative' }}>
      {/* Content Area */}
      <div style={{ padding: '10px' }}>
        {activeTab === 'home' && <CustomerHome />}
        {activeTab === 'categories' && <CustomerCategories />}
        {activeTab === 'favorite' && <CustomerFavorites />}
        {activeTab === 'profile' && <CustomerProfile />}
      </div>

      {/* Bottom Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: '480px', margin: '0 auto', background: '#ffffff', display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #e5e7eb', zIndex: 100 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: activeTab === tab.id ? '#2563eb' : '#6b7280' }}>
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerLayout;
