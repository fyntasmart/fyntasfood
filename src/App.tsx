import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Checkout from './Checkout.tsx';
import Admin from './Admin.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer ka page (Home) */}
        <Route path="/" element={<Checkout />} />
        
        {/* Admin ka page */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
