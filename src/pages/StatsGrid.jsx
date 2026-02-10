import StatCard from "../components/StatCard";
import { FiFileText, FiActivity, FiTrendingUp, FiAlertCircle } from "react-icons/fi";

const StatsGrid = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <StatCard
      label="Total Tenders"
      value={stats.total}
      icon={<FiFileText />}
      color="green"
    />
    <StatCard
      label="Active Tenders"
      value={stats.active}
      icon={<FiActivity />}
      color="emerald"
    />
    <StatCard
      label="Won / L1"
      value={stats.won}
      icon={<FiTrendingUp />}
      color="green"
    />
    <StatCard
      label="Upcoming Deadlines"
      value={stats.urgent}
      icon={<FiAlertCircle />}
      color="red"
    />
  </div>
);

export default StatsGrid;