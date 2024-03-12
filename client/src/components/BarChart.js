// src/components/PieChart.js
import React from "react";
import { Bar } from "react-chartjs-2";

function BarChart({ chartData }) {
  return (
    <div className="chart-container">
      <h2 style={{ textAlign: "center" }}></h2>
      <Bar
        data={chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: "BAR CHART"
            }
          }
        }}
      />
    </div>
  );
}
export default BarChart;