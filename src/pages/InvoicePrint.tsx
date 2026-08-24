import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const InvoicePrint = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [format, setFormat] = useState('a4');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formatParam = params.get('format');
    if (formatParam) setFormat(formatParam);
  }, []);

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

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', background: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* Print Format Buttons */}
      <div style={{ marginBottom: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <button onClick={() => setFormat('a4')} style={{ margin: '5px', padding: '10px', background: format === 'a4' ? '#111' : '#fff', color: format === 'a4' ? '#fff' : '#111', border: '1px solid #111', borderRadius: '5px', cursor: 'pointer' }}>A4 Page</button>
        <button onClick={() => setFormat('thermal-80')} style={{ margin: '5px', padding: '10px', background: format === 'thermal-80' ? '#111' : '#fff', color: format === 'thermal-80' ? '#fff' : '#111', border: '1px solid #111', borderRadius: '5px', cursor: 'pointer' }}>Thermal 80mm</button>
        <button onClick={() => setFormat('thermal-58')} style={{ margin: '5px', padding: '10px', background: format === 'thermal-58' ? '#111' : '#fff', color: format === 'thermal-58' ? '#fff' : '#111', border: '1px solid #111', borderRadius: '5px', cursor: 'pointer' }}>Thermal 58mm</button>
        <button onClick={() => window.print()} style={{ margin: '5px', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Print</button>
      </div>

      {/* Printable Area */}
      <div style={{ background: '#fff', margin: '0 auto', padding: '20px', maxWidth: format === 'a4' ? '210mm' : format === 'thermal-80' ? '80mm' : '58mm' }}>
        
        {/* Header with Logo & Company Name */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '15px', marginBottom: '15px' }}>
          {settings.logo_url && <img src={settings.logo_url} alt="Logo" style={{ maxHeight: '70px', marginBottom: '10px' }} />}
          <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>{settings.company_name || 'FYNTAS'}</h1>
          <p style={{ margin: '5px 0', fontSize: '12px', lineHeight: '1.5' }}>{settings.address || ''}</p>
          <p style={{ margin: '0', fontSize: '12px' }}>Tel: 9721501818</p>
          <h3 style={{ margin: '10px 0', fontSize: '16px', textDecoration: 'underline' }}>*** ORDER RECEIPT ***</h3>
        </div>

        {/* Order Details - Bade Text Ke Saath */}
        <div style={{ fontSize: '14px', marginTop: '10px' }}> {/* ✅ Font size 14px kiya */}
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontWeight: 'bold' }}><span>Order No:</span> <b style={{ fontSize: '16px' }}>{order?.id?.slice(0, 8).toUpperCase()}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Invoice No:</span> <b style={{ fontSize: '16px' }}>INV-{order?.id?.slice(0, 6).toUpperCase()}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Date:</span> <b>{new Date(order?.created_at).toLocaleString()}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Status:</span> <b>{order?.status?.toUpperCase()}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Customer:</span> <b>{order?.customer_name}</b></p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0' }}><span>Mobile:</span> <b>{order?.customer_mobile}</b></p>
        </div>

        {/* ITEMS */}
        <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '10px' }}>
          <h4 style={{ margin: '5px 0', fontSize: '14px' }}>ITEMS</h4>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}> {/* ✅ Font size 13px */}
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
                  <td style={{ padding: '5px 0' }}>{idx + 1}</td>
                  <td style={{ padding: '5px 0' }}>{item.product_name || 'Product'}</td>
                  <td style={{ padding: '5px 0' }}>{item.quantity}</td>
                  <td style={{ padding: '5px 0' }}>₹{item.price}</td>
                  <td style={{ padding: '5px 0' }}>₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Subtotal:</span> ₹{subtotal}</p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Delivery:</span> ₹{order?.delivery_charge}</p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '8px', fontSize: '18px' }}><span>TOTAL:</span> ₹{order?.total_amount}</p>
          <p style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}><span>Payment:</span> {order?.payment_method?.toUpperCase() || 'COD'}</p>
        </div>

        {/* Footer & Terms */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', borderTop: '1px dashed #000', paddingTop: '15px' }}>
          <p style={{ margin: '3px 0', fontWeight: 'bold' }}>{settings?.welcome_note || 'Thank you for your order!'}</p>
          <p style={{ margin: '3px 0', fontWeight: 'bold' }}>{settings?.footer || 'FYNTAS'}</p>
          <p style={{ margin: '10px 0 3px', fontWeight: 'bold' }}>Terms & Conditions</p>
          <p style={{ margin: '0', fontSize: '11px' }}>{settings?.terms || 'Goods once sold will not be taken back.'}</p>
        </div>
      </div>

      {/* Print CSS to make text bigger */}
      <style>{`
        @media print {
          body { font-size: 16px; } 
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrint;
