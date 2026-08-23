import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from './Admin.tsx';
import CustomerLayout from './CustomerLayout.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer App */}
        <Route path="/*" element={<CustomerLayout />} />
        
        {/* Admin Panel (Private) */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
