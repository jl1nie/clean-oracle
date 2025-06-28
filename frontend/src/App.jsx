import React, { useState, useEffect } from 'react';
import Register from './components/Register';
import Oracle from './components/Oracle';
import './App.css';

function App() {
  const [referenceUUID, setReferenceUUID] = useState(null);

  useEffect(() => {
    const storedUUID = localStorage.getItem('referenceUUID');
    if (storedUUID) {
      setReferenceUUID(storedUUID);
    }
  }, []);

  const handleUploadSuccess = (uuid) => {
    localStorage.setItem('referenceUUID', uuid);
    setReferenceUUID(uuid);
  };

  const handleReferenceNotFound = () => {
    localStorage.removeItem('referenceUUID');
    setReferenceUUID(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Clean Oracle</h1>
      </header>
      <main>
        {referenceUUID ? (
          <Oracle referenceUUID={referenceUUID} onReferenceNotFound={handleReferenceNotFound} />
        ) : (
          <Register onUploadSuccess={handleUploadSuccess} />
        )}
      </main>
    </div>
  );
}

export default App;
