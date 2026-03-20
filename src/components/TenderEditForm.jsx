// TenderEditForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const TenderEditForm = ({ tender, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    TenderNumber: tender?.TenderNumber || "",
    Description: tender?.Description || "",
    OrganisationName: tender?.OrganisationName || "",
    Vertical: tender?.Vertical || "",
    Status: tender?.Status || "",
    DeadlineDate: tender?.Deadline ? new Date(tender.Deadline).toISOString().split('T')[0] : "",
    DeadlineTime: tender?.Deadline ? (() => {
      const d = new Date(tender.Deadline);
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      return (hours !== 0 || minutes !== 0) ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` : "";
    })() : "",
    PrebidDate: tender?.Prebid ? new Date(tender.Prebid).toISOString().split('T')[0] : "",
    PrebidTime: tender?.Prebid ? (() => {
      const d = new Date(tender.Prebid);
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      return (hours !== 0 || minutes !== 0) ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` : "";
    })() : "",
    BidPrice: tender?.BidPrice || "",
    EMD: tender?.EMD || "",
    Gem: tender?.Gem || "",
    L1BidDetails: tender?.L1BidDetails || "",
    L2BidDetails: tender?.L2BidDetails || "",
    L3BidDetails: tender?.L3BidDetails || "",
    MajorSpec: tender?.MajorSpec || "",
    CurrentStatusDescription: tender?.CurrentStatusDescription || "",
    Remarks: tender?.Remarks || "",
    Link: tender?.Link || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update form if tender prop changes
  useEffect(() => {
    if (tender) {
      setFormData({
        ...tender,
        DeadlineDate: tender.Deadline ? new Date(tender.Deadline).toISOString().split('T')[0] : "",
        DeadlineTime: tender.Deadline ? (() => {
          const d = new Date(tender.Deadline);
          const hours = d.getUTCHours();
          const minutes = d.getUTCMinutes();
          return (hours !== 0 || minutes !== 0) ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` : "";
        })() : "",
        PrebidDate: tender.Prebid ? new Date(tender.Prebid).toISOString().split('T')[0] : "",
        PrebidTime: tender.Prebid ? (() => {
          const d = new Date(tender.Prebid);
          const hours = d.getUTCHours();
          const minutes = d.getUTCMinutes();
          return (hours !== 0 || minutes !== 0) ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` : "";
        })() : "",
      });
    }
  }, [tender]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Reconstruction of dates
      let deadline = null;
      if (formData.DeadlineDate) {
        if (formData.DeadlineTime && formData.DeadlineTime.trim() !== "") {
          deadline = `${formData.DeadlineDate}T${formData.DeadlineTime}:00Z`;
        } else {
          deadline = `${formData.DeadlineDate}T00:00:00Z`;
        }
      }

      let prebid = null;
      if (formData.PrebidDate) {
        if (formData.PrebidTime && formData.PrebidTime.trim() !== "") {
          prebid = `${formData.PrebidDate}T${formData.PrebidTime}:00Z`;
        } else {
          prebid = `${formData.PrebidDate}T00:00:00Z`;
        }
      }

      const updateData = {
        ...formData,
        Deadline: deadline,
        Prebid: prebid
      };

      // Handle GEM status (convert empty string to null for Mongoose enum)
      if (updateData.Gem === "") {
        updateData.Gem = null;
      }

      // Remove the temporary fields
      delete updateData.DeadlineDate;
      delete updateData.DeadlineTime;
      delete updateData.PrebidDate;
      delete updateData.PrebidTime;

      // Remove system fields
      delete updateData._id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;
      delete updateData.createdBy;

      await axios.put(
        `http://tenderbackend.edgeforce.in/api/tenders/${tender._id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSave();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update tender");
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tender Number *</label>
          <input
            type="text"
            name="TenderNumber"
            value={formData.TenderNumber || ""}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organisation Name</label>
          <input
            type="text"
            name="OrganisationName"
            value={formData.OrganisationName || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            name="Description"
            value={formData.Description || ""}
            onChange={handleChange}
            rows="2"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vertical *</label>
          <select
            name="Vertical"
            value={formData.Vertical || ""}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
          >
            <option value="">Select Vertical</option>
            <option value="AR/VR">AR/VR</option>
            <option value="AI">AI</option>
            <option value="AI/UGV">AI/UGV</option>
            <option value="UGV">UGV</option>
            <option value="OTHERS">OTHERS</option>
            <option value="DRONE/AI">DRONE/AI</option>
            <option value="UAV">UAV</option>
            <option value="RCWS/AWS">RCWS/AWS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            name="Status"
            value={formData.Status || ""}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
          >
            <option value="">Select Status</option>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="DeadlineDate"
              value={formData.DeadlineDate || ""}
              onChange={handleChange}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
            <input
              type="time"
              name="DeadlineTime"
              value={formData.DeadlineTime || ""}
              onChange={handleChange}
              className="w-1/3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pre-bid Date</label>
          <div className="flex gap-2">
            <input
              type="date"
              name="PrebidDate"
              value={formData.PrebidDate || ""}
              onChange={handleChange}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
            <input
              type="time"
              name="PrebidTime"
              value={formData.PrebidTime || ""}
              onChange={handleChange}
              className="w-1/3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="border-t border-slate-100 pt-6">
        <h4 className="text-sm font-bold text-slate-900 mb-4">Financial Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bid Price</label>
            <input
              type="text"
              name="BidPrice"
              value={formData.BidPrice || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">EMD</label>
            <input
              type="text"
              name="EMD"
              value={formData.EMD || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">GEM Status</label>
            <select
              name="Gem"
              value={formData.Gem || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            >
              <option value="">Select GEM Status</option>
              <option value="Catalogue Uploaded">Catalogue Uploaded</option>
              <option value="Costing">Costing</option>
              <option value="Submitted">Submitted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Competition Details */}
      <div className="border-t border-slate-100 pt-6">
        <h4 className="text-sm font-bold text-slate-900 mb-4">Competition Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">L1 Bid Details</label>
            <input
              type="text"
              name="L1BidDetails"
              value={formData.L1BidDetails || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">L2 Bid Details</label>
            <input
              type="text"
              name="L2BidDetails"
              value={formData.L2BidDetails || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">L3 Bid Details</label>
            <input
              type="text"
              name="L3BidDetails"
              value={formData.L3BidDetails || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="border-t border-slate-100 pt-6">
        <h4 className="text-sm font-bold text-slate-900 mb-4">Additional Information</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Major Specifications</label>
            <textarea
              name="MajorSpec"
              value={formData.MajorSpec || ""}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Status Description</label>
            <textarea
              name="CurrentStatusDescription"
              value={formData.CurrentStatusDescription || ""}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
            <textarea
              name="Remarks"
              value={formData.Remarks || ""}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tender Link</label>
            <input
              type="url"
              name="Link"
              value={formData.Link || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3a5b24]/20 focus:border-[#3a5b24] transition-all outline-none text-sm"
              placeholder="https://example.com/tender"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-[#3a5b24] to-emerald-700 hover:from-emerald-800 hover:to-emerald-800 text-white py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Tender"}
        </button>
      </div>
    </form>
  );
};

export default TenderEditForm;