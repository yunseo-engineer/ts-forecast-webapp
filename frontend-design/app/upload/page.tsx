"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

/**
 * /upload — design from `forecastlab/upload.html`, wired to the real
 * FastAPI backend via `useAppStore.fetchForecast()`.
 *
 *   - File and horizon live in the Zustand store so /dashboard can read
 *     metadata back out (filename, etc.) after the response arrives.
 *   - The 6-step phase animation cycles purely on a timer while the
 *     fetch is in flight; on completion we navigate to /dashboard.
 *   - Date/target column + frequency + model-group fields are kept as
 *     UI controls only — current backend doesn't accept them, so they
 *     act as future hooks.
 */

const PHASES = [
  "DETECTING SCHEMA...",
  "CLEANING DATA...",
  "TESTING STATIONARITY...",
  "TRAINING MODELS...",
  "GENERATING FORECAST...",
  "BUILDING DASHBOARD...",
];



export default function UploadPage() {
  const router = useRouter();
  const blobRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const file = useAppStore((s) => s.file);
  const setFile = useAppStore((s) => s.setFile);
  const horizon = useAppStore((s) => s.horizon);
  const setHorizon = useAppStore((s) => s.setHorizon);
  const fetchForecast = useAppStore((s) => s.fetchForecast);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);

  const [drag, setDrag] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);


  // Body class hookup
  useEffect(() => {
    document.body.classList.add("loaded", "page-upload");
    return () => {
      document.body.classList.remove("page-upload");
    };
  }, []);

  // Cursor blob + nav scroll
  useEffect(() => {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let bx = mx, by = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const loop = () => {
      bx += (mx - bx) * 0.08;
      by += (my - by) * 0.08;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    const onScroll = () => {
      if (navRef.current) navRef.current.classList.toggle("scrolled", window.scrollY > 30);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Phase cycler — only runs while loading.
  useEffect(() => {
    if (!loading) return;
    setPhaseIdx(0);
    const cycler = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
    }, 600);
    return () => clearInterval(cycler);
  }, [loading]);

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const startAnalyze = async () => {
    if (!file || loading) return;
    await fetchForecast();
    // Read fresh state — store may have flipped data/error after the await.
    const { data: nextData, error: nextError } = useAppStore.getState();
    if (nextData && !nextError) {
      // Brief pause so the user sees the final phase tick.
      setTimeout(() => router.push("/dashboard"), 400);
    }
  };

  // File preview pulled from the actual File object — only size is
  // accurate without parsing the CSV; row/col counts are revealed by
  // the backend's preprocessing, so we leave them blank until then.
  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : null;

  const progress = ((phaseIdx + 1) / PHASES.length) * 100;
  const overlayActive = loading;

  return (
    <>
      <div className="cursor-blob" ref={blobRef} />

      <nav className="nav" ref={navRef}>
        <a href="/" className="brand">
          <span className="brand-mark" />
          ForecastLab
        </a>
        <div className="nav-links">
          <a href="/">홈</a>
          <a href="/dashboard">데모</a>
        </div>
      </nav>

      <main className="upload-main">
        <div className="breadcrumb">
          <span className="step">01 LANDING</span>
          <span className="sep">→</span>
          <span className="step active">02 UPLOAD</span>
          <span className="sep">→</span>
          <span className="step">03 DASHBOARD</span>
        </div>

        <h1>
          데이터를 <span className="grad-text">올리고</span>, 설정만 하세요.
        </h1>
        <p className="lead">
          CSV 파일을 끌어다 놓거나 클릭해서 업로드하세요. 컬럼과 주기는 자동 감지됩니다 — 필요할 때만 손대면 됩니다.
        </p>

        <div
          className={`dropzone${drag ? " drag" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDrag(false);
          }}
          onDrop={onDropFile}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dz-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5-5 5 5" />
              <path d="M12 5v12" />
            </svg>
          </div>
          <h2>CSV를 여기로 끌어다 놓으세요</h2>
          <p>
            또는{" "}
            <a
              href="#"
              style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 4 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              클릭해서 찾아보기
            </a>
          </p>
          <div className="formats">
            <span className="pill">CSV</span>
            <span className="pill">UTF-8</span>
            <span className="pill">≤ 100MB</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: "none" }}
            onChange={onPickFile}
          />
        </div>

        {file && (
          <div className="file-card">
            <div className="ic">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div className="meta">
              <div className="name">{file.name}</div>
              <div className="stats">{fileSizeMB} MB · 분석 시 자동 스키마 감지</div>
            </div>
            <button
              className="x"
              aria-label="Remove"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "14px 18px",
              background: "rgba(239, 68, 68, 0.10)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: 12,
              color: "#fecaca",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.04em",
            }}
          >
            <strong style={{ color: "#fca5a5", marginRight: 8 }}>ERROR</strong>
            {error}
          </div>
        )}

        <div className="settings">
          <div className="settings-head">
            <h2>분석 설정</h2>
            <span className="auto-detect">AUTO-DETECTED</span>
          </div>

          <div className="settings-grid">


            <div className="field horizon-row">
              <label>예측 기간 · 시평 (Horizon)</label>
              <div className="horizon-track">
                <input
                  type="range"
                  min={1}
                  max={365}
                  value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                />
                <div className="horizon-readout">
                  <span>1 step</span>
                  <strong>{horizon} steps ahead</strong>
                  <span>365 steps</span>
                </div>
              </div>
            </div>
          </div>

          <div className="actions">
            <div className="meta-info">FASTAPI · POST /api/forecast · MULTIPART</div>
            <button className="analyze" onClick={startAnalyze} disabled={!file || loading}>
              {loading ? "분석 중…" : "분석하기"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>

      <div className={`loading${overlayActive ? " show" : ""}`}>
        <div className="loading-orb" />
        <div className="loading-text">{PHASES[phaseIdx]}</div>
        <div className="loading-progress">
          <div className="bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </>
  );
}
