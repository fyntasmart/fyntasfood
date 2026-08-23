const CustomerCart = ({ cart, setCart, onCheckout }: any) => {
  const changeQty = (id: string, type: 'inc' | 'dec') => {
    setCart((prev: any[]) => prev.map(item => {
      if (item.id === id) {
        const newQty = type === 'inc' ? item.qty + 1 : Math.max(1, item.qty - 1);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart((prev: any[]) => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px', color: '#111827' }}>My Cart</h2>
      {cart.length === 0 ? (
        <p>Cart khali hai!</p>
      ) : (
        <>
          {cart.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', borderBottom: '1px solid #f0f0f0', marginBottom: '10px' }}>
              <img src={item.image_url || 'https://via.placeholder.com/60'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{item.name}</p>
                <p style={{ margin: '5px 0', color: '#666' }}>₹{item.price} / {item.unit}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => changeQty(item.id, 'dec')} style={{ background: '#f3f4f6', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', color: '#111827' }}>-</button>
                  <span style={{ fontWeight: 'bold' }}>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 'inc')} style={{ background: '#f3f4f6', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', color: '#111827' }}>+</button>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1e40af' }}>₹{item.price * item.qty}</p>
                <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '15px' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}><span>Total</span><span>₹{total}</span></p>
            <button onClick={onCheckout} style={{ width: '100%', padding: '15px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerCart;
