import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  Globe,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldAlert,
  UserCheck,
  Radio,
  Layers,
  Sparkles
} from "lucide-react";

export interface GeoEvent {
  id: string;
  type: "THREAT" | "LOGIN_ATTEMPT";
  threatType?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  email?: string;
  ipAddress: string;
  countryCode: string;
  city: string;
  latitude: number | string;
  longitude: number | string;
  status?: string;
  timestamp: string;
  rawPayloadSnippet?: string;
}

interface D3WorldThreatMapProps {
  events: GeoEvent[];
  activeFilter?: "ALL" | "THREATS" | "LOGINS";
  onFilterChange?: (filter: "ALL" | "THREATS" | "LOGINS") => void;
  onSimulateThreat?: (type: string, severity: string) => void;
  onSimulateLogin?: (city: string) => void;
  className?: string;
}

// Low-resolution GeoJSON features representing world land masses
const WORLD_LAND_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    // North America
    {
      type: "Feature",
      properties: { name: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-168, 65], [-160, 71], [-140, 70], [-125, 72], [-100, 75], [-80, 76],
            [-60, 60], [-55, 50], [-65, 44], [-75, 35], [-80, 25], [-88, 20],
            [-80, 8], [-77, 8], [-83, 10], [-95, 16], [-105, 23], [-115, 30],
            [-124, 38], [-124, 48], [-130, 55], [-150, 60], [-168, 65]
          ]
        ]
      }
    },
    // South America
    {
      type: "Feature",
      properties: { name: "South America" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-77, 8], [-70, 12], [-60, 10], [-50, 0], [-35, -5], [-35, -12],
            [-40, -22], [-48, -28], [-53, -33], [-65, -42], [-68, -55], [-75, -50],
            [-73, -40], [-71, -30], [-76, -15], [-80, -2], [-77, 8]
          ]
        ]
      }
    },
    // Europe
    {
      type: "Feature",
      properties: { name: "Europe" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-10, 36], [-8, 43], [2, 51], [8, 54], [10, 58], [15, 65], [25, 71],
            [32, 70], [40, 66], [45, 60], [40, 50], [30, 46], [28, 41], [23, 38],
            [14, 37], [5, 43], [-5, 36], [-10, 36]
          ]
        ]
      }
    },
    // Africa
    {
      type: "Feature",
      properties: { name: "Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-17, 32], [-5, 36], [10, 37], [25, 32], [32, 31], [43, 12],
            [51, 10], [40, -5], [35, -15], [32, -28], [26, -34], [18, -34],
            [12, -22], [9, -5], [0, 5], [-15, 12], [-17, 22], [-17, 32]
          ]
        ]
      }
    },
    // Asia
    {
      type: "Feature",
      properties: { name: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [40, 66], [60, 70], [80, 73], [110, 75], [140, 72], [170, 66],
            [179, 66], [170, 60], [140, 50], [130, 42], [120, 32], [110, 20],
            [105, 10], [100, 2], [90, 15], [80, 10], [70, 22], [60, 25],
            [50, 30], [40, 40], [45, 60], [40, 66]
          ]
        ]
      }
    },
    // India Subcontinent
    {
      type: "Feature",
      properties: { name: "India" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [68, 24], [72, 30], [78, 34], [88, 27], [92, 22], [88, 20],
            [82, 16], [80, 10], [77, 8], [76, 12], [73, 16], [70, 20], [68, 24]
          ]
        ]
      }
    },
    // Australia
    {
      type: "Feature",
      properties: { name: "Australia" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [114, -22], [122, -15], [130, -12], [136, -12], [142, -10],
            [146, -18], [153, -28], [150, -35], [140, -38], [130, -32],
            [115, -34], [113, -26], [114, -22]
          ]
        ]
      }
    },
    // Great Britain & Ireland
    {
      type: "Feature",
      properties: { name: "British Isles" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [[-6, 50], [-3, 50], [1, 52], [0, 56], [-3, 58], [-5, 56], [-5, 52], [-6, 50]]
        ]
      }
    },
    // Japan
    {
      type: "Feature",
      properties: { name: "Japan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [[130, 32], [133, 34], [138, 36], [141, 40], [141, 44], [139, 38], [135, 35], [130, 32]]
        ]
      }
    }
  ]
};

