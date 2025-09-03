// @ts-nocheck
import git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';

// Initialize the file system
const fs = new FS('tokens-repo');

export interface GitConfig {
  repoUrl: string;
  token: string;
  username: string;
  email: string;
  branch?: string;
}

// Custom HTTP client for authentication with CORS proxy
const createHttpClient = (token: string) => ({
  request: async (request: any) => {
    const headers = {
      ...request.headers,
      Authorization: `token ${token}`
    };
    
    // Use CORS proxy for git requests
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const targetUrl = request.url.startsWith('http') ? request.url : request.url;
    const finalUrl = targetUrl.includes('cors-anywhere') ? targetUrl : proxyUrl + targetUrl;
    
    const response = await fetch(finalUrl, {
      method: request.method,
      headers: {
        ...headers,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: request.body,
    });
    
    const body = new Uint8Array(await response.arrayBuffer());
    
    // Convert Headers to plain object
    const responseHeaders: { [key: string]: string } = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    return {
      url: response.url,
      method: request.method,
      statusCode: response.status,
      statusMessage: response.statusText,
      body,
      headers: responseHeaders
    };
  }
});

export class GitService {
  private config: GitConfig;
  private dir = '/repo';
  private tokensFile = 'tokens.json';

  constructor(config: GitConfig) {
    this.config = {
      ...config,
      branch: config.branch || 'main'
    };
  }

  async initialize(): Promise<void> {
    try {
      // Try to check if repo exists
      await git.currentBranch({ fs, dir: this.dir });
    } catch {
      // Clone the repository if it doesn't exist
      await this.cloneRepo();
    }
  }

  private async cloneRepo(): Promise<void> {
    await git.clone({
      fs,
      http: createHttpClient(this.config.token),
      dir: this.dir,
      url: this.config.repoUrl,
      singleBranch: true,
      depth: 1
    });
  }

  async pullTokens(): Promise<string | null> {
    try {
      await this.initialize();
      
      // Fetch latest changes
      await git.fetch({
        fs,
        http: createHttpClient(this.config.token),
        dir: this.dir,
        ref: this.config.branch
      });

      // Read tokens file
      try {
        const tokensContent = await fs.promises.readFile(`${this.dir}/${this.tokensFile}`, 'utf8');
        console.log('Git service - Raw content:', tokensContent);
        
        // Try to parse and re-stringify to ensure proper formatting
        try {
          const parsed = JSON.parse(tokensContent);
          return JSON.stringify(parsed, null, 2);
        } catch (parseError) {
          console.warn('Content is not valid JSON, returning as-is:', parseError);
          return tokensContent;
        }
      } catch {
        // File doesn't exist, return empty object
        return '{}';
      }
    } catch (error) {
      console.error('Error pulling tokens:', error);
      throw error;
    }
  }

  async pushTokens(tokens: string): Promise<void> {
    try {
      await this.initialize();

      // Write tokens to file
      await fs.promises.writeFile(`${this.dir}/${this.tokensFile}`, tokens, 'utf8');

      // Add the file
      await git.add({
        fs,
        dir: this.dir,
        filepath: this.tokensFile
      });

      // Check if there are changes to commit
      const status = await git.status({
        fs,
        dir: this.dir,
        filepath: this.tokensFile
      });

      if (status === 'modified' || status === 'added') {
        // Commit the changes
        await git.commit({
          fs,
          dir: this.dir,
          message: `Update tokens - ${new Date().toISOString()}`,
          author: {
            name: this.config.username,
            email: this.config.email
          }
        });

        // Push the changes
        await git.push({
          fs,
          http: createHttpClient(this.config.token),
          dir: this.dir,
          ref: this.config.branch
        });
      }
    } catch (error) {
      console.error('Error pushing tokens:', error);
      throw error;
    }
  }

  async getCommitHistory(limit = 10): Promise<Array<{ message: string; date: string; author: string }>> {
    try {
      await this.initialize();
      
      const commits = await git.log({
        fs,
        dir: this.dir,
        depth: limit
      });

      return commits.map(commit => ({
        message: commit.commit.message,
        date: new Date(commit.commit.author.timestamp * 1000).toLocaleString(),
        author: commit.commit.author.name
      }));
    } catch (error) {
      console.error('Error getting commit history:', error);
      return [];
    }
  }
}