import { FiHome, FiList, FiBell, FiLogOut, FiMenu, FiX, FiCheckCircle, FiUsers } from "react-icons/fi";
import { useState } from "react";

const Sidebar = ({ activeTab, setActiveTab, alertCount = 0 }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Get logged-in user info


    const userEmail = localStorage.getItem("userEmail") || "";
    const username = userEmail ? userEmail.split("@")[0] : "User";

    const userRole = localStorage.getItem("userRole");

    const menuItems = [
        { id: "tenders", label: "Tenders", icon: <FiList /> },
        ...(userRole === 'admin' ? [
            { id: "users", label: "Users", icon: <FiUsers /> }
        ] : []),
        { id: "alerts", label: "Alerts", icon: <FiBell /> },
        ...(userRole === 'admin' ? [
            { id: "approvals", label: "Approval Requests", icon: <FiCheckCircle /> }
        ] : []),
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("allowedVerticals");
        window.location.href = "/login";
    };

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 text-black rounded-md shadow-lg"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar */}
            <div
                className={`${isOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0 transition-transform duration-300 fixed inset-y-0 left-0 z-40 w-64 bg-white text-slate-800 flex flex-col shadow-xl border-r border-slate-100`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
                        <span className="bg-gradient-to-br from-[#3a5b24] to-emerald-700 p-1.5 rounded-lg text-white shadow-lg">
                            <FiHome />
                        </span>
                        Tender Portal
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth < 1024) setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                ? "bg-gradient-to-r from-[#3a5b24] to-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                                : "text-slate-500 hover:bg-emerald-50 hover:text-[#3a5b24]"
                                }`}
                        >
                            <span
                                className={`text-xl transition-colors ${activeTab === item.id
                                    ? "text-white"
                                    : "group-hover:text-[#3a5b24]"
                                    }`}
                            >
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>

                            {item.id === "alerts" && alertCount > 0 && (
                                <span
                                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === item.id
                                        ? "bg-white text-emerald-700"
                                        : "bg-red-500 text-white"
                                        }`}
                                >
                                    {alertCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Profile + Logout */}
                {/* Profile + Logout */}
                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between gap-3">
                            {/* User Info */}
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-semibold text-slate-700 truncate">
                                    {username}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate">
                                    {userEmail}
                                </span>
                            </div>

                            {/* Logout Icon */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <FiLogOut />
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
