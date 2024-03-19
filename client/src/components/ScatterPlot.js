import React from "react";
import { Scatter } from "react-chartjs-2";

function ScatterPlot({ chartData }) {
  const options = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "Risk Score",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: "Prediction",
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: "RISK SCORE vs. PREDICTION",
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const id = context.raw.id;
            const riskScore = context.raw.x;
            const prediction = context.raw.y;
            return `ID: ${id}, Risk Score: ${riskScore}`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Scatter options={options} data={chartData} />
    </div>
  );
}

export default ScatterPlot;
