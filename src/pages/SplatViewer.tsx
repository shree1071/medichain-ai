import { useEffect, useRef, useState } from 'react';
import { Viewer } from '@mkkellogg/gaussian-splats-3d';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SplatViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let viewer: Viewer | null = null;

    const initViewer = async () => {
      try {
        viewer = new Viewer({
          'cameraUp': [0, -1, -0.6],
          'initialCameraPosition': [-1, -4, 6],
          'initialCameraLookAt': [0, 4, 0]
        });
        
        await viewer.addSplatScene('https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat', {
            'showLoadingUI': false,
            'position': [0, 1, 0],
            'rotation': [0, 0, 0, 1],
            'scale': [1.5, 1.5, 1.5]
        });

        if (containerRef.current) {
            containerRef.current.appendChild(viewer.renderer.domElement);
            viewer.start();
            setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load splat:", err);
        setError(true);
        setLoading(false);
      }
    };

    initViewer();

    return () => {
      if (viewer) {
          // Cleanup
          viewer.dispose();
      }
      if (containerRef.current) {
          containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        {/* Overlay UI */}
        <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center pointer-events-none">
            <Link to="/" className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors pointer-events-auto">
                <ArrowLeft size={20} />
            </Link>
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full pointer-events-auto flex items-center gap-2 text-white/80">
                <Maximize2 size={14} />
                <span className="text-xs font-medium tracking-wider uppercase">Interactive 3D</span>
            </div>
        </div>

        {/* Info overlay bottom */}
        <div className="absolute bottom-20 lg:bottom-10 left-6 right-6 z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white max-w-sm">
                <h2 className="font-bold text-lg mb-1">Placeholder Monastery View</h2>
                <p className="text-xs text-white/70">
                    This is a sample `.splat` file loaded entirely in-browser. Once you generate the Rumtek `.splat` from your Hugging Face space, we will swap the URL here!
                </p>
            </div>
        </div>

        {/* Loading State */}
        {loading && (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-black">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-white/70 text-sm font-medium animate-pulse">Loading 3D Gaussian Splat...</p>
                <p className="text-white/40 text-xs mt-2">Parsing millions of points...</p>
            </div>
        )}

        {/* Error State */}
        {error && (
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-black px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                    <span className="text-red-500 font-bold text-xl">!</span>
                </div>
                <p className="text-white font-medium mb-2">Failed to load 3D engine.</p>
                <p className="text-white/60 text-sm">Please ensure you are connected to the internet to download the sample splat, or check console for WebGL errors.</p>
            </div>
        )}

        {/* 3D Canvas Container */}
        <div 
            ref={containerRef} 
            className="absolute inset-0 z-0 cursor-move"
        />
    </div>
  );
}
