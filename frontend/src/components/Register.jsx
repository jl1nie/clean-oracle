import React, { useState } from 'react';

const Register = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUploadSuccess(data.uuid);
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>神の部屋の登録</h2>
      <p>きれいさの基準となる神の部屋の画像を登録してください。</p>
      <input 
        type="file" 
        accept="image/jpeg,image/png" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        id="file-upload"
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        画像を選択
      </label>

      {preview && (
        <div style={{ marginTop: '20px' }}>
          <img src={preview} alt="神の部屋のプレビュー" style={{ maxWidth: '100%', maxHeight: '300px' }} />
        </div>
      )}

      {selectedFile && (
        <div style={{ marginTop: '20px' }}>
          <button onClick={handleUpload} disabled={loading}>
            {loading ? 'アップロード中...' : 'アップロード'}
          </button>
        </div>
      )}

      {loading && <div style={{ marginTop: '10px' }}>アップロード中、しばらくお待ちください...</div>}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
};

export default Register;
