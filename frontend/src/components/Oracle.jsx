import React, { useState, useEffect } from 'react';

const Oracle = ({ referenceUUID, onReferenceNotFound }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oracleResult, setOracleResult] = useState(null);
  const [genderConfig, setGenderConfig] = useState('Male');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');

  useEffect(() => {
    const storedGender = localStorage.getItem('oracleGender');
    if (storedGender) {
      setGenderConfig(storedGender);
    }

    if (referenceUUID) {
      // Fetch the reference image URL when the component mounts
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      setReferenceImageUrl(`${baseUrl}/api/image/${referenceUUID}`);
    }
  }, [referenceUUID]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
      setOracleResult(null);
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
    formData.append('config', JSON.stringify({ type: genderConfig }));

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/oracle`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 404) {
          onReferenceNotFound();
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

  const handleSettingsChange = (e) => {
    const newGender = e.target.value;
    setGenderConfig(newGender);
    localStorage.setItem('oracleGender', newGender);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>部屋のきれいさを判定します</h2>
      <p>現在の部屋の画像をアップロードしてください。</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        {referenceImageUrl && (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <h3>神の部屋</h3>
            <img src={referenceImageUrl} alt="神の部屋" style={{ maxWidth: '300px', maxHeight: '300px' }} />
          </div>
        )}
        {preview && (
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
            <h3>民の部屋</h3>
            <img src={preview} alt="民の部屋のプレビュー" style={{ maxWidth: '300px', maxHeight: '300px' }} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="oracle-file-upload"
        />
        <label htmlFor="oracle-file-upload" style={{ cursor: 'pointer', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '5px' }}>
          画像を選択
        </label>
      </div>

      {selectedFile && !oracleResult && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? 'アップロード中...' : 'アップロード'}
          </button>
        </div>
      )}

      {loading && <div style={{ marginTop: '10px' }}>分析中、しばらくお待ちください...</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      
      {oracleResult && (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h3>神託</h3>
          <div data-testid="oracle-message" dangerouslySetInnerHTML={{ __html: oracleResult.message }} />
          <button onClick={handleTryAgain} style={{ marginTop: '20px' }}>
            再度トライ
          </button>
        </div>
      )}
    </div>
  );
};

export default Oracle;