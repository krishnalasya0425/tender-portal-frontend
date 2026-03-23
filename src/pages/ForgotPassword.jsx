import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import logoImg from "../assets/ef-img.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://tenderbackend.edgeforce.in/api/auth/reset-password",
        {
          email,
          newPassword,
          confirmPassword,
        }
      );

      setMessage(res.data.message);
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImg} className="w-70 h-16 object-contain mx-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            Reset Password
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              ✅ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* New Password */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="New Password"
                className="w-full px-4 py-3 border rounded-lg pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showNew ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 border rounded-lg pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-500"
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#3a5b24] to-emerald-700 text-white py-3 rounded-lg font-medium"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;