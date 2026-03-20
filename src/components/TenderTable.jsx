import { FiEdit, FiTrash2, FiExternalLink } from "react-icons/fi";

const TenderTable = ({
    tenders,
    columns,
    startIndex,
    editingId,
    editData,
    handleEditChange,
    saveEdit,
    cancelEdit,
    startEdit,
    handleDelete,
    formatDeadlineForDisplay
}) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100"
                                >
                                    {col === "CurrentStatusDescription" ? "Status Details" : col}
                                </th>
                            ))}
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-center">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tenders.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="px-6 py-12 text-center text-slate-400 font-medium"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-4xl italic font-serif">"</span>
                                        <p>No tenders found matching your search</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            tenders.map((tender, index) => (
                                <tr key={tender._id} className="hover:bg-slate-50/50 transition-colors group">
                                    {columns.map((col) => (
                                        <td key={col} className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                            {col === "S.No" ? (
                                                <span className="font-semibold text-slate-900">{startIndex + index + 1}</span>
                                            ) : editingId === tender._id ? (
                                                <input
                                                    type={col === "Deadline" ? "datetime-local" : "text"}
                                                    value={editData[col] || ""}
                                                    onChange={(e) => handleEditChange(e, col)}
                                                    className="w-full px-3 py-1.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
                                                />
                                            ) : col === "Deadline" ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{formatDeadlineForDisplay(tender[col])}</span>
                                                </div>
                                            ) : col === "Status" ? (
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${tender[col] === 'Closed' ? 'bg-red-50 text-red-600' :
                                                    tender[col] === 'Active' ? 'bg-green-50 text-green-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {tender[col] || "Pending"}
                                                </span>
                                            ) : col === "Link" && tender[col] ? (
                                                <a
                                                    href={tender[col]}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-medium group/link"
                                                >
                                                    View <FiExternalLink className="text-[10px] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                                </a>
                                            ) : (
                                                <span className="truncate max-w-[200px] block" title={tender[col]}>
                                                    {tender[col] || "-"}
                                                </span>
                                            )}
                                        </td>
                                    ))}

                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {editingId === tender._id ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveEdit(tender._id)}
                                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm transition-all"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(tender)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit Tender"
                                                    >
                                                        <FiEdit className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tender._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Tender"
                                                    >
                                                        <FiTrash2 className="text-lg" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TenderTable;
