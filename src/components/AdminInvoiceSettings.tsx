import { supabase } from '../supabaseClient';

interface AdminInvoiceSettingsProps {
  settings: any;
  refreshData: () => void;
}

const AdminInvoiceSettings = ({ settings, refreshData }: AdminInvoiceSettingsProps) => {
  const save = async () => {
    await supabase.from('invoice_settings').upsert(settings);
    alert('Saved!');
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Invoice Settings</h3>
      <label>Welcome Note</label>
      <textarea value={settings.welcome_note || ''} onChange={(e) => (settings.welcome_note = e.target.value)} rows={2} />
      <label>Terms & Conditions</label>
      <textarea value={settings.terms || ''} onChange={(e) => (settings.terms = e.target.value)} rows={3} />
      <label>Footer Text</label>
      <input value={settings.footer || ''} onChange={(e) => (settings.footer = e.target.value)} />
      <button className="btn btn-black" onClick={save}>Save</button>
    </div>
  );
};

export default AdminInvoiceSettings;
