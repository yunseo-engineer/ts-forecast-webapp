"use client";

/**
 * Dashboard page
 * -----------------------------------------------------------
 * Pure composition. Each panel is an independent component so
 * you can re-order or swap them freely.
 *
 * Data flow:
 *   - Reads file + horizon from the Zustand store
 *   - On mount, and whenever either changes, triggers fetchForecast()
 *   - Renders cards that read the `data` slice
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FileInfoBar } from "@/components/dashboard/FileInfoBar";
import { HorizonControl } from "@/components/dashboard/HorizonControl";
import { ModelSelector } from "@/components/dashboard/ModelSelector";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { MetricGroupChart } from "@/components/dashboard/MetricGroupChart";
import { BiasCard } from "@/components/dashboard/BiasCard";
import { BestModelCard } from "@/components/dashboard/BestModelCard";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { METRIC_GROUPS } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const file = useAppStore((s) => s.file);
  const horizon = useAppStore((s) => s.horizon);
  const data = useAppStore((s) => s.data);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const fetchForecast = useAppStore((s) => s.fetchForecast);

  // If the user navigates here directly without uploading, bounce back.
  useEffect(() => {
    if (!file) {
      router.replace("/");
      return;
    }
    // Kick off analysis if we don't already have matching results.
    if (!data && !loading) {
      void fetchForecast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, horizon]);

  if (!file) return null;

  return (
    <main className="min-h-screen bg-surface-muted text-ink-900">
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 space-y-6">
        {/* Top bar: file info + horizon control */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-ink-900">
              Forecast dashboard
            </h1>
            {data && (
              <div className="mt-3">
                <FileInfoBar dataset={data.dataset} />
              </div>
            )}
          </div>
          <HorizonControl />
        </div>

        {/* Loading / error states */}
        {loading && (
          <Card>
            <div className="py-14 flex flex-col items-center gap-3 text-ink-500">
              <Spinner size={22} />
              <p className="text-sm">
                자동 전처리 · 5개 모델 학습 · 성능 평가 중…
              </p>
            </div>
          </Card>
        )}

        {error && !loading && (
          <Card>
            <div className="py-8 flex flex-col items-center gap-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchForecast()}>
                다시 시도
              </Button>
            </div>
          </Card>
        )}

        {/* Main dashboard */}
        {data && !loading && (
          <>
            {/* Forecast chart + best model side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card
                className="lg:col-span-2"
                title="예측 결과 비교"
                subtitle="학습 · 테스트 · 미래 예측 구간을 색상으로 구분했습니다."
                action={<ModelSelector />}
              >
                <ForecastChart data={data} />
              </Card>

              <BestModelCard data={data} />
            </div>

            {/* Metric group charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {METRIC_GROUPS.slice(0, 3).map((g) => (
                <Card key={g.label} title={g.label + " 지표"}>
                  <MetricGroupChart data={data} metricKeys={g.keys} />
                </Card>
              ))}

              <Card
                title="편향 진단"
                subtitle="RSFE · Tracking Signal"
              >
                <BiasCard data={data} />
              </Card>
            </div>

            {/* Full metrics table */}
            <Card
              title="전체 평가 지표"
              subtitle="모델별 전체 지표 — 각 열에서 최적값은 굵게 표시됩니다."
            >
              <MetricsTable data={data} best={data.best_model} />
            </Card>

            {/* Preprocessing notes */}
            <Card
              title="자동 전처리 로그"
              subtitle="최소 보정 원칙에 따라 수행된 내부 처리 요약"
            >
              <ul className="text-sm text-ink-500 space-y-1.5 list-disc pl-5">
                {data.dataset.preprocessing_notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
