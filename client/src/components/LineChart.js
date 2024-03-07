// src/components/LineChart.js
import React from "react";
import { Line } from "react-chartjs-2";

function LineChart({ chartData }) {
  return (
    <div className="chart-container">
      <h2 style={{ textAlign: "center" }}></h2>
      <Line
        data={chartData}
        options={{
          plugins: {
            title: {
              display: true,
              text: "LINE CHART"
            }
          }
        }}
      />
    </div>
  );
}
export default LineChart;