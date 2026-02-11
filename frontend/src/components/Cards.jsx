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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cardsData.map((card) => (
        <div 
          key={card.id} 
          className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h2>
            <p className="text-gray-600 mb-4">{card.description}</p>
            {card.chartData && (
              <div className="h-64">
                <Doughnut 
                  data={card.chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: { display: true, position: 'bottom', labels: { padding: 20, usePointStyle: true, font: { size: 12 } } },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cards;