import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileImage, LoaderCircle, RotateCcw, Trash2, UploadCloud } from 'lucide-react';

type AnalysisState = 'idle' | 'ready' | 'analyzing' | 'complete' | 'error';

interface XrayAnalysisPanelProps {
  patientName?: string;
}

interface SavedXrayReview {
  id: string;
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
  analysis: string;
  createdAt: string;
}

const XRAY_DB_NAME = 'ayush-kiosk-xray-reviews';
const XRAY_STORE_NAME = 'reviews';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.readAsDataURL(file);
  });
}

function openXrayDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Browser storage is unavailable.'));
      return;
    }

    const request = indexedDB.open(XRAY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(XRAY_STORE_NAME)) {
        request.result.createObjectStore(XRAY_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open browser storage.'));
  });
}

async function listSavedReviews(): Promise<SavedXrayReview[]> {
  const db = await openXrayDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(XRAY_STORE_NAME, 'readonly').objectStore(XRAY_STORE_NAME).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result as SavedXrayReview[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Could not load saved X-ray reviews.'));
    };
  });
}

async function saveReview(review: SavedXrayReview): Promise<void> {
  const db = await openXrayDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(XRAY_STORE_NAME, 'readwrite').objectStore(XRAY_STORE_NAME).put(review);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Could not save this X-ray review.'));
    };
  });
}

async function removeSavedReview(id: string): Promise<void> {
  const db = await openXrayDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(XRAY_STORE_NAME, 'readwrite').objectStore(XRAY_STORE_NAME).delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Could not delete this X-ray review.'));
    };
  });
}

