import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import TenderEditForm from "../components/TenderEditForm";
import TenderForm from "./TenderForm";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";

import {
  FiEdit,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiCheckCircle,
  FiMail,
  FiSearch,
  FiPlus,
  FiFileText,
  FiActivity,
  FiTrendingUp,
  FiAlertCircle,
  FiX,
  FiInfo,
  FiExternalLink,
  FiDownload,
  FiArrowUp,
  FiArrowDown,
  FiClipboard,
  FiList
} from "react-icons/fi";

const COLUMNS = [
  "SNo",
  "TenderNumber",
  "Description",
  "Vertical",
  "Deadline",
  "Status",
  "BidPrice",
  "EMD"
];

const ITEMS_PER_PAGE = 20;

const DetailItem = ({ label, value, isBadge = false, fullWidth = false }) => (
  <div className={`flex flex-col gap-1.5 ${fullWidth ? 'col-span-full' : ''}`}>
    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
    {isBadge ? (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase w-fit ${value === 'Won' || value === 'L1' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
        ['Active', 'PENDING', 'OPEN', 'IN PROGRESS'].includes(String(value).toUpperCase()) ? 'bg-blue-100 text-blue-700 border border-blue-200' :
          ['REJECTED', 'DROPPED', 'RA LOST'].includes(String(value).toUpperCase()) ? 'bg-red-100 text-red-700 border border-red-200' :
            'bg-slate-100 text-slate-600 border border-slate-200'
        }`}>
        {value || "-"}
      </span>
    ) : (
      <span className="text-[13px] text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
        {value || <span className="text-slate-300 italic">Not provided</span>}
      </span>
    )}
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("tenders");
  const [showForm, setShowForm] = useState(false);
  const [tenders, setTenders] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTender, setEditingTender] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    recipientEmail: ""
  });
  const [emailStatus, setEmailStatus] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [approvingUsers, setApprovingUsers] = useState({}); // {userId: {selectedVerticals: []}}
  const [editingUser, setEditingUser] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserVerticals, setEditUserVerticals] = useState([]);

  // Ref to prevent concurrent fetchAlerts calls
  const isFetchingAlerts = useRef(false);

  // Advanced filtering and sorting state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState("Deadline");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const allowedVerticals = JSON.parse(localStorage.getItem("allowedVerticals") || "[]");
  const userEmail = localStorage.getItem("userEmail") || "";

  useEffect(() => {
    fetchTenders();
    fetchAlerts();

    // Clean up old acknowledged alerts on component mount (user-specific)
    const cleanupOldAlerts = () => {
      const userEmail = localStorage.getItem('userEmail') || "";
      const storageKey = `acknowledgedAlerts_${userEmail}`;
      const acknowledgedAlerts = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const cleanedAlerts = {};

      Object.entries(acknowledgedAlerts).forEach(([tenderId, data]) => {
        // If data is just a boolean (old format), keep it
        if (typeof data === 'boolean' && data === true) {
          cleanedAlerts[tenderId] = true;
        }
        // If data is an object with timestamp, check if it's within 30 days
        else if (data.acknowledgedAt) {
          const acknowledgedDate = new Date(data.acknowledgedAt);
          if (acknowledgedDate > thirtyDaysAgo) {
            cleanedAlerts[tenderId] = data;
          }
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(cleanedAlerts));
    };

    cleanupOldAlerts();

    // Set initial vertical filter for non-admin users with restricted access
    if (userRole !== "admin" && !allowedVerticals.includes("ALL") && allowedVerticals.length === 1) {
      setFilterVertical(allowedVerticals[0]);
    }
  }, []);

  // Function to format deadline for display
  const formatDeadlineForDisplay = (deadline) => {
    if (!deadline) return "";

    const date = new Date(deadline);

    // Check if it's exactly midnight in UTC
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const utcSeconds = date.getUTCSeconds();
    const utcMs = date.getUTCMilliseconds();

    const isDateOnly = utcHours === 0 && utcMinutes === 0 && utcSeconds === 0 && utcMs === 0;

    if (isDateOnly) {
      // For date-only values, use UTC timezone to avoid timezone conversion
      const options = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      };
      return date.toLocaleDateString('en-IN', options);
    } else {
      // For dates with time, show both date and time
      const dateOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      };

      const timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      };

      const dateStr = date.toLocaleDateString('en-IN', dateOptions);
      const timeStr = date.toLocaleTimeString('en-IN', timeOptions);

      return `${dateStr}, ${timeStr}`;
    }
  };

  const fetchTenders = async () => {
    try {
      const res = await axios.get("http://tenderbackend.edgeforce.in/api/tenders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove duplicate tenders by TenderNumber (keeping the newest one as per API sort)
      const uniqueTenders = [];
      const seenTenderNumbers = new Set();

      res.data.forEach(tender => {
        if (tender.TenderNumber && !seenTenderNumbers.has(tender.TenderNumber)) {
          seenTenderNumbers.add(tender.TenderNumber);
          uniqueTenders.push(tender);
        } else if (!tender.TenderNumber) {
          // Keep tenders without numbers if any
          uniqueTenders.push(tender);
        }
      });

      setTenders(uniqueTenders);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching tenders:", err);
    }
  };

  // Fetch alerts (tenders due in next 7 days)
  const fetchAlerts = async () => {
    console.log('=== fetchAlerts called ===', new Date().toISOString());

    // Prevent concurrent calls
    if (isFetchingAlerts.current) {
      console.log('fetchAlerts already running, skipping...');
      return;
    }

    isFetchingAlerts.current = true;

    try {
      const tendersRes = await axios.get("http://tenderbackend.edgeforce.in/api/tenders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const now = new Date();
      const userEmail = localStorage.getItem('userEmail') || "";
      const storageKey = `acknowledgedAlerts_${userEmail}`;
      const acknowledgedAlerts = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const updatedAcknowledgedAlerts = { ...acknowledgedAlerts };

      // 1. Remove expired acknowledgments (tenders older than 7 days)
      Object.keys(updatedAcknowledgedAlerts).forEach(tenderId => {
        const tender = tendersRes.data.find(t => t._id === tenderId);
        if (tender && tender.Deadline) {
          const deadlineDate = new Date(tender.Deadline);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tenderDeadlineDate = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

          // If tender deadline is more than 7 days in the past, remove from acknowledgments
          const diffTime = tenderDeadlineDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < -7) {
            delete updatedAcknowledgedAlerts[tenderId];
          }
        }
      });

      // Save cleaned up acknowledgments (user-specific)
      localStorage.setItem(storageKey, JSON.stringify(updatedAcknowledgedAlerts));

      // 2. Filter for upcoming and not acknowledged
      const upcomingTenders = tendersRes.data.filter(tender => {
        if (!tender.Deadline) return false;

        const deadline = new Date(tender.Deadline);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

        // Check if tender is upcoming (within 7 days from today)
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Tender should be within next 7 days (0 to 7 days)
        const isUpcoming = diffDays >= 0 && diffDays <= 7;

        // Check if not acknowledged
        const isAcknowledged = updatedAcknowledgedAlerts[tender._id];

        return isUpcoming && !isAcknowledged;
      });

      // 3. Deduplicate alerts by TenderNumber to fix the duplicates issue
      const uniqueAlertsByNumber = [];
      const seenTenderNumbers = new Set();

      upcomingTenders.forEach(alert => {
        if (alert.TenderNumber && !seenTenderNumbers.has(alert.TenderNumber)) {
          seenTenderNumbers.add(alert.TenderNumber);
          uniqueAlertsByNumber.push(alert);
        } else if (!alert.TenderNumber) {
          uniqueAlertsByNumber.push(alert);
        }
      });

      console.log('Total tenders from API:', tendersRes.data.length);
      console.log('Upcoming alerts after filtering & deduplication:', uniqueAlertsByNumber.length);

      setAlerts(uniqueAlertsByNumber);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      isFetchingAlerts.current = false;
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const res = await axios.get("http://tenderbackend.edgeforce.in/api/auth/pending-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(res.data);

      // Initialize approving users state
      const initialApprovingState = {};
      res.data.forEach(user => {
        initialApprovingState[user._id] = { selectedVerticals: [] };
      });
      setApprovingUsers(initialApprovingState);
    } catch (err) {
      console.error('Error fetching pending users:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const { selectedVerticals } = approvingUsers[userId];
      if (selectedVerticals.length === 0) {
        alert("Please select at least one vertical or 'ALL'");
        return;
      }

      await axios.put(`http://tenderbackend.edgeforce.in/api/auth/approve-user/${userId}`,
        { allowedVerticals: selectedVerticals },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmailStatus({ type: "success", message: "User approved successfully!" });
      fetchPendingUsers();
      setTimeout(() => setEmailStatus(null), 3000);
    } catch (err) {
      console.error('Error approving user:', err);
      setEmailStatus({ type: "error", message: `Failed to approve user: ${err.response?.data?.message || err.message}` });
    }
  };

  const toggleVertical = (userId, vertical) => {
    setApprovingUsers(prev => {
      const userState = { ...prev[userId] };
      const verticals = [...userState.selectedVerticals];

      if (vertical === 'ALL') {
        if (verticals.includes('ALL')) {
          userState.selectedVerticals = [];
        } else {
          userState.selectedVerticals = ['ALL'];
        }
      } else {
        // If 'ALL' was selected, remove it when selecting a specific vertical
        const filteredVerticals = verticals.filter(v => v !== 'ALL');
        if (filteredVerticals.includes(vertical)) {
          userState.selectedVerticals = filteredVerticals.filter(v => v !== vertical);
        } else {
          userState.selectedVerticals = [...filteredVerticals, vertical];
        }
      }

    });
  };

  const handleEditUserVerticals = (user) => {
    setEditingUser(user);
    setEditUserVerticals(user.allowedVerticals || []);
    setShowEditUserModal(true);
  };

  const toggleEditUserVertical = (vertical) => {
    setEditUserVerticals(prev => {
      if (vertical === 'ALL') {
        if (prev.includes('ALL')) {
          return [];
        } else {
          return ['ALL'];
        }
      } else {
        const filteredVerticals = prev.filter(v => v !== 'ALL');
        if (filteredVerticals.includes(vertical)) {
          return filteredVerticals.filter(v => v !== vertical);
        } else {
          return [...filteredVerticals, vertical];
        }
      }
    });
  };

  const handleSaveUserVerticals = async () => {
    if (!editingUser) return;

    try {
      if (editUserVerticals.length === 0) {
        setEmailStatus({ type: "error", message: "Please select at least one vertical or 'ALL'" });
        return;
      }

      await axios.put(
        `http://localhost:5000/api/auth/approve-user/${editingUser._id}`,
        { allowedVerticals: editUserVerticals },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmailStatus({ type: "success", message: "User verticals updated successfully!" });
      setShowEditUserModal(false);
      setEditingUser(null);
      setEditUserVerticals([]);
      fetchUsers(); // Refresh users list
      setTimeout(() => setEmailStatus(null), 3000);
    } catch (err) {
      console.error('Error updating user verticals:', err);
      setEmailStatus({
        type: "error",
        message: `Failed to update verticals: ${err.response?.data?.message || err.message}`
      });
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Add Header
    doc.setFontSize(18);
    doc.text("Tender Portal - Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 30);

    // Define columns - ADD BID PRICE AND EMD
    const columns = [
      { header: "#", dataKey: "index" },
      { header: "Tender Number", dataKey: "TenderNumber" },
      { header: "Description", dataKey: "Description" },
      { header: "Vertical", dataKey: "Vertical" },
      { header: "Deadline", dataKey: "Deadline" },
      { header: "Status", dataKey: "Status" },
      { header: "Bid Price", dataKey: "BidPrice" },
      { header: "EMD", dataKey: "EMD" }
    ];

    // Prepare data
    const rows = filteredTenders.map((tender, idx) => ({
      index: idx + 1,
      TenderNumber: tender.TenderNumber || "-",
      Description: tender.Description || "-",
      Vertical: tender.Vertical || "-",
      Deadline: formatDeadlineForDisplay(tender.Deadline) || "-",
      Status: tender.Status || "-",
      BidPrice: tender.BidPrice || "-",
      EMD: tender.EMD || "-"
    }));

    autoTable(doc, {
      startY: 35,
      columns: columns,
      body: rows,
      headStyles: { fillColor: [58, 91, 36] }, // Custom green color matching the UI
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 250, 245] }
    });

    doc.save(`Tender_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };


  // Send reminder email for specific tender
  const handleSendReminder = async (tenderId, tenderNumber) => {
    try {
      setEmailStatus({ type: "loading", message: "Sending reminder..." });

      const response = await axios.post(
        `http://tenderbackend.edgeforce.in/api/tenders/send-reminder/${tenderId}`,
        { recipientEmail: userEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmailStatus({
        type: "success",
        message: `✅ Reminder sent for tender ${tenderNumber}!`
      });

      setTimeout(() => setEmailStatus(null), 5000);
    } catch (err) {
      setEmailStatus({
        type: "error",
        message: `❌ Failed to send reminder: ${err.response?.data?.error || err.message}`
      });
    }
  };


  // Acknowledge alert
  const handleAcknowledgeAlert = (tenderId) => {
    const userEmail = localStorage.getItem('userEmail');
    console.log('Dismissing alert - User Email:', userEmail);
    console.log('Dismissing alert - Tender ID:', tenderId);

    const storageKey = `acknowledgedAlerts_${userEmail}`;
    console.log('Storage Key:', storageKey);

    const acknowledgedAlerts = JSON.parse(localStorage.getItem(storageKey) || '{}');
    console.log('Current acknowledged alerts:', acknowledgedAlerts);

    // Add with timestamp to track when it was acknowledged
    acknowledgedAlerts[tenderId] = {
      acknowledgedAt: new Date().toISOString(),
      acknowledged: true
    };

    localStorage.setItem(storageKey, JSON.stringify(acknowledgedAlerts));
    console.log('Updated acknowledged alerts:', acknowledgedAlerts);
    console.log('Saved to localStorage under key:', storageKey);

    // Remove from alerts state
    setAlerts(prev => prev.filter(alert => alert._id !== tenderId));
  };

  const startEdit = (tender) => {
    setEditingTender(tender);
    setShowEditForm(true);
  };


  // Close edit modal
  const closeEditForm = () => {
    setShowEditForm(false);
    setEditingTender(null);
  };

  const formatDeadlineForInput = (deadline) => {
    if (!deadline) return "";

    const date = new Date(deadline);

    // Adjust for timezone offset
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    // Return in YYYY-MM-DDTHH:mm format (datetime-local format)
    return localDate.toISOString().slice(0, 16);
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tender?")) return;

    try {
      await axios.delete(`http://tenderbackend.edgeforce.in/api/tenders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTenders();
      fetchAlerts(); // Refresh alerts after delete
    } catch (err) {
      console.error(err);
      alert("Failed to delete tender");
    }
  };

  // Filter and Sort tenders
// Filter and Sort tenders - FIXED VERSION
const filteredTenders = tenders.filter((tender) => {
  const matchesSearch = !searchTerm ||
    tender.TenderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tender.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tender.OrganisationName?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesVertical = !filterVertical || tender.Vertical === filterVertical;
  const matchesStatus = !filterStatus || tender.Status === filterStatus;

  // Date range filter
  let matchesDateRange = true;
  if (tender.Deadline) {
    const tenderDate = new Date(tender.Deadline);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (tenderDate < start) matchesDateRange = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (tenderDate > end) matchesDateRange = false;
    }
  } else if (startDate || endDate) {
    matchesDateRange = false;
  }

  return matchesSearch && matchesVertical && matchesStatus && matchesDateRange;
}).sort((a, b) => {
  // Sort by the selected field
  let valA = a[sortField];
  let valB = b[sortField];

  // Handle null/undefined values
  if (valA === null || valA === undefined) return sortOrder === 'asc' ? 1 : -1;
  if (valB === null || valB === undefined) return sortOrder === 'asc' ? -1 : 1;

  // For Deadline field, compare as dates
  if (sortField === "Deadline") {
    const dateA = new Date(valA).getTime();
    const dateB = new Date(valB).getTime();
    if (isNaN(dateA)) return sortOrder === 'asc' ? 1 : -1;
    if (isNaN(dateB)) return sortOrder === 'asc' ? -1 : 1;
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  }
  
  // For numeric fields like BidPrice and EMD, compare as numbers
  if (sortField === "BidPrice" || sortField === "EMD") {
    const numA = parseFloat(valA) || 0;
    const numB = parseFloat(valB) || 0;
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  }
  
  // For string fields, compare as strings
  const strA = String(valA).toLowerCase();
  const strB = String(valB).toLowerCase();
  
  if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
  if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
  return 0;
});

  // Calculate pagination
  const totalPages = Math.ceil(filteredTenders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTenders = filteredTenders.slice(startIndex, endIndex);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Handle page change
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;

      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  // Calculate days until deadline
  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get alert severity based on days until deadline
  const getAlertSeverity = (days) => {
    if (days <= 2) return "high";
    if (days <= 4) return "medium";
    return "low";
  };

  // Calculate statistics
  const stats = {
    total: tenders.length,
    active: tenders.filter(t => t.Status === "Active").length,
    won: tenders.filter(t => ["Won", "L1"].includes(t.Status)).length,
    urgent: alerts.length
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'alerts') fetchAlerts();
          if (tab === 'users') fetchUsers();
          if (tab === 'approvals') fetchPendingUsers();
        }}
        alertCount={alerts.length}
        userEmail={userEmail}
      />

      <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        {/* Status Message */}
        {emailStatus && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-4 ${emailStatus.type === "success"
            ? "bg-green-100 text-green-800 border border-green-300"
            : emailStatus.type === "error"
              ? "bg-red-100 text-red-800 border border-red-300"
              : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}>
            <div className="flex items-center gap-2">
              {emailStatus.type === "success" && "✅"}
              {emailStatus.type === "error" && "❌"}
              {emailStatus.type === "loading" && "⏳"}
              <span className="font-medium">{emailStatus.message}</span>
            </div>
          </div>
        )}

        {/* Tenders Tab */}
        {activeTab === "tenders" && (
          <>
            {/* Stats Grid */}
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
              {/* <StatCard
                label="Upcoming Deadlines"
                value={stats.urgent}
                icon={<FiAlertCircle />}
                color="red"
              /> */}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Table Controls */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tenders..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
                    />
                  </div>

                  {/* Vertical Filter */}
                  {(() => {
                    const allVerticals = ["AR/VR", "AI", "AI/UGV", "UGV", "OTHERS", "DRONE/AI", "UAV", "RCWS/AWS"];
                    const visibleVerticals = (userRole === "admin" || allowedVerticals.includes("ALL"))
                      ? allVerticals
                      : allVerticals.filter(v => allowedVerticals.includes(v));

                    if (userRole === "admin" || allowedVerticals.includes("ALL") || visibleVerticals.length > 1) {
                      return (
                        <select
                          value={filterVertical}
                          onChange={(e) => {
                            setFilterVertical(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full md:w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm font-medium text-slate-600"
                        >
                          <option value="">All Verticals</option>
                          {visibleVerticals.map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      );
                    }
                    return null;
                  })()}

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full md:w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm font-medium text-slate-600"
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Applied">Applied</option>
                    <option value="L1">L1</option>
                    <option value="Dropped">Dropped</option>
                    <option value="Not Eligible">Not Eligible</option>
                    <option value="Won">Won</option>
                    <option value="Rejected">Rejected</option>
                    <option value="RA Lost">RA Lost</option>
                    <option value="Disqualified">Disqualified</option>
                    <option value="TEC Qualified">TEC Qualified</option>
                    <option value="Closed">Closed</option>
                  </select>

                  {/* Date Range Filtering */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Deadline:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-xs outline-none text-slate-600 font-medium"
                      title="Start Date"
                    />
                    <span className="text-slate-300">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-transparent text-xs outline-none text-slate-600 font-medium"
                      title="End Date"
                    />
                  </div>

                  {/* Reset Filters - Moved beside Deadline */}
                  {(searchTerm || filterVertical || filterStatus || startDate || endDate) && (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterVertical("");
                        setFilterStatus("");
                        setStartDate("");
                        setEndDate("");
                        setSortField("Deadline");
                        setSortOrder("asc");
                        setCurrentPage(1);
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors whitespace-nowrap px-2"
                    >
                      Clear All
                    </button>
                  )}

                  {/* Download PDF Button */}
                  <button
                    onClick={handleDownloadPDF}
                    title="Download PDF Report"
                    className="flex items-center justify-center p-2 bg-white hover:bg-slate-50 text-emerald-700 border border-slate-200 rounded-xl transition-all active:scale-95"
                  >
                    <FiDownload size={18} />
                  </button>

                  {/* Add New Tender Button - Only for admin */}
                  {userRole === "admin" && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#3a5b24] to-emerald-700 hover:from-emerald-800 hover:to-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-emerald-900/10 active:scale-95 whitespace-nowrap"
                    >
                      <FiPlus size={16} /> <span className="text-xs font-bold uppercase tracking-tight">Add New Tender</span>
                    </button>
                  )}

                </div>


              </div>

              {showEditForm && editingTender && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="text-xl font-bold text-slate-900">Edit Tender</h3>
                      <button onClick={closeEditForm} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-all">
                        <FiX size={20} />
                      </button>
                    </div>
                    <div className="p-6">
                      <TenderEditForm
                        tender={editingTender}
                        onSave={() => {
                          fetchTenders();
                          fetchAlerts();
                          closeEditForm();
                        }}
                        onClose={closeEditForm}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tender Form Modal */}
              {showForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                    <div className="p-6">
                      <TenderForm
                        onSave={() => {
                          fetchTenders();
                          fetchAlerts();
                          setShowForm(false);
                        }}
                        onClose={() => setShowForm(false)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tender Details Modal */}
              {showDetails && selectedTender && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#3a5b24] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                          <FiList size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Tender Details</h3>
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                            navigator.clipboard.writeText(selectedTender.TenderNumber);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}>
                            <p className="text-sm text-slate-500 font-medium group-hover:text-emerald-600 transition-colors uppercase tracking-wider">{selectedTender.TenderNumber}</p>
                            <span className="text-slate-300 group-hover:text-emerald-400 transition-all flex items-center gap-1">
                              {copied ? (
                                <span className="text-[10px] text-emerald-500 font-bold animate-pulse">Copied!</span>
                              ) : (
                                <FiClipboard size={12} />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setShowDetails(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">
                        <FiX size={20} />
                      </button>
                    </div>

                    <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      <div className="space-y-8 max-w-2xl mx-auto">
                        {/* Basic Info */}
                        <section className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-[11px] font-black text-[#3a5b24] uppercase tracking-[0.15em] mb-6 pb-2 border-b border-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Basic Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Description" value={selectedTender.Description} fullWidth />
                            <DetailItem label="Vertical" value={selectedTender.Vertical} />
                            <DetailItem label="Status" value={selectedTender.Status} isBadge />
                            <DetailItem label="Organisation" value={selectedTender.OrganisationName} />
                            <DetailItem label="Deadline" value={formatDeadlineForDisplay(selectedTender.Deadline)} />
                          </div>
                        </section>

                        {/* Financial & Technical */}
                        <section className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-[11px] font-black text-[#3a5b24] uppercase tracking-[0.15em] mb-6 pb-2 border-b border-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Financial & Technical
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <DetailItem label="Bid Price" value={selectedTender.BidPrice} />
                            <DetailItem label="EMD" value={selectedTender.EMD} />
                            <DetailItem label="GEM Status" value={selectedTender.Gem} />
                            <DetailItem label="Pre-bid Date" value={selectedTender.Prebid} />
                          </div>
                        </section>

                        {/* Competition Info */}
                        <section className="bg-emerald-50/30 rounded-xl p-6 border border-emerald-100/50">
                          <h4 className="flex items-center gap-2 text-[11px] font-black text-[#3a5b24] uppercase tracking-[0.15em] mb-6 pb-2 border-b border-[#3a5b24]/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Competition & Biding
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <DetailItem label="L1 Bid Details" value={selectedTender.L1BidDetails} />
                            <DetailItem label="L2 Bid Details" value={selectedTender.L2BidDetails} />
                            <DetailItem label="L3 Bid Details" value={selectedTender.L3BidDetails} />
                          </div>
                        </section>

                        {/* Additional Info */}
                        <section className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                          <h4 className="flex items-center gap-2 text-[11px] font-black text-[#3a5b24] uppercase tracking-[0.15em] mb-6 pb-2 border-b border-emerald-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Additional Context
                          </h4>
                          <div className="space-y-6">
                            <DetailItem label="Major Specifications" value={selectedTender.MajorSpec} fullWidth />
                            <DetailItem label="Current Status Description" value={selectedTender.CurrentStatusDescription} fullWidth />
                            <DetailItem label="Remarks" value={selectedTender.Remarks} fullWidth />
                            {selectedTender.Link && (
                              <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tender Link</span>
                                <a
                                  href={selectedTender.Link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all w-fit shadow-lg shadow-emerald-200"
                                >
                                  Open Web Portal <FiExternalLink size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 px-8">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">End of Report</span>
                      <button
                        onClick={() => setShowDetails(false)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse border border-slate-200">
               <thead className="bg-emerald-50/50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
  <tr>
    {COLUMNS.map((col) => {
      // Only make Deadline sortable
      const isSortable = col === "Deadline";
      const isActive = sortField === col;

      // Define column width classes based on column type
      const getColumnWidth = () => {
        switch (col) {
          case "SNo":
            return "w-12";
          case "TenderNumber":
            return "w-44";
          case "Description":
            return "min-w-[280px] max-w-[380px]";
          case "Vertical":
            return "w-24";
          case "Deadline":
            return "min-w-[160px] max-w-[200px]";
          case "Status":
            return "min-w-[100px] max-w-[120px]";
          case "BidPrice":
            return "w-28";
          case "EMD":
            return "w-24";
          default:
            return "";
        }
      };

      return (
        <th
          key={col}
          className={`px-3 py-2 border-r border-slate-200 whitespace-nowrap text-slate-900 ${getColumnWidth()} ${isSortable ? 'cursor-pointer hover:bg-emerald-100/50 transition-colors group' : ''}`}
          onClick={() => {
            if (isSortable) {
              if (isActive) {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortField(col);
                setSortOrder('asc');
              }
            }
          }}
        >
          <div className="flex items-center gap-1">
            {col === "SNo" ? "SNo" :
              col === "BidPrice" ? "Bid Price" :
                col === "EMD" ? "EMD" :
                  col === "TenderNumber" ? "Tender Number" :
                    col === "CurrentStatusDescription" ? "Current Status Description" :
                      col === "OrganisationName" ? "Organisation Name" :
                        col === "L1BidDetails" ? "L1 Bid Details" :
                          col === "L2BidDetails" ? "L2 Bid Details" :
                            col === "L3BidDetails" ? "L3 Bid Details" :
                              col === "MajorSpec" ? "Major Spec" :
                                col === "BidPrice" ? "Bid Price" :
                                  col.replace(/([A-Z])/g, ' $1').trim()}
            {/* Only show arrows for Deadline column and only when it's sortable */}
            {col === "Deadline" && isSortable && (
              isActive ? (
                sortOrder === 'asc' ? <FiArrowUp className="text-emerald-700" size={12} /> : <FiArrowDown className="text-emerald-700" size={12} />
              ) : (
                <FiArrowUp className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" size={12} />
              )
            )}
          </div>
        </th>
      );
    })}
    <th className="px-3 py-2 text-center text-slate-900 w-28 border-r border-slate-200">Actions</th>
  </tr>
</thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentTenders.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} className="px-6 py-10 text-center text-slate-500 bg-slate-50/30">
                          <div className="flex flex-col items-center gap-2">
                            <FiFileText size={36} className="text-slate-300" />
                            <p className="text-lg">{searchTerm ? "No tenders match your search." : "No tenders found."}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentTenders.map((tender, index) => (
                        <tr key={tender._id} className="hover:bg-slate-50/80 transition-colors group">
                          {COLUMNS.map((col) => {
                            // Define cell width classes to match header
                            const getCellWidth = () => {
                              switch (col) {
                                case "SNo":
                                  return "w-12";
                                case "TenderNumber":
                                  return "w-44";
                                case "Description":
                                  return "min-w-[280px] max-w-[380px]";
                                case "Vertical":
                                  return "w-24";
                                case "Deadline":
                                  return "min-w-[160px] max-w-[200px]";
                                case "Status":
                                  return "w-24";
                                case "BidPrice":
                                  return "w-28";
                                case "EMD":
                                  return "w-24";
                                default:
                                  return "";
                              }
                            };

                            return (
                              <td key={col} className={`px-3 py-2 border-r border-slate-100 ${getCellWidth()} align-middle`}>
                                {col === "SNo" ? (
                                  <span className="font-medium text-slate-400 text-xs">{startIndex + index + 1}</span>
                                ) : col === "Deadline" ? (
                                  <span className="text-slate-600 font-medium text-xs block truncate" title={formatDeadlineForDisplay(tender[col])}>
                                    {formatDeadlineForDisplay(tender[col])}
                                  </span>
                                ) : col === "Status" ? (
                                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${tender[col] === 'Won' || tender[col] === 'L1' ? 'bg-green-100 text-green-700' :
                                    tender[col] === 'Active' ? 'bg-blue-100 text-blue-700' :
                                      tender[col] === 'Rejected' || tender[col] === 'Dropped' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                    {tender[col] || "-"}
                                  </span>
                                ) : col === "BidPrice" || col === "EMD" ? (
                                  <span className="text-slate-600 font-medium text-xs block truncate" title={tender[col]}>
                                    {tender[col] ? `₹${tender[col]}` : "-"}
                                  </span>
                                ) : col === "Description" ? (
                                  <span className="text-slate-600 text-xs block truncate" title={tender[col]}>
                                    {tender[col] || "-"}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-xs block truncate" title={tender[col]}>
                                    {tender[col] || "-"}
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          <td className="px-3 py-2 border-r border-slate-100 w-28 align-middle">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedTender(tender);
                                  setShowDetails(true);
                                }}
                                className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded-lg transition-all"
                                title="View Details"
                              >
                                <FiInfo size={14} />
                              </button>

                              {/* Only show edit button for admin users */}
                              {userRole === "admin" && (
                                <button
                                  onClick={() => startEdit(tender)}
                                  className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <FiEdit size={14} />
                                </button>
                              )}

                              {/* Only show delete button for admin users */}
                              {userRole === "admin" && (
                                <button
                                  onClick={() => handleDelete(tender._id)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination & Summary */}
              <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                <div className="text-sm text-slate-500 font-medium">
                  Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(endIndex, filteredTenders.length)}</span> of <span className="text-slate-900">{filteredTenders.length}</span> results
                </div>

                {filteredTenders.length > ITEMS_PER_PAGE && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={!hasPreviousPage}
                      className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${hasPreviousPage ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                    >
                      <FiChevronLeft /> Previous
                    </button>

                    <div className="flex gap-1">
                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum ? "bg-[#3a5b24] text-white shadow-lg shadow-emerald-900/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={!hasNextPage}
                      className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${hasNextPage ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-50 text-slate-300 cursor-not-allowed"
                        }`}
                    >
                      Next <FiChevronRight />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Alerts Tab - Commented Out
        {activeTab === "alerts" && (
          <div className="space-y-6">
            ... content omitted for brevity ...
          </div>
        )} */}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">All Users</h3>
                <p className="text-sm text-slate-500">View all registered users in the system</p>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiInfo className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No users found</h3>
                  <p className="text-slate-500">There are no registered users in the system.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-200">SNo</th>
                        <th className="px-6 py-4 border-r border-slate-200">Email</th>
                        <th className="px-6 py-4 border-r border-slate-200">Role</th>
                        <th className="px-6 py-4 border-r border-slate-200">Status</th>
                        <th className="px-6 py-4 border-r border-slate-200">Allowed Verticals</th>
                        <th className="px-6 py-4 border-r border-slate-200">Registered On</th>
                        <th className="px-6 py-4 border-r border-slate-200 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user, index) => (
                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 border-r border-slate-100">
                            <span className="font-semibold text-slate-900">{index + 1}</span>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">{user.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${user.isApproved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                              }`}>
                              {user.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {user.allowedVerticals && user.allowedVerticals.length > 0 ? (
                                user.allowedVerticals.map((vertical, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold border border-emerald-100"
                                  >
                                    {vertical}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-xs italic">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <span className="text-slate-600 text-xs">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100 text-center">
                            <button
                              onClick={() => handleEditUserVerticals(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Verticals"
                            >
                              <FiEdit className="text-lg" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approval Requests Tab */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No pending approvals</h3>
                <p className="text-slate-500">All user registration requests have been processed.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-900">Pending Approvals</h3>
                  <p className="text-sm text-slate-500">Review and approve new user registrations</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-200">User Email</th>
                        <th className="px-6 py-4 border-r border-slate-200">Assign Verticals</th>
                        <th className="px-6 py-4 border-r border-slate-200 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 align-top border-r border-slate-100">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">{user.email}</span>
                              <span className="text-[10px] text-slate-400 mt-1 uppercase">Role: {user.role}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-100">
                            <div className="flex flex-wrap gap-2 max-w-2xl">
                              {['ALL', 'AR/VR', 'AI', 'AI/UGV', 'UGV', 'OTHERS', 'DRONE/AI', 'UAV', 'RCWS/AWS'].map((vertical) => {
                                const isSelected = approvingUsers[user._id]?.selectedVerticals.includes(vertical);
                                return (
                                  <button
                                    key={vertical}
                                    onClick={() => toggleVertical(user._id, vertical)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isSelected
                                      ? "bg-[#3a5b24] text-white border-[#3a5b24] shadow-sm"
                                      : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50"
                                      }`}
                                  >
                                    {vertical}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center align-top border-r border-slate-100">
                            <button
                              onClick={() => handleApproveUser(user._id)}
                              className="bg-gradient-to-r from-[#3a5b24] to-emerald-700 hover:from-emerald-800 hover:to-emerald-800 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                            >
                              Approve User
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit User Verticals Modal - Rendered at root level */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Edit User Verticals</h3>
                <p className="text-sm text-slate-500 mt-1">{editingUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setEditUserVerticals([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Assign Allowed Verticals
                </label>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'AR/VR', 'AI', 'AI/UGV', 'UGV', 'OTHERS', 'DRONE/AI', 'UAV', 'RCWS/AWS'].map((vertical) => {
                    const isSelected = editUserVerticals.includes(vertical);
                    return (
                      <button
                        key={vertical}
                        onClick={() => toggleEditUserVertical(vertical)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${isSelected
                          ? "bg-[#3a5b24] text-white border-[#3a5b24] shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50"
                          }`}
                      >
                        {vertical}
                      </button>
                    );
                  })}
                </div>
                {editUserVerticals.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">Please select at least one vertical</p>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                    setEditUserVerticals([]);
                  }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserVerticals}
                  disabled={editUserVerticals.length === 0}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${editUserVerticals.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#3a5b24] to-emerald-700 hover:from-emerald-800 hover:to-emerald-800 text-white shadow-lg shadow-emerald-900/10 active:scale-95'
                    }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;