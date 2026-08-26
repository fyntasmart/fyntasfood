import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminInvoiceSettingsProps {
  settings: any;
  refreshData: () => void;
  uploadImage: (file: File) => Promise<string>;
}

const AdminInvoiceSettings = ({ settings, refreshData, uploadImage }: AdminInvoiceSettingsProps) => {
  const [companyName, setCompanyName] = useState(settings.company_name || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');
  const [address, setAddress] = useState(settings.address || '');
  const [mobile, setMobile] = useState(settings.mobile || '');
  const [welcomeNote, setWelcomeNote] = useState(settings.welcome_note || '');
  const [terms, setTerms] = useState(settings.terms || '');
  const [footer, setFooter] = useState(settings.footer || '');

  const handleLogoUpload = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      setLogoUrl(url);
      setLogoFile(null);
    }
  };

  const save = async () => {
    // Logo upload if new file selected
    let finalLogo = logoUrl;
    if (logoFile) {
      finalLogo = await uploadImage(logoFile);
    }

    const updatedSettings = {
      ...settings,
      company_name: companyName,
      logo_url: finalLogo,
      address: address,
      mobile: mobile,
      welcome_note: welcomeNote,
      terms: terms,
      footer: footer
    };

    await supabase.from('invoice_settings').upsert(updatedSettings);
    alert('Invoice Settings Saved!');
    refreshData();
  };

  return (
    <div className="panel">
      <h3>Invoice Settings</h3>
      
      {/* Company Details */}
      <div style={{ marginBottom: '15px' }}>
        <label>Company Name</label>
        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="FYNTAS" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

        <label>Logo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {logoUrl && <img src={logoUrl} alt="logo" style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '5px' }} />}
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          {logoFile && <button className="btn btn-black" onClick={() => handleLogoUpload(logoFile)}>Upload Logo</button>}
        </div>

        <label>Address</label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Partawal Chowk, Maharajganj..." style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

        <label>Mobile Number</label>
        <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9721501818" style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      </div>

      {/* Invoice Content */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
        <label>Welcome Note</label>
        <textarea value={welcomeNote} onChange={(e) => setWelcomeNote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

        <label>Terms & Conditions</label>
        <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />

        <label>Footer Text</label>
        <input value={footer} onChange={(e) => setFooter(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
      </div>

      <button className="btn btn-black" onClick={save}>Save Settings</button>
    </div>
  );
};

export default AdminInvoiceSettings;
