import React, { useState, useEffect } from "react";
import { Bell, Check, Trash2, AlertTriangle, Award, Clock, AlertCircle, X, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export interface HrNotificationItem {
  id: string;
  type: "HIGH_SCORE" | "INTEGRITY_FLAG" | "SLA_EXPIRED" | "PARTIAL_SUBMISSION" | string;
  title: string;
  message: string;
  applicationId?: string | null;
  candidateId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const HrNotificationDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HrNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("hr_token") || localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/hr/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("hr_token") || localStorage.getItem("token");
      await fetch(`/api/hr/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("hr_token") || localStorage.getItem("token");
      await fetch(`/api/hr/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "HIGH_SCORE":
        return <Award className="w-4 h-4 text-emerald-400" />;
      case "INTEGRITY_FLAG":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "PARTIAL_SUBMISSION":
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case "SLA_EXPIRED":
        return <Clock className="w-4 h-4 text-slate-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/50 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Tray */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-100">HR Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto divide-y divide-slate-800/60 p-1 flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-500/60 mb-1" />
                  <span>No new alerts. Candidate funnels operating normally.</span>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                      item.isRead
                        ? "bg-transparent opacity-70 hover:opacity-100"
                        : "bg-slate-800/40 border border-slate-700/40 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-semibold text-slate-200 truncate">{item.title}</h4>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        {item.applicationId && (
                          <Link
                            to={`/hr/candidate/${item.applicationId}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium mt-2 group"
                          >
                            <span>Open Candidate Dossier</span>
                            <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
