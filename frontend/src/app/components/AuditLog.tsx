"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import { useAuth } from "@/app/hooks/useAuth";

type AuditEntry = {
    id: string;
    action: string;
    user_id: string;
    ip?: string;
    created_at: string;
};

type AuditLogProps = {
    docId: string;
    refreshTrigger?: number;
};

export default function AuditLog({ docId, refreshTrigger }: AuditLogProps) {
    const { token } = useAuth();
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadAuditLogs = async () => {
        try {
            setRefreshing(true);
            const res = await api.get(`/api/audit/${docId}`);
            setLogs(res.data);
        } catch (err) {
            console.error("Failed to load audit logs");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!token || !docId) return;
        loadAuditLogs();
    }, [docId, token, refreshTrigger]);

    if (loading) {
        return (
            <div className="mt-10 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Audit Trail</h2>
                <p className="text-gray-500">Loading audit trail...</p>
            </div>
        );
    }

    if (!logs.length) {
        return (
            <div className="mt-10 bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Audit Trail</h2>
                    <button
                        onClick={loadAuditLogs}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
                <p className="text-gray-500">No audit entries yet.</p>
            </div>
        );
    }

    return (
        <div className="mt-10 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Audit Trail</h2>
                <button
                    onClick={loadAuditLogs}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                IP Address
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Timestamp
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {log.action}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                    {log.user_id.slice(0, 8)}...
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {log.ip || "—"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}