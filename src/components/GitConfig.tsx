import React, { useState } from 'react';
import { GitConfig } from '../services/gitService';

interface GitConfigProps {
  onConfigSave: (config: GitConfig) => void;
  currentConfig?: GitConfig | null;
}

const GitConfigComponent: React.FC<GitConfigProps> = ({ onConfigSave, currentConfig }) => {
  const [repoUrl, setRepoUrl] = useState(currentConfig?.repoUrl || '');
  const [token, setToken] = useState(currentConfig?.token || '');
  const [username, setUsername] = useState(currentConfig?.username || '');
  const [email, setEmail] = useState(currentConfig?.email || '');
  const [branch, setBranch] = useState(currentConfig?.branch || 'main');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl || !token || !username || !email) {
      alert('Please fill in all required fields');
      return;
    }

    onConfigSave({
      repoUrl,
      token,
      username,
      email,
      branch
    });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3 className="title-s">Git Configuration</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
        <div>
          <label className="body-s" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>Repository URL *</label>
          <input
            className="input"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo.git"
            required
            spellCheck={false}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label className="body-s" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>Personal Access Token *</label>
          <input
            className="input"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            required
            spellCheck={false}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label className="body-s" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>Username *</label>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-username"
            required
            spellCheck={false}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label className="body-s" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>Email *</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your-email@example.com"
            required
            spellCheck={false}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label className="body-s" style={{ display: 'block', marginBottom: 'var(--spacing-4)' }}>Branch</label>
          <input
            className="input"
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="main"
            spellCheck={false}
            style={{ width: '100%' }}
          />
        </div>
        
        <button type="submit" data-appearance="primary" style={{ marginTop: 'var(--spacing-8)' }}>
          Save Configuration
        </button>
      </form>
      
      <div className="body-s" style={{ marginTop: 'var(--spacing-16)', color: 'var(--foreground-secondary)' }}>
        <p><strong>Note:</strong> Your credentials are stored locally in the browser.</p>
        <p>For GitHub repositories, the GitHub API method is recommended to avoid CORS issues.</p>
        <p>Create a Personal Access Token with repo permissions in your Git provider's settings.</p>
        <p><strong>Supported:</strong> GitHub repositories work best. Other Git providers may have CORS limitations.</p>
      </div>
    </div>
  );
};

export default GitConfigComponent;