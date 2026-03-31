import { useRef, useState, useEffect, useCallback } from "react";
import { Trash2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = ["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];
const SIZES = [2, 5, 10, 18];

export default function SketchPad({ value, onChange }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#1e293b");
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState("pen");
  const lastPos = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized.current) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    initialized.current = true;
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#f8fafc" : color;
    ctx.lineWidth = tool === "eraser" ? size * 4 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  }, [drawing, color, size, tool]);

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/40 rounded-lg border border-border">
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setColor(c); setTool("pen"); }}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                color === c && tool === "pen" ? "border-foreground scale-125" : "border-transparent"
              )}
              style={{ backgroundColor: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #cbd5e1" : undefined }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setSize(s); setTool("pen"); }}
              className={cn(
                "w-7 h-7 rounded flex items-center justify-center hover:bg-muted",
                size === s && tool === "pen" ? "bg-muted ring-1 ring-foreground/30" : ""
              )}
            >
              <div className="rounded-full bg-foreground" style={{ width: Math.min(s + 2, 16), height: Math.min(s + 2, 16) }} />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        <button
          type="button"
          onClick={() => setTool(tool === "eraser" ? "pen" : "eraser")}
          className={cn(
            "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors",
            tool === "eraser" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
          )}
        >
          <Minus className="w-3 h-3" /> Borracha
        </button>

        <button
          type="button"
          onClick={clear}
          className="ml-auto px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Limpar
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden" style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={320}
          className="w-full touch-none"
          style={{ display: "block" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">Rabisque como imagina a demanda — funciona como um bloco de notas visual.</p>
    </div>
  );
}