import React, { useRef, useState, useEffect } from "react";
import { PenTool, Square, Circle, ArrowRight, Type, Trash2, Undo, Download, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

interface WhiteboardCanvasProps {
  onSnapshot?: (base64Png: string) => void;
  readOnly?: boolean;
}

type Tool = "pen" | "rectangle" | "circle" | "arrow" | "text";

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ onSnapshot, readOnly = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>("#f59e0b"); // amber-500 default
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 500;

    // Draw dark grid background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, canvas.width, canvas.height);

    // Save initial blank state
    const initialSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialSnapshot]);
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(51, 65, 85, 0.25)";
    ctx.lineWidth = 1;
    const gridSize = 30;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartX(x);
    setStartY(y);
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (selectedTool === "pen") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "pen") {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.fillStyle = "transparent";
    ctx.lineWidth = strokeWidth;

    if (selectedTool === "rectangle") {
      ctx.strokeRect(
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(endX - startX),
        Math.abs(endY - startY)
      );
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (selectedTool === "arrow") {
      // Draw arrow line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(endY - startY, endX - startX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 12 * Math.cos(angle - Math.PI / 6), endY - 12 * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 12 * Math.cos(angle + Math.PI / 6), endY - 12 * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    } else if (selectedTool === "text") {
      const label = window.prompt("Enter architectural block label (e.g., Redis, API Gateway, Postgres):");
      if (label) {
        ctx.fillStyle = color;
        ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(label, endX, endY);
      }
    }

    // Save history snapshot
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), current]);

    // Dispatch base64 snapshot
    if (onSnapshot) {
      onSnapshot(canvas.toDataURL("image/png"));
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    const blank = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([blank]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Whiteboard Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-semibold mr-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARCHITECTURE CANVAS</span>
          </div>

          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 gap-1">
            <button
              onClick={() => setSelectedTool("pen")}
              className={`p-1.5 rounded ${selectedTool === "pen" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
              title="Freehand Pen"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool("rectangle")}
              className={`p-1.5 rounded ${selectedTool === "rectangle" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
              title="Box / Service"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool("circle")}
              className={`p-1.5 rounded ${selectedTool === "circle" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
              title="Circle / Node"
            >
              <Circle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool("arrow")}
              className={`p-1.5 rounded ${selectedTool === "arrow" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
              title="Data Flow Arrow"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedTool("text")}
              className={`p-1.5 rounded ${selectedTool === "text" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
              title="Text Label"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-1.5 ml-2">
            {["#f59e0b", "#38bdf8", "#10b981", "#f43f5e", "#ffffff"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-4 h-4 rounded-full transition-transform ${color === c ? "ring-2 ring-white scale-110" : "opacity-80"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1 || readOnly}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded disabled:opacity-40"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            disabled={readOnly}
            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded"
            title="Clear Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative w-full h-full min-h-[350px]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
};