export default function XrayAnalysisPanel({ patientName = 'the patient' }: XrayAnalysisPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [selectedSavedReview, setSelectedSavedReview] = useState<SavedXrayReview | null>(null);
  const [savedReviews, setSavedReviews] = useState<SavedXrayReview[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [state, setState] = useState<AnalysisState>('idle');
  const [error, setError] = useState('');
  const [saveWarning, setSaveWarning] = useState('');

  useEffect(() => {
    listSavedReviews()
      .then(setSavedReviews)
      .catch(() => setSavedReviews([]));
  }, []);

  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = selectedSavedReview?.imageDataUrl || filePreviewUrl;
  const displayedFileName = selectedSavedReview?.fileName || file?.name || 'Your result will appear here';

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!nextFile.type.startsWith('image/')) {
      setError('Please choose an X-ray image in PNG, JPG, or WebP format.');
      setState('error');
      return;
    }
    if (nextFile.size > 20 * 1024 * 1024) {
      setError('This image is larger than 20 MB. Please choose a smaller X-ray image.');
      setState('error');
      return;
    }

    setSelectedSavedReview(null);
    setFile(nextFile);
    setAnalysis('');
    setError('');
    setSaveWarning('');
    setState('ready');
  };

  const analyzeImage = async () => {
    if (!file) return;
    setState('analyzing');
    setError('');
    setSaveWarning('');

    try {
      const dataUrl = await readAsDataUrl(file);
      const response = await fetch('/api/medgemma/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, patientName, modality: 'X-ray' })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'MedGemma could not analyze this image.');

      const report = payload.analysis || 'No analysis was returned. Please ask a clinician to review the original image.';
      const savedReview: SavedXrayReview = {
        id: `xray-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type,
        imageDataUrl: dataUrl,
        analysis: report,
        createdAt: new Date().toISOString()
      };

      try {
        await saveReview(savedReview);
        setSavedReviews((previous) => [savedReview, ...previous]);
        setSelectedSavedReview(savedReview);
        setFile(null);
      } catch (_) {
        setSaveWarning('Analysis completed, but this browser could not save the review.');
      }

      setAnalysis(report);
      setState('complete');
    } catch (err: any) {
      setError(err?.message || 'MedGemma analysis failed.');
      setState('error');
    }
  };

  const openSavedReview = (review: SavedXrayReview) => {
    setSelectedSavedReview(review);
    setFile(null);
    setAnalysis(review.analysis);
    setError('');
    setSaveWarning('');
    setState('complete');
  };

  const reset = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setSelectedSavedReview(null);
    setAnalysis('');
    setError('');
    setSaveWarning('');
    setState('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  const deleteSavedReview = async (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      await removeSavedReview(id);
      setSavedReviews((previous) => previous.filter((review) => review.id !== id));
      if (selectedSavedReview?.id === id) reset();
    } catch (err: any) {
      setError(err?.message || 'Could not delete this saved review.');
      setState('error');
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-[#fbfcfa] p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6f8d78]">
            <FileImage size={15} />
            Image review
          </div>
          <h3 className="text-lg font-bold text-slate-900">X-ray analysis</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Upload an X-ray for a detailed preliminary report. Every completed review is saved in this browser so you can reopen or delete it later.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dbe7dc] bg-[#eef6ef] px-3 py-1.5 text-[11px] font-semibold text-[#4e7057]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6f9b76]" />
          MedGemma 4B
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div
          className="group relative flex min-h-[250px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white transition hover:border-[#6f8d78] hover:bg-[#f8fbf8]"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            chooseFile(event.dataTransfer.files[0]);
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Selected X-ray" className="h-full max-h-[330px] w-full object-contain p-3" />
          ) : (
            <div className="px-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ee] text-[#65836d]">
                <UploadCloud size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-800">Drop an X-ray here</p>
              <p className="mt-1 text-xs text-slate-500">or browse PNG, JPG, or WebP · up to 20 MB</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
        </div>

        <div className="flex min-h-[250px] flex-col rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Review workspace</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{displayedFileName}</p>
            </div>
            {state === 'complete' && <CheckCircle2 size={18} className="text-emerald-600" />}
          </div>

          <div className="max-h-[480px] flex-1 overflow-y-auto py-4 pr-2 text-sm leading-6 text-slate-600">
            {state === 'idle' && <p>Select an X-ray to begin.</p>}
            {state === 'ready' && <p>The image is ready for analysis.</p>}
            {state === 'analyzing' && (
              <div className="flex items-center gap-2 text-[#55735d]">
                <LoaderCircle size={17} className="animate-spin" />
                MedGemma is preparing a detailed report…
              </div>
            )}
            {state === 'complete' && <p className="whitespace-pre-wrap">{analysis}</p>}
            {state === 'error' && (
              <div className="flex gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-rose-700">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {saveWarning && <p className="mb-2 text-xs text-amber-700">{saveWarning}</p>}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
            {(file || selectedSavedReview || error) && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100">
                <RotateCcw size={13} />
                Reset
              </button>
            )}
            <button
              type="button"
              disabled={!file || state === 'analyzing'}
              onClick={analyzeImage}
              className="rounded-full bg-[#5f8068] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#4e6e56] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {state === 'analyzing' ? 'Analyzing…' : 'Analyze X-ray'}
            </button>
          </div>
        </div>
      </div>

      {savedReviews.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Saved X-ray reviews</h4>
              <p className="mt-0.5 text-xs text-slate-500">Stored in this browser</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{savedReviews.length}</span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {savedReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => openSavedReview(review)}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition hover:border-[#9cb6a0] hover:bg-[#f8fbf8] ${selectedSavedReview?.id === review.id ? 'border-[#6f8d78] bg-[#f8fbf8]' : 'border-slate-200'}`}
              >
                <img src={review.imageDataUrl} alt="" className="h-12 w-12 rounded-lg bg-slate-100 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{review.fileName}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  title="Delete saved review"
                  onClick={(event) => deleteSavedReview(review.id, event)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-5 text-slate-400">
        Keep the original image and have a qualified clinician verify every finding. Saved reviews remain in this browser until you delete them.
      </p>
    </section>
  );
}
