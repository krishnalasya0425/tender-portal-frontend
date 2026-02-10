const StatCard = ({ label, value, icon, trend, color }) => {
    const colorClasses = {
        emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-100",
        blue: "bg-blue-500/10 text-blue-600 border-blue-100",
        green: "bg-[#3a5b24]/10 text-[#3a5b24] border-emerald-100",
        red: "bg-red-500/10 text-red-600 border-red-100",
        orange: "bg-orange-500/10 text-orange-600 border-orange-100",
    }[color] || "bg-emerald-500/10 text-emerald-600 border-emerald-100";

    const iconBgClasses = {
        emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20",
        blue: "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20",
        green: "bg-gradient-to-br from-[#3a5b24] to-emerald-800 shadow-emerald-900/20",
        red: "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20",
        orange: "bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-500/20",
    }[color] || "bg-gradient-to-br from-[#3a5b24] to-emerald-800";

    return (
        <div className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group flex items-center gap-4`}>
            <div className={`p-2.5 rounded-xl text-white shadow-lg ${iconBgClasses} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                <span className="text-lg">{icon}</span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-slate-500 font-medium text-xs mb-0.5 truncate">{label}</p>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{value}</h3>
            </div>

            {trend && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {trend}
                </span>
            )}
        </div>
    );
};

export default StatCard;
