import React from "react";
import { Bar } from "react-chartjs-2";
import {Chart as chartjs} from 'chart.js/auto'

function BarChart(chartData) {
    return <Bar data = {chartData} /> //U can add options by "options = {{a}}" beside Bar data to add animations or cool things
}

export default BarChart;