import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch search history from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSearchHistory();
    } else {
      // For guest users, load from localStorage
      const saved = localStorage.getItem('searchHistory');
      setSearchHistory(saved ? JSON.parse(saved) : []);
    }
  }, [isAuthenticated]);

  const fetchSearchHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get('http://localhost:5000/api/search-history');
      if (response.data.success) {
        // Transform database format to match component format
        const transformedHistory = response.data.data.map(item => ({
          id: item._id,
          timestamp: new Date(item.timestamp).toLocaleString(),
          symptoms: item.symptoms,
          disease: item.disease,
          severity: item.severity,
          fileName: item.fileName
        }));
        setSearchHistory(transformedHistory);
      }
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const exampleSymptoms = [
    { icon: "🤒", text: "fever, cough, sore throat" },
    { icon: "🤕", text: "headache, nausea" },
    { icon: "🤢", text: "stomach pain, diarrhea" },
    { icon: "😴", text: "fatigue, weakness" },
    { icon: "🤧", text: "itchy eyes, sneezing" }
  ];

  const handleExampleClick = (example) => {
    setSymptoms(example);
  };

  const handleClear = () => {
    setSymptoms('');
    setUploadedFile(null);
    setResult(null);
    setError(null);
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all search history?')) {
      return;
    }

    try {
      if (isAuthenticated) {
        // Clear from database
        await axios.delete('http://localhost:5000/api/search-history');
        setSearchHistory([]);
      } else {
        // Clear from localStorage for guest users
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
      }
    } catch (error) {
      console.error('Error clearing search history:', error);
      alert('Failed to clear search history. Please try again.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('symptoms', symptoms);

      if (uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const response = await axios.post('http://localhost:5000/api/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);

      // Refresh search history after successful prediction
      if (isAuthenticated) {
        // History is automatically saved by backend, just refresh the list
        await fetchSearchHistory();
      } else {
        // For guest users, save to localStorage
        const displaySymptoms = symptoms || (uploadedFile ? `File: ${uploadedFile.name}` : '');
        const newSearch = {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          symptoms: displaySymptoms.substring(0, 100) + (displaySymptoms.length > 100 ? '...' : ''),
          disease: response.data.disease,
          severity: response.data.severity,
          fileName: uploadedFile ? uploadedFile.name : null
        };

        const updatedHistory = [newSearch, ...searchHistory].slice(0, 20);
        setSearchHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching prediction:', err);
      setError('Failed to get prediction. Please make sure the backend services are running.');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Header />

      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>🏥 AI Disease Prediction System</h1>
          <p>AI-powered health insights in seconds - Fast, Accurate, Reliable</p>
        </div>

        <div className="main-content-grid">
          {/* Left Side - Input & Info Section */}
          <div className="left-section">
            {/* Input Form Card */}
            <div className="input-card">
              <div className="card-title">
                <span className="title-icon">🔍</span>
                <h3>Analyze Your Symptoms</h3>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <label htmlFor="symptoms">
                    <span className="label-icon">📝</span> Describe Symptoms
                  </label>
                  <textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., fever, headache, cough, fatigue..."
                    rows="4"
                  />
                </div>

                <div className="form-section">
                  <label htmlFor="file-upload">
                    <span className="label-icon">📄</span> Upload Report
                  </label>
                  <div className="file-upload-area compact">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="file-input"
                    />
                    <label htmlFor="file-upload" className="file-upload-label compact">
                      <div className="upload-icon-small">📤</div>
                      <span className="upload-text">
                        {uploadedFile ? uploadedFile.name : 'Click to upload'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="button-group">
                  <button type="submit" className="predict-button" disabled={loading || (!symptoms.trim() && !uploadedFile)}>
                    {loading ? '⏳ Analyzing...' : '🔍 Get Prediction'}
                  </button>
                  {(symptoms || uploadedFile || result) && (
                    <button type="button" onClick={handleClear} className="clear-button" title="Clear all inputs and results">
                      🗑️ Clear
                    </button>
                  )}
                </div>
              </form>

              <div className="examples-section compact">
                <p className="examples-title">💡 Quick Examples</p>
                <div className="examples-list">
                  {exampleSymptoms.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(example.text)}
                      className="example-chip"
                    >
                      <span className="chip-icon">{example.icon}</span>
                      {example.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search History Table */}
            <div className="info-card search-history-card">
              <div className="card-title">
                <span className="title-icon">📊</span>
                <h3>Search History</h3>
                {searchHistory.length > 0 && (
                  <button onClick={handleClearHistory} className="clear-history-button" title="Clear search history">
                    🗑️ Clear History
                  </button>
                )}
              </div>
              {historyLoading ? (
                <div className="empty-history">
                  <p>Loading search history...</p>
                </div>
              ) : searchHistory.length === 0 ? (
                <div className="empty-history">
                  <p>
                    {isAuthenticated
                      ? 'No search history yet. Start by analyzing your symptoms above!'
                      : 'Login to save and view your search history across devices!'}
                  </p>
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Symptoms</th>
                        <th>Predicted Disease</th>
                        <th>Severity</th>
                        <th>File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchHistory.map((search) => (
                        <tr key={search.id}>
                          <td>{search.timestamp}</td>
                          <td className="symptoms-cell">{search.symptoms}</td>
                          <td className="disease-cell">{search.disease}</td>
                          <td>
                            <span className={`severity-badge-small ${search.severity.toLowerCase().replace(' ', '-')}`}>
                              {search.severity}
                            </span>
                          </td>
                          <td className="file-cell">
                            {search.fileName ? (
                              <span className="file-indicator">📄 {search.fileName}</span>
                            ) : (
                              <span className="no-file">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Results Section */}
          <div className="right-section">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Prediction Yet</h3>
                <p>Enter your symptoms and click "Get Prediction" to receive AI-powered health insights</p>
                <div className="empty-features">
                  <div className="empty-feature">
                    <span>✓</span> Instant AI analysis
                  </div>
                  <div className="empty-feature">
                    <span>✓</span> Personalized recommendations
                  </div>
                  <div className="empty-feature">
                    <span>✓</span> Diet & lifestyle tips
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="result-section">
                {/* Disease Prediction Card */}
                <div className="result-card disease-card">
                  <div className="card-header">
                    <span className="header-icon">🎯</span>
                    <h2>Predicted Condition</h2>
                  </div>
                  <div className="severity-badge">{result.severity}</div>
                  <h3 className="disease-name">{result.disease}</h3>
                  <div className="match-score">
                    <span className="score-icon">✓</span>
                    <span>Symptoms Match: <strong>{result.symptoms_match}</strong></span>
                  </div>
                  <p className="description">{result.description}</p>
                </div>

                {/* Recommendations Card */}
                <div className="result-card tips-card">
                  <div className="card-header">
                    <span className="header-icon">💡</span>
                    <h2>Health Recommendations</h2>
                  </div>
                  <div className="tips-grid">
                    {result.tips.map((tip, index) => (
                      <div key={index} className="tip-item">
                        <div className="tip-icon">{tip.icon}</div>
                        <div className="tip-content">
                          <h4>{tip.title}</h4>
                          <p>{tip.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diet Plan Card */}
                <div className="result-card diet-card">
                  <div className="card-header">
                    <span className="header-icon">🍽️</span>
                    <h2>Nutrition Plan</h2>
                  </div>
                  <div className="diet-section">
                    <div className="diet-column eat-column">
                      <h3 className="foods-to-eat">
                        <span className="diet-icon">✅</span> Foods to Eat
                      </h3>
                      <div className="food-list">
                        {result.diet_plan.foods_to_eat.map((food, index) => (
                          <div key={index} className="food-item">
                            <span className="food-icon">{food.icon}</span>
                            <div className="food-details">
                              <strong>{food.name}</strong>
                              <span className="food-benefit">{food.benefit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="diet-column avoid-column">
                      <h3 className="foods-to-avoid">
                        <span className="diet-icon">❌</span> Foods to Avoid
                      </h3>
                      <div className="food-list">
                        {result.diet_plan.foods_to_avoid.map((food, index) => (
                          <div key={index} className="food-item">
                            <span className="food-icon">{food.icon}</span>
                            <div className="food-details">
                              <strong>{food.name}</strong>
                              <span className="food-reason">{food.reason}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* When to See Doctor Card */}
                <div className="result-card doctor-card">
                  <div className="card-header warning-header">
                    <span className="header-icon">⚠️</span>
                    <h2>When to See a Doctor</h2>
                  </div>
                  <ul className="doctor-list">
                    {result.when_to_see_doctor.map((item, index) => (
                      <li key={index}>
                        <span className="warning-icon">🚨</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disclaimer */}
                <div className="disclaimer">
                  <span className="disclaimer-icon">ℹ️</span>
                  <strong>Medical Disclaimer:</strong> This AI prediction tool is for informational purposes only and not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
