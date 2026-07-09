"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { Icon } from "./icon";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/* Warna seri status per docs/style.md §30 (laporan) — aman di light & dark */
const SERI = {
  approved: "#0075de",
  pending: "#dd5b00",
  rejected: "#e03e3e",
};

/** Chart.js butuh nilai warna konkret; baca token tema & ikuti perubahan data-theme. */
function useThemeTokens() {
  const [tokens, setTokens] = useState({
    text: "#1f1e1c",
    muted: "#615d59",
    grid: "rgba(0,117,222,0.08)",
  });

  useEffect(() => {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      setTokens({
        text: s.getPropertyValue("--color-text").trim() || "#1f1e1c",
        muted: s.getPropertyValue("--color-text-muted").trim() || "#615d59",
        grid:
          document.documentElement.dataset.theme === "dark"
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,117,222,0.08)",
      });
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return tokens;
}

interface MonthlyData {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface TopItem {
  nama: string;
  total: number;
}

interface AnalyticsChartProps {
  monthlyData: MonthlyData[];
  topItems: TopItem[];
  statusDistribution: {
    approved: number;
    pending: number;
    rejected: number;
  };
}

export function AnalyticsChart({
  monthlyData,
  topItems,
  statusDistribution,
}: AnalyticsChartProps) {
  const tokens = useThemeTokens();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: tokens.text,
          font: {
            family: "JetBrains Mono, monospace",
            size: 11,
          },
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: tokens.muted,
          font: {
            family: "JetBrains Mono, monospace",
            size: 10,
          },
        },
        grid: {
          color: tokens.grid,
        },
      },
      x: {
        ticks: {
          color: tokens.muted,
          font: {
            family: "JetBrains Mono, monospace",
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const lineData = {
    labels: monthlyData.map((d) => d.month),
    datasets: [
      {
        label: "Disetujui",
        data: monthlyData.map((d) => d.approved),
        borderColor: SERI.approved,
        backgroundColor: "rgba(0, 117, 222, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Menunggu",
        data: monthlyData.map((d) => d.pending),
        borderColor: SERI.pending,
        backgroundColor: "rgba(221, 91, 0, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Ditolak",
        data: monthlyData.map((d) => d.rejected),
        borderColor: SERI.rejected,
        backgroundColor: "rgba(224, 62, 62, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const barData = {
    labels: topItems.map((item) => item.nama.substring(0, 20)),
    datasets: [
      {
        label: "Total Permintaan",
        data: topItems.map((item) => item.total),
        backgroundColor: "rgba(0, 117, 222, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ["Disetujui", "Menunggu", "Ditolak"],
    datasets: [
      {
        data: [
          statusDistribution.approved,
          statusDistribution.pending,
          statusDistribution.rejected,
        ],
        backgroundColor: [SERI.approved, SERI.pending, SERI.rejected],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: tokens.text,
          font: {
            family: "JetBrains Mono, monospace",
            size: 11,
          },
          padding: 10,
        },
      },
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Trend Line Chart */}
      <div className="neu-card col-span-full hover:transform-none">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-text">
          <Icon name="chart" className="text-primary" />
          Trend Permintaan (6 Bulan Terakhir)
        </h3>
        <div className="h-[300px]">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      {/* Top Items Bar Chart */}
      <div className="neu-card hover:transform-none">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-text">
          <Icon name="star" className="text-primary" />
          Top 10 Barang Terpopuler
        </h3>
        <div className="h-[300px]">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      {/* Status Distribution Doughnut */}
      <div className="neu-card hover:transform-none">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-text">
          <Icon name="zap" className="text-primary" />
          Distribusi Status
        </h3>
        <div className="h-[300px]">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
