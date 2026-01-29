import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';
  import { Bar } from 'react-chartjs-2';
  
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
  
  const AdminChart = ({ title, labels, values, color }) => {
    const data = {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          backgroundColor: color || 'rgba(26, 37, 96, 0.8)',
          borderRadius: 6
        }
      ]
    };
  
    const options = {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          font: { size: 18 }
        }
      }
    };
  
    return (
      <div style={{ width: '100%', marginBottom: '40px' }}>
        <Bar data={data} options={options} />
      </div>
    );
  };
  
  export default AdminChart;
  