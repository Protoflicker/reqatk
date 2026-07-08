"use client";

import { useEffect, useRef } from "react";
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
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#1e293b",
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
          color: "#64748b",
          font: {
            family: "JetBrains Mono, monospace",
            size: 10,
          },
        },
        grid: {
          color: "rgba(37, 99, 235, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "#64748b",
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
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Pending",
        data: monthlyData.map((d) => d.pending),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Ditolak",
        data: monthlyData.map((d) => d.rejected),
        borderColor: "#64748b",
        backgroundColor: "rgba(100, 116, 139, 0.1)",
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
        backgroundColor: "rgba(37, 99, 235, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const doughnutData = {
    labels: ["Disetujui", "Pending", "Ditolak"],
    datasets: [
      {
        data: [
          statusDistribution.approved,
          statusDistribution.pending,
          statusDistribution.rejected,
        ],
        backgroundColor: [
          "rgba(37, 99, 235, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(100, 116, 139, 0.8)",
        ],
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
          color: "#1e293b",
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
      <div className="neu-card col-span-full">
        <h3 className="mb-4 font-display text-lg font-bold text-dark">
          📈 Trend Permintaan (6 Bulan Terakhir)
        </h3>
        <div className="h-[300px]">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      {/* Top Items Bar Chart */}
      <div className="neu-card">
        <h3 className="mb-4 font-display text-lg font-bold text-dark">
          🏆 Top 10 Barang Terpopuler
        </h3>
        <div className="h-[300px]">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      {/* Status Distribution Doughnut */}
      <div className="neu-card">
        <h3 className="mb-4 font-display text-lg font-bold text-dark">
          📊 Distribusi Status
        </h3>
        <div className="h-[300px]">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>
    </div>
  );
}
