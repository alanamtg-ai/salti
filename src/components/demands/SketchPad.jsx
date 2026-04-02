import { useRef, useState, useEffect, useCallback } from "react";
import { Trash2, Minus, Square, Type, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const COLORS = ["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];
const SIZES = [2, 5, 10, 18];

export default function SketchPad({ value, onChange }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#1e293b");
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState("pen");
  const [uploading, setUploading] = useState(false);
  const [textInput, setTextInput] = useState(null); // { x, y }
  const [textValue, setTextValue] = useState("");
  const lastPos = useRef(null);
  const rectStart = useRef(null);
  const snapshotRef = useRef(null);
  const initialized = useRef(false);
  const uploadTimer = useRef(null);
  const textInputRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initialized.current) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (textInput && textInputRef.current) textInputRef.current.focus();
  }, [textInput]);

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
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);

    if (tool === "text") {
      // Converter posição do canvas para posição na tela
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / canvas.width;
      const scaleY = rect.height / canvas.height;
      setTextInput({ x: pos.x * scaleX, y: pos.y * scaleY, canvasX: pos.x, canvasY: pos.y });
      setTextValue("");
      return;
    }

    setDrawing(true);
    lastPos.current = pos;

    if (tool === "rect") {
      rectStart.current = pos;
      const ctx = canvas.getContext("2d");
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    if (tool === "rect") {
      ctx.putImageData(snapshotRef.current, 0, 0);
      const x = Math.min(rectStart.current.x, pos.x);
      const y = Math.min(rectStart.current.y, pos.y);
      const w = Math.abs(pos.x - rectStart.current.x);
      const h = Math.abs(pos.y - rectStart.current.y);
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.stroke();
      return;
    }

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

  const uploadCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUploading(true);
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "sketch.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
      setUploading(false);
    }, "image/png");
  }, [onChange]);

  const endDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    rectStart.current = null;
    clearTimeout(uploadTimer.current);
    uploadTimer.current = setTimeout(() => uploadCanvas(), 800);
  };

  const commitText = () => {
    if (!textValue.trim() || !textInput) { setTextInput(null); return; }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = `${size * 3 + 10}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(textValue, textInput.canvasX, textInput.canvasY);
    setTextInput(null);
    setTextValue("");
    clearTimeout(uploadTimer.current);
    uploadTimer.current = setTimeout(() => uploadCanvas(), 800);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  const toolBtn = (t, icon, label) => (
    <button
      type="button"
      onClick={() => { setTool(t); setTextInput(null); }}
      title={label}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors",
        tool === t ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
      )}
    >
      {icon} {label}
    </button>
  );

  const cursorStyle = tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/40 rounded-lg border border-border">
        {/* Cores */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setColor(c); if (tool === "eraser") setTool("pen"); }}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                color === c && tool !== "eraser" ? "border-foreground scale-125" : "border-transparent"
              )}
              style={{ backgroundColor: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #cbd5e1" : undefined }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Tamanhos */}
        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={cn(
                "w-7 h-7 rounded flex items-center justify-center hover:bg-muted",
                size === s ? "bg-muted ring-1 ring-foreground/30" : ""
              )}
            >
              <div className="rounded-full bg-foreground" style={{ width: Math.min(s + 2, 16), height: Math.min(s + 2, 16) }} />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Ferramentas */}
        {toolBtn("pen",    <Pencil className="w-3 h-3" />, "Caneta")}
        {toolBtn("rect",   <Square className="w-3 h-3" />, "Retângulo")}
        {toolBtn("text",   <Type className="w-3 h-3" />,   "Texto")}
        {toolBtn("eraser", <Minus className="w-3 h-3" />,  "Borracha")}

        {uploading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
          </span>
        )}

        <button
          type="button"
          onClick={clear}
          className="ml-auto px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50 flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" /> Limpar
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={overlayRef}
        className="border border-border rounded-lg overflow-hidden relative"
        style={{ cursor: cursorStyle }}
      >
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

        {/* Input de texto flutuante */}
        {textInput && (
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitText(); if (e.key === "Escape") setTextInput(null); }}
            onBlur={commitText}
            className="absolute bg-transparent border border-dashed border-primary outline-none px-1 rounded"
            style={{
              left: textInput.x,
              top: textInput.y,
              color: color,
              fontSize: `${size * 3 + 10}px`,
              minWidth: 80,
              lineHeight: 1.2,
            }}
            placeholder="Digite..."
          />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">Rabisque como imagina a demanda — funciona como um bloco de notas visual.</p>
    </div>
  );
}