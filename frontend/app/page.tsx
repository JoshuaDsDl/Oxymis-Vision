"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, AlertTriangle, Home as HomeIcon, User, Activity } from "lucide-react";

interface AnalysisResult {
  health_emergency: string;
  presence: string;
  activity_description: string;
  domotics_context: string;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        const response = await fetch("http://localhost:8000/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageData }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Erreur lors de l'analyse");
        }

        const data = await response.json();
        setResult(data);
      }
    } catch (err: any) {
      console.error("Erreur d'analyse:", err);
      setError(err.message || "Une erreur est survenue lors de l'analyse.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
          Oxymis Vision
        </h1>
        <p className="text-zinc-400">Analyse d'environnement par IA pour la domotique et la sécurité</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Flux Vidéo
          </h2>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {!isStreaming && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                Initialisation de la caméra...
              </div>
            )}
          </div>
          <button
            onClick={captureAndAnalyze}
            disabled={!isStreaming || isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Capturer et Analyser
              </>
            )}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Résultats de l'IA
          </h2>
          
          {!result && !isLoading && (
            <div className="h-64 flex items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-lg">
              En attente de capture...
            </div>
          )}

          {isLoading && (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p>Analyse de l'image par le VLM...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <AlertTriangle className={`w-4 h-4 ${result.health_emergency === 'Oui' ? 'text-red-500' : 'text-zinc-500'}`} />
                  État de santé / Urgence
                </div>
                <p className="text-lg font-semibold">{result.health_emergency}</p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <User className="w-4 h-4 text-blue-400" />
                  Présence
                </div>
                <p className="text-lg font-semibold">{result.presence}</p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Description d'activité
                </div>
                <p className="text-zinc-200">{result.activity_description}</p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm font-medium uppercase tracking-wider">
                  <HomeIcon className="w-4 h-4 text-green-400" />
                  Contexte Domotique
                </div>
                <p className="text-zinc-200">{result.domotics_context}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}