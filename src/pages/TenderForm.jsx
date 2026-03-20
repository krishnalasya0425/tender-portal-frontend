import { useState } from "react";
import axios from "axios";
import { FiX, FiCheck } from "react-icons/fi";


const VERTICAL_OPTIONS = [
  "AR/VR",
  "AI",
  "AI/UGV",
  "UGV",
  "OTHERS",
  "DRONE/AI",
  "UAV",
  "RCWS/AWS",
];
const GEM_OPTIONS = [
  "Catalogue Uploaded",
  "Costing",
  "Submitted",
];

const STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Applied",
  "L1",
  "Dropped",
  "Not Eligible",
  "Won",
  "Rejected",
  "RA Lost",
  "Disqualified",
  "TEC Qualified",
  "Closed",
];

const TenderForm = ({ onSave, onClose, tender }) => {
  const [formData, setFormData] = useState({
    TenderNumber: tender?.TenderNumber || "",
    Description: tender?.Description || "",
    Vertical: tender?.Vertical || "",
    DeadlineDate: tender?.Deadline
      ? new Date(tender.Deadline).toISOString().split("T")[0]
      : "",
    DeadlineTime: tender?.Deadline
      ? (() => {
        const d = new Date(tender.Deadline);
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes();
        // Only include time if it's not midnight UTC (00:00)
        return (hours !== 0 || minutes !== 0)
          ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          : "";
      })()
      : "",
    Status: tender?.Status || "",
    BidPrice: tender?.BidPrice || "",
    CurrentStatusDescription: tender?.CurrentStatusDescription || "",
    Gem: tender?.Gem || "",
    OrganisationName: tender?.OrganisationName || "",
    EMD: tender?.EMD || "",
    Prebid: tender?.Prebid || "",
    L1BidDetails: tender?.L1BidDetails || "",
    L2BidDetails: tender?.L2BidDetails || "",
    L3BidDetails: tender?.L3BidDetails || "",
    MajorSpec: tender?.MajorSpec || "",
    Link: tender?.Link || "",
    Remarks: tender?.Remarks || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Construct Deadline correctly
    let deadline = null;
    if (formData.DeadlineDate) {
      if (formData.DeadlineTime && formData.DeadlineTime.trim() !== "") {
        // User provided time - create ISO string with time
        deadline = `${formData.DeadlineDate}T${formData.DeadlineTime}:00Z`;
      } else {
        // No time selected - create ISO string for date only (midnight UTC)
        deadline = `${formData.DeadlineDate}T00:00:00Z`;
      }
    }

    // Prepare payload without the temporary date/time fields
    const payload = {
      TenderNumber: formData.TenderNumber,
      Description: formData.Description,
      Vertical: formData.Vertical,
      Deadline: deadline,
      Status: formData.Status,
      BidPrice: formData.BidPrice,
      CurrentStatusDescription: formData.CurrentStatusDescription,
      Gem: formData.Gem === "" ? null : formData.Gem,
      OrganisationName: formData.OrganisationName,
      EMD: formData.EMD,
      Prebid: formData.Prebid,
      L1BidDetails: formData.L1BidDetails,
      L2BidDetails: formData.L2BidDetails,
      L3BidDetails: formData.L3BidDetails,
      MajorSpec: formData.MajorSpec,
      Link: formData.Link,
      Remarks: formData.Remarks,
    };

    try {
      await axios.post(
        "http://tenderbackend.edgeforce.in/api/tenders",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Tender saved!");

      // Reset form
      setFormData({
        TenderNumber: "",
        Description: "",
        Vertical: "",
        DeadlineDate: "",
        DeadlineTime: "",
        Status: "",
        BidPrice: "",
        CurrentStatusDescription: "",
        Gem: "",
        OrganisationName: "",
        EMD: "",
        Prebid: "",
        L1BidDetails: "",
        L2BidDetails: "",
        L3BidDetails: "",
        MajorSpec: "",
        Link: "",
        Remarks: "",
      });

      if (onSave) onSave();
      if (onClose) onClose();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Error saving tender");
    }
  };

  // Helper function to display the selected deadline in the form preview
  const getPreviewDeadline = () => {
    if (!formData.DeadlineDate) return "";

    let deadlineStr;
    if (formData.DeadlineTime && formData.DeadlineTime.trim() !== "") {
      // User entered time
      deadlineStr = `${formData.DeadlineDate}T${formData.DeadlineTime}:00Z`;
    } else {
      // Date only
      deadlineStr = `${formData.DeadlineDate}T00:00:00Z`;
    }

    return formatDeadlineForDisplay(deadlineStr);
  };

  // Function to format deadline for display (use this in your dashboard too!)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Add New Tender</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          ×
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 max-h-[70vh] overflow-y-auto pr-2"
      >
        {/* TenderNumber - Required */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            TenderNumber *
          </label>
          <input
            type="text"
            name="TenderNumber"
            value={formData.TenderNumber}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"

          />
        </div>

        {/* Description - Required */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Description *
          </label>
          <input
            type="text"
            name="Description"
            value={formData.Description}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
            required
          />
        </div>

        {/* Vertical - Required dropdown */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Vertical *
          </label>
          <select
            name="Vertical"
            value={formData.Vertical}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
            required
          >
            <option value="">Select Vertical</option>
            {(() => {
              const userRole = localStorage.getItem("userRole");
              const allowedVerticalsStr = localStorage.getItem("allowedVerticals");
              const allowedVerticals = allowedVerticalsStr ? JSON.parse(allowedVerticalsStr) : [];

              const visibleVerticals = (userRole === "admin" || allowedVerticals.includes("ALL"))
                ? VERTICAL_OPTIONS
                : VERTICAL_OPTIONS.filter(v => allowedVerticals.includes(v));

              return visibleVerticals.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ));
            })()}
          </select>
        </div>

        {/* Deadline with date and optional time */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Deadline *
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              name="DeadlineDate"
              value={formData.DeadlineDate}
              onChange={handleChange}
              className="border border-gray-300 p-2 w-full rounded"

            />
            <input
              type="time"
              name="DeadlineTime"
              value={formData.DeadlineTime}
              onChange={handleChange}
              className="border border-gray-300 p-2 w-1/2 rounded"
              placeholder="Time (optional)"
            />
          </div>
          {formData.DeadlineDate && (
            <p className="text-sm text-gray-500 mt-1">
              {formData.DeadlineTime && formData.DeadlineTime.trim() !== ""
                ? `Will save: ${getPreviewDeadline()}`
                : `Will save as date only: ${getPreviewDeadline()}`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Time is optional. Leave time empty to save only the date.
          </p>
        </div>

        {/* Status - Required dropdown */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Status *
          </label>
          <select
            name="Status"
            value={formData.Status}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
            required
          >
            <option value="">Select Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* BidPrice */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            BidPrice
          </label>
          <input
            type="text"
            name="BidPrice"
            value={formData.BidPrice}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* CurrentStatusDescription */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            CurrentStatusDescription
          </label>
          <input
            type="text"
            name="CurrentStatusDescription"
            value={formData.CurrentStatusDescription}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* Gem - Optional dropdown */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Gem (Optional)
          </label>
          <select
            name="Gem"
            value={formData.Gem}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          >
            <option value="">Select GEM Status</option>
            {GEM_OPTIONS.map((gem) => (
              <option key={gem} value={gem}>
                {gem}
              </option>
            ))}
          </select>
        </div>

        {/* OrganisationName */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            OrganisationName
          </label>
          <input
            type="text"
            name="OrganisationName"
            value={formData.OrganisationName}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* EMD */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            EMD
          </label>
          <input
            type="text"
            name="EMD"
            value={formData.EMD}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* Prebid */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Prebid
          </label>
          <input
            type="text"
            name="Prebid"
            value={formData.Prebid}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* L1BidDetails */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            L1BidDetails
          </label>
          <input
            type="text"
            name="L1BidDetails"
            value={formData.L1BidDetails}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* L2BidDetails */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            L2BidDetails
          </label>
          <input
            type="text"
            name="L2BidDetails"
            value={formData.L2BidDetails}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* L3BidDetails */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            L3BidDetails
          </label>
          <input
            type="text"
            name="L3BidDetails"
            value={formData.L3BidDetails}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* MajorSpec */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            MajorSpec
          </label>
          <input
            type="text"
            name="MajorSpec"
            value={formData.MajorSpec}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* Link */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Link
          </label>
          <input
            type="text"
            name="Link"
            value={formData.Link}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block font-medium mb-1 text-sm text-gray-700">
            Remarks
          </label>
          <input
            type="text"
            name="Remarks"
            value={formData.Remarks}
            onChange={handleChange}
            className="border border-gray-300 p-2 w-full rounded"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t border-slate-100">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#3a5b24] to-emerald-700 hover:from-emerald-800 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
          >
            <FiCheck /> Save Tender
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenderForm;