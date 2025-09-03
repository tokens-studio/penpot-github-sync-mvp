export interface GitHubConfig {
  repoOwner: string;
  repoName: string;
  token: string;
  branch?: string;
}

export class GitHubApiService {
  private config: GitHubConfig;
  private baseUrl = 'https://api.github.com';
  private tokensFile = 'tokens.json';

  constructor(config: GitHubConfig) {
    this.config = {
      ...config,
      branch: config.branch || 'main'
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `token ${this.config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async pullTokens(): Promise<string | null> {
    try {
      const data = await this.makeRequest(
        `/repos/${this.config.repoOwner}/${this.config.repoName}/contents/${this.tokensFile}?ref=${this.config.branch}`
      );

      // Decode base64 content
      const content = atob(data.content.replace(/\n/g, ''));
      console.log('GitHub API - Raw content:', content);
      
      // Try to parse and re-stringify to ensure proper formatting
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch (parseError) {
        console.warn('Content is not valid JSON, returning as-is:', parseError);
        return content;
      }
    } catch (error: any) {
      if (error.message.includes('404')) {
        // File doesn't exist, return empty object
        return '{}';
      }
      throw error;
    }
  }

  async pushTokens(tokens: string): Promise<void> {
    try {
      // First, try to get the current file to get its SHA (required for updates)
      let sha: string | undefined;
      try {
        const currentFile = await this.makeRequest(
          `/repos/${this.config.repoOwner}/${this.config.repoName}/contents/${this.tokensFile}?ref=${this.config.branch}`
        );
        sha = currentFile.sha;
      } catch (error: any) {
        // File doesn't exist, which is fine for creation
        if (!error.message.includes('404')) {
          throw error;
        }
      }

      // Create or update the file
      const content = btoa(tokens); // Base64 encode
      const payload = {
        message: `Update tokens - ${new Date().toISOString()}`,
        content,
        branch: this.config.branch,
        ...(sha && { sha }) // Include SHA if updating existing file
      };

      await this.makeRequest(
        `/repos/${this.config.repoOwner}/${this.config.repoName}/contents/${this.tokensFile}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        }
      );
    } catch (error) {
      console.error('Error pushing tokens:', error);
      throw error;
    }
  }

  async getCommitHistory(limit = 10): Promise<Array<{ message: string; date: string; author: string }>> {
    try {
      const commits = await this.makeRequest(
        `/repos/${this.config.repoOwner}/${this.config.repoName}/commits?path=${this.tokensFile}&per_page=${limit}&sha=${this.config.branch}`
      );

      return commits.map((commit: any) => ({
        message: commit.commit.message,
        date: new Date(commit.commit.author.date).toLocaleString(),
        author: commit.commit.author.name
      }));
    } catch (error) {
      console.error('Error getting commit history:', error);
      return [];
    }
  }

  // Helper method to parse GitHub repo URL
  static parseRepoUrl(repoUrl: string): { owner: string; name: string } | null {
    const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/)?$/);
    if (match) {
      return { owner: match[1], name: match[2] };
    }
    return null;
  }
}