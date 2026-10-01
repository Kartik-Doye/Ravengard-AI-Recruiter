import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { GeoEvent } from "../components/admin/D3WorldThreatMap";

interface SecurityStreamContextType {
  threats: GeoEvent[];
  loginAttempts: GeoEvent[];
  allEvents: GeoEvent[];
  isConnected: boolean;
  unreadCount: number;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  clearUnread: () => void;
  simulateThreat: (type?: string, severity?: string) => Promise<void>;
  simulateLogin: (city?: string) => Promise<void>;
}

const SecurityStreamContext = createContext<SecurityStreamContextType | undefined>(undefined);

export function SecurityStreamProvider({ children }: { children: React.ReactNode }) {
  const [threats, setThreats] = useState<GeoEvent[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<GeoEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    const token = localStorage.getItem("ravengard_admin_token");
    if (!token) return;

    const sseUrl = `/api/admin/security/threat-stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.addEventListener("connected", () => {
      setIsConnected(true);
    });

    es.addEventListener("initial_state", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.threats)) {
          const formattedThreats: GeoEvent[] = data.threats.map((t: any) => ({
            id: t.id,
            type: "THREAT",
            threatType: t.threatType,
            severity: t.severity,
            ipAddress: t.ipAddress,
            countryCode: t.countryCode,
            city: t.city,
            latitude: t.latitude,
            longitude: t.longitude,
            rawPayloadSnippet: t.rawPayloadSnippet,
            timestamp: t.timestamp
          }));
          setThreats(formattedThreats);
        }

        if (Array.isArray(data.recentActivities)) {
          const formattedLogins: GeoEvent[] = data.recentActivities
            .filter((a: any) => a.type === "LOGIN_ATTEMPT")
            .map((a: any) => ({
              id: a.id,
              type: "LOGIN_ATTEMPT",
              email: a.email,
              ipAddress: a.ipAddress,
              countryCode: a.countryCode,
              city: a.city,
              latitude: a.latitude,
              longitude: a.longitude,
              status: a.status,
              timestamp: a.timestamp
            }));
          setLoginAttempts(formattedLogins);
        }
      } catch (err) {
        console.error("Failed to parse initial SSE state:", err);
      }
    });

    es.addEventListener("threat", (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data);
        const newThreat: GeoEvent = {
          id: raw.id || `threat_${Date.now()}`,
          type: "THREAT",
          threatType: raw.threatType,
          severity: raw.severity || "HIGH",
          ipAddress: raw.ipAddress,
          countryCode: raw.countryCode || "US",
          city: raw.city || "Unknown",
          latitude: raw.latitude || 37.7749,
          longitude: raw.longitude || -122.4194,
          rawPayloadSnippet: raw.rawPayloadSnippet,
          timestamp: raw.timestamp || new Date().toISOString()
        };

        setThreats((prev) => [newThreat, ...prev.slice(0, 49)]);
        setUnreadCount((c) => c + 1);
      } catch (err) {
        console.error("Error processing SSE threat:", err);
      }
    });

    es.addEventListener("login_attempt", (event: MessageEvent) => {
      try {
        const raw = JSON.parse(event.data);
        const newLogin: GeoEvent = {
          id: raw.id || `login_${Date.now()}`,
          type: "LOGIN_ATTEMPT",
          email: raw.email,
          ipAddress: raw.ipAddress,
          countryCode: raw.countryCode || "US",
          city: raw.city || "San Francisco",
          latitude: raw.latitude || 37.7749,
          longitude: raw.longitude || -122.4194,
          status: raw.status || "SUCCESS",
          timestamp: raw.timestamp || new Date().toISOString()
        };

        setLoginAttempts((prev) => [newLogin, ...prev.slice(0, 49)]);
        setUnreadCount((c) => c + 1);
      } catch (err) {
        console.error("Error processing SSE login attempt:", err);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
    };
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const simulateThreat = async (type = "PROMPT_INJECTION", severity = "HIGH") => {
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      await fetch("/api/admin/security/simulate-threat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ threatType: type, severity })
      });
    } catch (err) {
      console.error("Simulate threat error:", err);
    }
  };

  const simulateLogin = async (city = "Bangalore") => {
    const token = localStorage.getItem("ravengard_admin_token");
    try {
      await fetch("/api/admin/security/simulate-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ city, email: "enterprise.director@corp.com" })
      });
    } catch (err) {
      console.error("Simulate login error:", err);
    }
  };

  // Combine and sort chronologically
  const allEvents = [...threats, ...loginAttempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <SecurityStreamContext.Provider
      value={{
        threats,
        loginAttempts,
        allEvents,
        isConnected,
        unreadCount,
        isPanelOpen,
        setIsPanelOpen,
        clearUnread,
        simulateThreat,
        simulateLogin
      }}
    >
      {children}
    </SecurityStreamContext.Provider>
  );
}

export function useSecurityStream() {
  const ctx = useContext(SecurityStreamContext);
  if (!ctx) {
    throw new Error("useSecurityStream must be used within SecurityStreamProvider");
  }
  return ctx;
}
