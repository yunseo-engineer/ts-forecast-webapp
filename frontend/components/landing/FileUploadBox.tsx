"use client";

/**
 * FileUploadBox
 * -----------------------------------------------------------
 * The main CTA on the landing page. Mirrors the email+button shape
 * from the reference design, but accepts a .csv file instead.
 *
 * Logic is intentionally thin here:
 *   - Stores file in the app store
 *   - Navigates to /dashboard on submit; the dashboard page kicks off
 *     the actual forecasting request.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Spinner } from "@/components/ui/Spinner";

export function FileUploadBox() {
  const router = useRouter();
  const setFile = useAppStore((s) => s.setFile);
  const fileInStore = useAppStore((s) => s.file);

  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(file: File | undefined | null) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv")) {
      setLocalError("CSV 파일만 업로드할 수 있습니다.");
      return;
    }
    setLocalError(null);
    setFile(file);
  }

  function handleSubmit() {
    if (!fileInStore) {
      setLocalError("먼저 CSV 파일을 선택하세요.");
      return;
    }
    setSubmitting(true);
    router.push("/dashboard");
  }

  return (
    <div className="mt-10 mx-auto max-w-xl animate-fade-up [animation-delay:120ms]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handlePick(e.dataTransfer.files?.[0]);
        }}
        className={
          "relative flex items-stretch gap-0 rounded-xl bg-white shadow-soft " +
          "border transition-colors " +
          (dragOver ? "border-ink-900" : "border-ink-100")
        }
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 text-left px-4 py-3.5 text-sm text-ink-500 hover:text-ink-700 transition-colors"
        >
          {fileInStore ? (
            <span className="text-ink-900 font-medium truncate block">
              {fileInStore.name}
            </span>
          ) : (
            <span>CSV 파일을 끌어놓거나 클릭해서 선택</span>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={
            "shrink-0 m-1 px-5 rounded-lg bg-ink-900 text-white text-sm " +
            "font-medium tracking-tight hover:bg-black transition-colors " +
            "disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          }
        >
          {submitting ? (
            <>
              <Spinner size={14} /> 이동 중
            </>
          ) : (
            "분석 시작"
          )}
        </button>
      </div>

      {localError && (
        <p className="mt-2 text-xs text-red-600 text-left pl-1">{localError}</p>
      )}
      {!localError && (
        <p className="mt-3 text-xs text-ink-500">
          시간 열 1개 + 값 열 1개로 구성된 단변량 CSV를 지원합니다.
        </p>
      )}
    </div>
  );
}