// Target security gateway ingress coordinate (San Francisco, CA)
const CENTRAL_GATEWAY = { lon: -122.4194, lat: 37.7749, name: "Ravengard US-West Ingress" };

export function D3WorldThreatMap({
  events = [],
  activeFilter = "ALL",
  onFilterChange,
  onSimulateThreat,
  onSimulateLogin,
  className = ""
}: D3WorldThreatMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    event?: GeoEvent;
  }>({ visible: false, x: 0, y: 0 });

  const [filter, setFilter] = useState<"ALL" | "THREATS" | "LOGINS">(activeFilter);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Sync internal filter state
  useEffect(() => {
    setFilter(activeFilter);
  }, [activeFilter]);

  const handleFilterClick = (f: "ALL" | "THREATS" | "LOGINS") => {
    setFilter(f);
    if (onFilterChange) onFilterChange(f);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filter === "THREATS") return e.type === "THREAT";
      if (filter === "LOGINS") return e.type === "LOGIN_ATTEMPT";
      return true;
    });
  }, [events, filter]);

  // Render D3 Map
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 960;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clean redraw

    // Defs for gradients and glow filters
    const defs = svg.append("defs");

    // Glow filter for threat pulses
    const filterGlow = defs.append("filter")
      .attr("id", "d3-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filterGlow.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");

    const feMerge = filterGlow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Cyber grid pattern
    const pattern = defs.append("pattern")
      .attr("id", "d3-cyber-grid")
      .attr("width", 30)
      .attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 30 0 L 0 0 0 30")
      .attr("fill", "none")
      .attr("stroke", "#0F172A")
      .attr("stroke-width", "0.6");

    // Background rectangle
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#020617");

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#d3-cyber-grid)");

    // Root zoomable container
    const g = svg.append("g").attr("class", "map-root");

    // Projection & Path Generator
    const projection = d3.geoNaturalEarth1()
      .scale(155)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Graticules (Latitude & Longitude lines)
    const graticule = d3.geoGraticule()();
    g.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path as any)
      .attr("fill", "none")
      .attr("stroke", "#1E293B")
      .attr("stroke-width", "0.5")
      .attr("stroke-opacity", "0.5");

    // Render Land Mass Polygons
    g.selectAll(".country")
      .data(WORLD_LAND_GEOJSON.features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", path as any)
      .attr("fill", "#0F172A")
      .attr("stroke", "#334155")
      .attr("stroke-width", "0.8")
      .attr("stroke-linejoin", "round")
      .attr("cursor", "pointer")
      .on("mouseenter", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill", "#1E293B")
          .attr("stroke", "#64748B");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("fill", "#0F172A")
          .attr("stroke", "#334155");
      });

    // Central Ingress Security Node
    const centerPoint = projection([CENTRAL_GATEWAY.lon, CENTRAL_GATEWAY.lat]);
    if (centerPoint) {
      const gatewayG = g.append("g").attr("class", "central-gateway");

      gatewayG.append("circle")
        .attr("cx", centerPoint[0])
        .attr("cy", centerPoint[1])
        .attr("r", 5)
        .attr("fill", "#6366F1")
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 1.5)
        .style("filter", "url(#d3-glow)");

      gatewayG.append("circle")
        .attr("cx", centerPoint[0])
        .attr("cy", centerPoint[1])
        .attr("r", 12)
        .attr("fill", "none")
        .attr("stroke", "#6366F1")
        .attr("stroke-width", 0.8)
        .attr("opacity", 0.6);
    }

    // Render Threat Vectors (Arc curves from event origin to Central Ingress Node)
    if (centerPoint) {
      filteredEvents.forEach((evt) => {
        const lat = Number(evt.latitude);
        const lon = Number(evt.longitude);
        if (isNaN(lat) || isNaN(lon)) return;

        const pt = projection([lon, lat]);
        if (!pt) return;

        const isThreat = evt.type === "THREAT";
        const strokeColor = isThreat
          ? evt.severity === "CRITICAL" ? "#EF4444" : "#F59E0B"
          : "#10B981";

        // Create curved arc using intermediate control point
        const dx = centerPoint[0] - pt[0];
        const dy = centerPoint[1] - pt[1];
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;

        // Path connecting source and target
        const arcPath = `M ${pt[0]} ${pt[1]} A ${dr} ${dr} 0 0 1 ${centerPoint[0]} ${centerPoint[1]}`;

        g.append("path")
          .attr("d", arcPath)
          .attr("fill", "none")
          .attr("stroke", strokeColor)
          .attr("stroke-width", isThreat ? "1.2" : "0.9")
          .attr("stroke-dasharray", isThreat ? "4,4" : "2,2")
          .attr("stroke-opacity", isThreat ? "0.65" : "0.4")
          .style("pointer-events", "none");
      });
    }

    // Render Interactive Event Nodes
    const eventNodes = g.selectAll(".event-node")
      .data(filteredEvents, (d: any) => d.id)
      .enter()
      .append("g")
      .attr("class", "event-node")
      .attr("transform", (d) => {
        const pt = projection([Number(d.longitude), Number(d.latitude)]);
        return pt ? `translate(${pt[0]}, ${pt[1]})` : "translate(0, 0)";
      })
      .style("cursor", "pointer");

    // Pulsing outer sonar ring
    eventNodes.append("circle")
      .attr("r", 4)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        if (d.type === "LOGIN_ATTEMPT") return "#10B981";
        return d.severity === "CRITICAL" ? "#EF4444" : d.severity === "HIGH" ? "#F59E0B" : "#06B6D4";
      })
      .attr("stroke-width", 1.2)
      .attr("opacity", 0.8)
      .each(function (d) {
        // Continuous pulse animation with D3
        const circle = d3.select(this);
        function pulse() {
          circle
            .transition()
            .duration(1800)
            .ease(d3.easeCubicOut)
            .attr("r", d.severity === "CRITICAL" ? 18 : 12)
            .attr("opacity", 0)
            .transition()
            .duration(100)
            .attr("r", 4)
            .attr("opacity", 0.8)
            .on("end", pulse);
        }
        pulse();
      });

    // Solid center marker
    eventNodes.append("circle")
      .attr("r", (d) => (d.severity === "CRITICAL" ? 4.5 : 3.5))
      .attr("fill", (d) => {
        if (d.type === "LOGIN_ATTEMPT") return "#10B981";
        return d.severity === "CRITICAL" ? "#EF4444" : d.severity === "HIGH" ? "#F59E0B" : "#06B6D4";
      })
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 0.75)
      .style("filter", "url(#d3-glow)");

    // Event Tooltip Handlers
    eventNodes
      .on("mouseenter", function (event, d) {
        d3.select(this).select("circle:last-child").attr("r", 6);
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({
          visible: true,
          x: mx,
          y: my,
          event: d
        });
      })
      .on("mousemove", function (event) {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip((prev) => ({ ...prev, x: mx, y: my }));
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).select("circle:last-child").attr("r", d.severity === "CRITICAL" ? 4.5 : 3.5);
        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // D3 Zoom & Pan Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 6])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

  }, [filteredEvents]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleZoomReset = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div ref={containerRef} className={`relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden ${className}`}>
      {/* Top Map Chrome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-900/60 border-b border-slate-800 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            D3.js Telemetry Threat Vector Visualizer
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            · Natural Earth 1 Projection
          </span>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => handleFilterClick("ALL")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === "ALL" ? "bg-white text-slate-950 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Telemetry ({events.length})
          </button>
          <button
            onClick={() => handleFilterClick("THREATS")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === "THREATS" ? "bg-rose-500 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Threat Vectors ({events.filter((e) => e.type === "THREAT").length})
          </button>
          <button
            onClick={() => handleFilterClick("LOGINS")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filter === "LOGINS" ? "bg-emerald-500 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Login Vectors ({events.filter((e) => e.type === "LOGIN_ATTEMPT").length})
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[2/1] min-h-[360px] max-h-[520px]">
        <svg
          ref={svgRef}
          viewBox="0 0 960 480"
          className="w-full h-full block cursor-grab active:cursor-grabbing select-none"
        />

        {/* Floating Zoom & Pan Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors shadow"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors shadow"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors shadow"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ingress Gateway Legend Anchor */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
            <span className="text-slate-200">US-West Gateway (San Francisco)</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Authorized Login
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical Threat
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Anomaly Intercept
            </span>
          </div>
        </div>

        {/* Quick Simulation Shortcuts */}
        <div className="absolute bottom-3 right-3 hidden md:flex items-center gap-1.5 z-20 text-[11px] font-mono">
          <span className="text-slate-500 text-[10px]">Test Vectors:</span>
          {onSimulateLogin && (
            <button
              onClick={() => onSimulateLogin("Bangalore")}
              className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors"
            >
              + Login (BLR)
            </button>
          )}
          {onSimulateLogin && (
            <button
              onClick={() => onSimulateLogin("London")}
              className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors"
            >
              + Login (LDN)
            </button>
          )}
          {onSimulateThreat && (
            <button
              onClick={() => onSimulateThreat("PROMPT_INJECTION", "HIGH")}
              className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-rose-300 border border-slate-800 transition-colors"
            >
              + Prompt Injection
            </button>
          )}
          {onSimulateThreat && (
            <button
              onClick={() => onSimulateThreat("SQL_INJECTION", "CRITICAL")}
              className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-slate-800 transition-colors"
            >
              + SQL Injection
            </button>
          )}
        </div>

        {/* Hover Tooltip (Positioned dynamically) */}
        {tooltip.visible && tooltip.event && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-lg bg-slate-900/95 border border-slate-700 text-xs font-mono shadow-2xl text-slate-200 max-w-xs transition-opacity"
            style={{
              left: `${Math.min(tooltip.x + 12, 700)}px`,
              top: `${Math.max(tooltip.y - 10, 10)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className={`font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded ${
                tooltip.event.type === "LOGIN_ATTEMPT"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : tooltip.event.severity === "CRITICAL"
                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                  : "bg-amber-950 text-amber-300 border border-amber-800"
              }`}>
                {tooltip.event.type === "LOGIN_ATTEMPT" ? "SSO Login" : tooltip.event.threatType || "Threat"}
              </span>
              <span className="text-[10px] text-slate-400">{new Date(tooltip.event.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div>
                <span className="text-slate-400">Node: </span>
                <span className="text-slate-100 font-semibold">{tooltip.event.city}, {tooltip.event.countryCode}</span>
              </div>
              <div>
                <span className="text-slate-400">IP Egress: </span>
                <span className="text-cyan-400">{tooltip.event.ipAddress}</span>
              </div>
              {tooltip.event.email && (
                <div>
                  <span className="text-slate-400">User: </span>
                  <span className="text-slate-300 truncate block">{tooltip.event.email}</span>
                </div>
              )}
              {tooltip.event.rawPayloadSnippet && (
                <div className="pt-1 text-[10px] text-rose-300 italic border-t border-slate-800 mt-1">
                  "{tooltip.event.rawPayloadSnippet.slice(0, 70)}..."
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default D3WorldThreatMap;
