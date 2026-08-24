import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const InvoicePrint = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [format, setFormat] = useState('a4'); // a4, thermal-80, thermal-58

  useEffect(() => {
    const fetchData = async () => {
      const { data: o } = await supabase.from('orders').select('*').eq('id', id).single();
      const { data: oi } = await supabase.from('order_items').select('*').eq('order_id', id);
      const { data: s } = await supabase.from('invoice_settings').select('*').single();
      if (o) setOrder(o);
      if (oi) setItems(oi);
      if (s) setSettings(s);
    };
    fetchData();
  }, [id]);

  // Totals
  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Format Buttons */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button onClick={() => setFormat('a4')} style={{ margin: '5px', padding: '10px', background: format === 'a4' ? '#111' : '#fff', color: format === 'a4' ? '#fff' : '#111', border: '1px solid #111', borderRadius: '5px' }}>A4 Page</button>
        <button onClick={() => setFormat('thermal-80')} style={{ margin: '5px', padding: '10px', background: format === 'thermal-80' ? '#111' : '#fff', color: format === 'thermal-80' ? '#fff' : '#111', border: '1px solid #111', borderRadius: '5px' }}>Thermal 80mm</button>
        <button onClick={() => setFormat('thermal-58')} style={{ margin: '5px', padding: '10px', background: format === 'thermal-58' ? '#111' : '#fff', color: format === 'thermal-58' ? '#fff' : '#111', border: '1px solid #111', borderRadius: '5px' }}>Thermal 58mm</button>
        <button onClick={() => window.print()} style={{ margin: '5px', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '5px' }}>Print</button>
      </div>

      {/* Printable Area */}
      <div style={{ background: '#fff', margin: '0 auto', padding: '20px', maxWidth: format === 'a4' ? '210mm' : format === 'thermal-80' ? '80mm' : '58mm' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>FYNTAS</h2>
          <p style={{ margin: '5px 0', fontSize: '10px' }}>Address: Partawal Chowk, Maharajganj Road, Opp. Police Station, Maharajganj, UP, PIN: 273301</p>
          <p style={{ margin: '0', fontSize: '10px' }}>Tel: 9721501818</p>
          <h3 style={{ margin: '10px 0', fontSize: '14px', textDecoration: 'underline' }}>*** ORDER RECEIPT ***</h3>
        </div>

        {/* Order Details */}
        <div style={{ fontSize: '11px', marginTop: '10px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Order No:</span> <b>{order?.id?.slice(0, 8)}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Date:</span> <b>{new Date(order?.created_at).toLocaleString()}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Status:</span> <b>{order?.status?.toUpperCase()}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Customer:</span> <b>{order?.customer_name}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Email:</span> <b>{order?.customer_mobile}</b></p>
        </div>

        {/* ITEMS */}
        <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '10px' }}>
          <h4 style={{ margin: '5px 0', fontSize: '12px' }}>ITEMS</h4>
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.product_name || 'Item'}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ marginTop: '10px', fontSize: '11px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Subtotal:</span> ₹{subtotal}</p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Delivery:</span> ₹{order?.delivery_charge}</p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '5px' }}><span>TOTAL:</span> ₹{order?.total_amount}</p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span>Payment:</span> {order?.payment_method?.toUpperCase() || 'COD'}</p>
        </div>

        {/* Footer & Terms */}
        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
          <p style={{ margin: '2px 0' }}>{settings?.welcome_note || 'Thank you for your order!'}</p>
          <p style={{ margin: '2px 0' }}>{settings?.footer || 'FYNTAS'}</p>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Terms & Conditions</p>
          <p style={{ margin: '0', fontSize: '9px' }}>{settings?.terms || 'Goods once sold will not be taken back.'}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
