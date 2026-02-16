import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Cards = ({ cardsData }) => {
  if (!cardsData || cardsData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No chart data available</p>
      </div>
    );
  }

  const card = cardsData[0];
  const hasData = card.chartData?.datasets?.[0]?.data?.some(value => value > 0);
  
  return (
    <div className="h-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 h-full flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          {card.title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{card.description}</p>
        
        <div className="flex-1 flex items-center justify-center" style={{ minHeight: '250px' }}>
          {hasData ? (
            <div className="w-full h-full">
              <Doughnut 
                data={card.chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { 
                      position: 'bottom',
                      labels: { 
                        padding: 16,
                        usePointStyle: true,
                        font: { 
                          size: 12,
                          weight: '500'
                        },
                        boxWidth: 10,
                        boxHeight: 10,
                        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563'
                      }
                    },
                    tooltip: {
                      backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                      titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
                      bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563',
                      borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8,
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                          return `${label}: ${value.toFixed(2)} MB (${percentage}%)`;
                        }
                      }
                    }
                  },
                  elements: {
                    arc: {
                      borderWidth: 2,
                      borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 dark:text-gray-500">No data to display</p>
            </div>
          )}
        </div>

        {hasData && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
            {card.chartData.labels.map((label, index) => {
              const value = card.chartData.datasets[0].data[index];
              const total = card.chartData.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              const color = card.chartData.datasets[0].backgroundColor[index];
              
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white ml-auto">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cards;