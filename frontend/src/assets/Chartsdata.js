export const chartData = [
  {
    id: 1,
    title: "Storage Usage",
    description: "Distribution of used storage by file type",
    chartData: {
      labels: ['Images', 'Documents', 'Videos', 'PDFs', 'Others'],
      datasets: [
        {
          label: 'Storage (GB)',
          data: [12, 19, 3, 5, 2],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderWidth: 1,
        },
      ],
    },
  },
  {
    id: 2,
    title: "User Activity",
    description: "Upload activity by user role",
    chartData: {
      labels: ['Admins', 'Users', 'Guests'],
      datasets: [
        {
          label: 'Uploads Count',
          data: [42, 30, 10],
          backgroundColor: ['#FF9F40', '#FF6384', '#36A2EB'],
          borderWidth: 1,
        },
      ],
    },
  },
];