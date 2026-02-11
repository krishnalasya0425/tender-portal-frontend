import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TenderForm from "./pages/TenderForm";
import Dashboard from "./pages/Dashboard"
import ForgotPassword from "./pages/ForgotPassword";

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black-100">
        <Routes>
          {/* Landing page : Register */}
          <Route path="/" element={<Register />} />

          {/* Login page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Tender form */}
          <Route
            path="/tender"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />


          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

