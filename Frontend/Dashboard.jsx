import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
  const [dataPoints, setDataPoints] = useState([]);
  const [currentRisk, setCurrentRisk] = useState(0);
  const [reason, setReason] = useState(""); 
  const [isAutoMode, setIsAutoMode] = useState(true); // Toggle for Simulation

  // Form State for Manual Input
  const [manualInput, setManualInput] = useState({
    Type: "M",
    Air_Temp: 300,
    Process_Temp: 310,
    Rotational_Speed: 1500,
    Torque: 40,
    Tool_Wear: 0
  });

  // 1. Function to call API (Used by both Auto and Manual modes)
  const predictFailure = async (sensorData) => {
    try {
      const response = await axios.post('http://localhost:8000/predict', sensorData);
      const { risk_score, explanation } = response.data;
      
      setCurrentRisk(risk_score);
      if (explanation) setReason(explanation.human_readable);

      // Add to chart
      setDataPoints(prev => {
        const newPoint = { 
          time: new Date().toLocaleTimeString(), 
          risk: risk_score,
          ...sensorData 
        };
        return [...prev, newPoint].slice(-20); 
      });
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  // 2. Automatic Simulation Loop
  useEffect(() => {
    let interval;
    if (isAutoMode) {
      interval = setInterval(() => {
        // Generate random "fake" data
        const dummyData = {
          Type: "M", 
          Air_Temp: 298.1 + (Math.random() * 5),       
          Process_Temp: 308.6 + (Math.random() * 5),
          Rotational_Speed: 1500 + Math.floor(Math.random() * 100),
          Torque: 40 + (Math.random() * 10),
          Tool_Wear: Math.floor(Math.random() * 200) 
        };
        predictFailure(dummyData);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAutoMode]); // Re-run effect when mode changes

  // 3. Handle Manual Form Submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    predictFailure(manualInput);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">PredictMaint: Live Monitor</h1>
        
        {/* Toggle Switch */}
        <button 
          onClick={() => setIsAutoMode(!isAutoMode)}
          className={`px-4 py-2 rounded font-bold ${isAutoMode ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'}`}
        >
          {isAutoMode ? "🔄 Auto-Simulation ON" : "🛑 Manual Mode ON"}
        </button>
      </div>
      
      {/* Top Section: Metrics & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg shadow-md text-white transition-colors duration-500 ${currentRisk > 0.7 ? 'bg-red-600' : 'bg-green-600'}`}>
          <h2 className="text-xl font-semibold">Current Failure Risk</h2>
          <p className="text-5xl font-bold mt-2">{(currentRisk * 100).toFixed(1)}%</p>
          {currentRisk > 0.7 && (
             <div className="mt-4 bg-white bg-opacity-20 border border-white border-opacity-30 p-3 rounded-md animate-pulse">
                <p className="font-bold text-yellow-100 uppercase text-xs">Root Cause Analysis</p>
                <p className="font-medium text-white mt-1">⚠️ {reason}</p>
             </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Real-time Risk Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataPoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Line type="monotone" dataKey="risk" stroke={currentRisk > 0.7 ? "#dc2626" : "#059669"} strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Manual Control Panel */}
      {!isAutoMode && (
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
          <h3 className="text-xl font-bold mb-4 text-gray-800">🛠️ Manual Machine Control</h3>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Air Temperature (K)</label>
              <input type="number" step="0.1" value={manualInput.Air_Temp} 
                onChange={e => setManualInput({...manualInput, Air_Temp: parseFloat(e.target.value)})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Process Temperature (K)</label>
              <input type="number" step="0.1" value={manualInput.Process_Temp} 
                onChange={e => setManualInput({...manualInput, Process_Temp: parseFloat(e.target.value)})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rotational Speed (RPM)</label>
              <input type="number" value={manualInput.Rotational_Speed} 
                onChange={e => setManualInput({...manualInput, Rotational_Speed: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Torque (Nm)</label>
              <input type="number" step="0.1" value={manualInput.Torque} 
                onChange={e => setManualInput({...manualInput, Torque: parseFloat(e.target.value)})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tool Wear (min)</label>
              <input type="number" value={manualInput.Tool_Wear} 
                onChange={e => setManualInput({...manualInput, Tool_Wear: parseInt(e.target.value)})}
                className="mt-1 block w-full p-2 border border-gray-300 rounded" />
            </div>

            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
                Test Parameters
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;