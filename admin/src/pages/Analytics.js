import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true,
  plugins: { legend: { labels: { color: '#9CA3AF' } } },
  scales: {
    x: { grid: { color: '#1E1E2E' }, ticks: { color: '#6B7280' } },
    y: { grid: { color: '#1E1E2E' }, ticks: { color: '#6B7280' } },
  },
};

export default function Analytics() {
  const userGrowth = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      { label: 'Customers', data: [100, 250, 480, 720, 1100, 1850], borderColor: '#FF3D57', backgroundColor: 'rgba(255,61,87,0.1)', fill: true, tension: 0.4 },
      { label: 'Venue Owners', data: [10, 22, 38, 55, 72, 98], borderColor: '#7B2FBE', backgroundColor: 'rgba(123,47,190,0.1)', fill: true, tension: 0.4 },
    ],
  };

  const categoryBreakdown = {
    labels: ['Dining', 'Nightlife', 'Live Music', 'Lounges', 'Events'],
    datasets: [{
      data: [35, 28, 15, 12, 10],
      backgroundColor: ['#FF3D57', '#7B2FBE', '#F4A229', '#00D4AA', '#3B82F6'],
      borderWidth: 0,
    }],
  };

  const reservationTrend = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      { label: 'Table', data: [320, 410, 380, 520], backgroundColor: '#FF3D57' },
      { label: 'Guest List', data: [180, 220, 260, 310], backgroundColor: '#7B2FBE' },
    ],
  };

  const donutOpts = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF' } } },
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Session Duration', value: '8m 24s', icon: '⏱' },
          { label: 'AI Queries / Day', value: '2,847', icon: '✨' },
          { label: 'Story Views / Day', value: '12.4K', icon: '👁' },
          { label: 'Conversion Rate', value: '14.2%', icon: '📈' },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <span className="text-2xl">{kpi.icon}</span>
            <p className="font-display font-bold text-2xl text-white mt-2">{kpi.value}</p>
            <p className="text-gray-500 text-xs mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">User Growth</h2>
          <Line data={userGrowth} options={chartOpts} />
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Venue Category Breakdown</h2>
          <Doughnut data={categoryBreakdown} options={donutOpts} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Reservation Types by Week</h2>
        <Bar data={reservationTrend} options={chartOpts} />
      </div>
    </div>
  );
}
