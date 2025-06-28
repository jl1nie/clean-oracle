import React, { useState, useEffect } from 'react';

const Oracle = ({ referenceUUID, onReferenceNotFound }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oracleResult, setOracleResult] = useState(null); // { message: string }
  const [genderConfig, setGenderConfig] = useState('Male'); // Default to Male, load from localStorage

  useEffect(() => {
    const storedGender = localStorage.getItem('oracleGender');
    if (storedGender) {
      setGenderConfig(storedGender);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(''); // Clear previous errors
      setOracleResult(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }
    if (!referenceUUID) {
      setError('Reference image UUID is missing. Please register a reference image first.');
      return;
    }

    setLoading(true);
    setError('');
    setOracleResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('reference_uuid', referenceUUID);
    formData.append('config', JSON.stringify({ type: genderConfig })); // Send config as JSON string

    try {
      const response = await fetch('/api/oracle', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 404) {
          onReferenceNotFound(); // Notify App.jsx to clear UUID and show Register
          setError('Reference image not found. Please register a new one.');
          return;
        }
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setOracleResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during oracle generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedFile(null);
    setPreview(null);
    setOracleResult(null);
    setError('');
  };

  // Placeholder for settings dialog
  const handleSettingsChange = (e) => {
    const newGender = e.target.value;
    setGenderConfig(newGender);
    localStorage.setItem('oracleGender', newGender);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>神託を授けます</h2>
      {/* Settings Button */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <label>
          神を選ぶ:
          <select value={genderConfig} onChange={handleSettingsChange}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
      </div>

      {oracleResult ? (
        // Display Oracle Result
        <div>
          <p dangerouslySetInnerHTML={{ __html: oracleResult.message }}></p>
          {preview && (
            <div style={{ marginTop: '20px' }}>
              <img src={preview} alt="民の部屋の画像" style={{ maxWidth: '100%', maxHeight: '300px' }} />
            </div>
          )}
          <button onClick={handleTryAgain} style={{ marginTop: '20px' }}>
            再度トライ
          </button>
        </div>
      ) : (
        // Upload Form
        <div>
          <p>民の部屋の画像をアップロードしてください。</p>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="current-image-upload"
          />
          <label htmlFor="current-image-upload" style={{ cursor: 'pointer', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            画像を選択
          </label>

          {preview && (
            <div style={{ marginTop: '20px' }}>
              <img src={preview} alt="民の部屋のプレビュー" style={{ maxWidth: '100%', maxHeight: '300px'}} />
            </div>
          )}

          {selectedFile && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleUpload} disabled={loading}>
                {loading ? 'アップロード中...' : 'アップロード'}
              </button>
            </div>
          )}

          {loading && <div style={{ marginTop: '10px' }}>分析中、しばらくお待ちください...</div>}
          {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        </div>
      )}
    </div>
  );
};

export default Oracle;