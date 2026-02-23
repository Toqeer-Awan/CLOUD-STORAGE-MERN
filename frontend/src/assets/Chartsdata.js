// This file now exports an empty template - data will be populated dynamically
export const chartDataTemplate = [
  {
    id: 1,
    title: "Storage Usage by Type",
    description: "Distribution of used storage by file type",
    chartData: {
      labels: [],
      datasets: [
        {
          label: 'Storage (MB)',
          data: [],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          borderWidth: 1,
        },
      ],
    },
  },
  {
    id: 2,
    title: "Files by Type",
    description: "Number of files by category",
    chartData: {
      labels: [],
      datasets: [
        {
          label: 'File Count',
          data: [],
          backgroundColor: ['#FF9F40', '#FF6384', '#36A2EB', '#4BC0C0', '#9966FF'],
          borderWidth: 1,
        },
      ],
    },
  },
  // NEW: Storage Overview Chart (Total vs Used)
  {
    id: 3,
    title: "Storage Overview",
    description: "Total allocated vs used storage",
    chartData: {
      labels: ['Used Storage', 'Available Storage'],
      datasets: [
        {
          label: 'Storage (GB)',
          data: [0, 0],
          backgroundColor: ['#FF6384', '#36A2EB'], // Red for used, Blue for available
          borderWidth: 1,
        },
      ],
    },
  },
];