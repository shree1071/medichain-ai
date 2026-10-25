import { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface FluidVoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  size?: number;
}

export default function FluidVoiceOrb({
  isListening,
  isSpeaking,
  onClick,
  size = 86
}: FluidVoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += isListening ? 0.05 : isSpeaking ? 0.038 : 0.02;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = (w / 2) - 1;

      ctx.clearRect(0, 0, w, h);

      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // 1. Base Gradient: Rich royal/electric blue at top transitioning to indigo
      const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
      baseGrad.addColorStop(0, '#2d4bf5');
      baseGrad.addColorStop(0.35, '#3b66ff');
      baseGrad.addColorStop(0.65, '#4f75fe');
      baseGrad.addColorStop(1, '#818cf8');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Secondary soft violet / blue deep wave
      ctx.beginPath();
      ctx.moveTo(0, cy);
      for (let x = 0; x <= w; x += 2) {
        const wave = Math.sin(x * 0.035 + time * 1.5) * (isListening ? 10 : 6) +
                     Math.cos(x * 0.02 - time * 0.8) * 4;
        ctx.lineTo(x, cy + 8 + wave);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const midGrad = ctx.createLinearGradient(0, cy, 0, h);
      midGrad.addColorStop(0, 'rgba(99, 102, 241, 0.55)');
      midGrad.addColorStop(1, 'rgba(147, 197, 253, 0.45)');
      ctx.fillStyle = midGrad;
      ctx.fill();

      // 3. Signature White Mist / Liquid Foam Wave (matching reference image)
      ctx.beginPath();
      ctx.moveTo(0, cy);
      for (let x = 0; x <= w; x += 2) {
        const wave = Math.sin(x * 0.04 + time * 1.8) * (isListening ? 12 : 7) +
                     Math.sin(x * 0.075 - time * 1.2) * (isListening ? 6 : 4) +
                     Math.cos(x * 0.02 + time * 0.5) * 5;
        ctx.lineTo(x, cy + 2 + wave);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const mistGrad = ctx.createLinearGradient(0, cy - 8, 0, h);
      mistGrad.addColorStop(0, 'rgba(255, 255, 255, 0.97)');
      mistGrad.addColorStop(0.35, 'rgba(240, 246, 255, 0.92)');
      mistGrad.addColorStop(0.75, 'rgba(219, 234, 254, 0.85)');
      mistGrad.addColorStop(1, 'rgba(191, 219, 254, 0.75)');
      ctx.fillStyle = mistGrad;
      ctx.fill();

      // 4. Subtle billow curl of white foam over the middle wave
      ctx.beginPath();
      ctx.moveTo(0, cy + 14);
      for (let x = 0; x <= w; x += 3) {
        const wave = Math.sin(x * 0.05 - time * 2.2) * 5 + Math.cos(x * 0.03 + time) * 3;
        ctx.lineTo(x, cy + 16 + wave);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();

      // 5. Soft top gloss / specular light sheen
      const glossGrad = ctx.createRadialGradient(cx - 10, cy - 18, 2, cx, cy, radius);
      glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      glossGrad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
      ctx.fillStyle = glossGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isListening, isSpeaking]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Active pulse aura rings */}
      {isListening && (
        <>
          <span className="absolute -inset-2 rounded-full border-2 border-blue-400/70 animate-ping opacity-40 pointer-events-none"></span>
          <span className="absolute -inset-4 rounded-full border border-sky-300/40 animate-pulse opacity-60 pointer-events-none"></span>
        </>
      )}

      {/* Button using exact user-specified class */}
      <button
        type="button"
        onClick={onClick}
        aria-label={isListening ? 'Stop recording symptoms' : 'Start voice symptom recording'}
        className="pointer-events-auto flex shrink-0 origin-center items-center justify-center rounded-full outline-none transition-transform duration-300 ease-out focus-visible:scale-[1.02] hover:scale-[1.02] active:scale-[0.99] cursor-pointer relative shadow-[0_8px_32px_rgba(37,99,235,0.28)] hover:shadow-[0_12px_36px_rgba(37,99,235,0.4)] group"
      >
        {/* Canvas Fluid Sphere */}
        <canvas
          ref={canvasRef}
          width={size * 2}
          height={size * 2}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded-full block select-none pointer-events-none"
        />

        {/* Center Mic Icon with frosted backing and soft shadow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-[2px] border border-white/30 flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
            {isListening ? (
              <MicOff size={17} className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] animate-pulse" />
            ) : (
              <Mic size={17} className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" />
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
