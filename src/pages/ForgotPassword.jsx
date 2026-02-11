import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/ef-img.png";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await axios.post("http://localhost:5000/api/auth/reset-password", {
                email,
                newPassword,
                confirmPassword
            });

            setMessage("✅ Password changed successfully! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (error) {
            setMessage(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <img
                        src={logoImg}
                        alt="Logo"
                        className="w-70 h-16 object-contain mx-auto"
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                        Reset Password
                    </h1>

                    {message && (
                        <div className="mb-4 text-center text-sm text-green-600">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3a5b24]/30 focus:border-[#3a5b24] outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3a5b24]/30 focus:border-[#3a5b24] outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3a5b24]/30 focus:border-[#3a5b24] outline-none transition-all"
                                required
                            />
                        </div>


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#3a5b24] to-emerald-700 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-800 hover:to-emerald-800 focus:ring-4 focus:ring-[#3a5b24]/30 transition-all duration-300 disabled:opacity-50"
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
