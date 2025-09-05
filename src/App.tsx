import React, { useState, useEffect } from "react";
import { GitService, GitConfig } from "./services/gitService";
import { GitHubApiService, GitHubConfig } from "./services/githubApiService";
import GitConfigComponent from "./components/GitConfig";
import Toast from "./components/Toast";
import "./style.css";

type Tab = "tokens" | "git-config" | "history";

const App: React.FC = () => {
  const [tokens, setTokens] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("tokens");
  const [gitService, setGitService] = useState<GitService | null>(null);
  const [githubService, setGithubService] = useState<GitHubApiService | null>(
    null,
  );
  const [gitConfig, setGitConfig] = useState<GitConfig | null>(null);
  const [useGitHubApi, setUseGitHubApi] = useState(true);
  const [commitHistory, setCommitHistory] = useState<
    Array<{ message: string; date: string; author: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  useEffect(() => {
    // Set theme from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    document.body.dataset.theme = searchParams.get("theme") ?? "light";

    // Load saved git config from localStorage
    const savedConfig = localStorage.getItem("penpot-git-config");
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setGitConfig(config);
        setGitService(new GitService(config));

        // Also try to set up GitHub API service
        const repoInfo = GitHubApiService.parseRepoUrl(config.repoUrl);
        if (repoInfo) {
          const githubConfig: GitHubConfig = {
            repoOwner: repoInfo.owner,
            repoName: repoInfo.name,
            token: config.token,
            branch: config.branch,
          };
          setGithubService(new GitHubApiService(githubConfig));
        }
      } catch (e) {
        console.error("Error loading git config:", e);
      }
    }

    // Listen for messages from the plugin
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.source === "penpot" &&
        event.data.type === "getTokensResult"
      ) {
        let tokens = event.data.tokens;
        // If tokens is already a string, parse it first
        if (typeof tokens === "string") {
          try {
            tokens = JSON.parse(tokens);
          } catch (e) {
            // If parsing fails, use the string as-is
          }
        }
        setTokens(JSON.stringify(tokens, null, 2));
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleGetTokens = () => {
    parent.postMessage("getTokens", "*");
  };

  const handleSetTokens = () => {
    parent.postMessage({ type: "setTokens", tokens }, "*");
    showToast("Tokens set successfully!", "success");
  };

  const handleTokensChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setTokens(event.target.value);
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const handleGitConfigSave = (config: GitConfig) => {
    setGitConfig(config);

    // Create both services
    setGitService(new GitService(config));

    // Try to parse GitHub repo for API service
    const repoInfo = GitHubApiService.parseRepoUrl(config.repoUrl);
    if (repoInfo) {
      const githubConfig: GitHubConfig = {
        repoOwner: repoInfo.owner,
        repoName: repoInfo.name,
        token: config.token,
        branch: config.branch,
      };
      setGithubService(new GitHubApiService(githubConfig));
    }

    localStorage.setItem("penpot-git-config", JSON.stringify(config));
    showToast("Git configuration saved successfully!", "success");
    setActiveTab("tokens");
  };

  const handlePullFromGit = async () => {
    const service = useGitHubApi ? githubService : gitService;
    if (!service) {
      showToast("Please configure Git first", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const pulledTokens = await service.pullTokens();
      console.log("Pulled tokens:", pulledTokens);

      // Update the textarea even if tokens are null or empty
      const tokensToSet = pulledTokens || "{}";
      setTokens(tokensToSet);

      // Also update the plugin
      // parent.postMessage({ type: "setTokens", tokens: tokensToSet }, "*");

      showToast("Tokens pulled successfully from Git!", "success");
    } catch (error) {
      console.error("Error pulling from Git:", error);
      showToast(
        `Error pulling from Git: ${error instanceof Error ? error.message : "Check console for details"}`,
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGit = async () => {
    const service = useGitHubApi ? githubService : gitService;
    if (!service) {
      showToast("Please configure Git first", "warning");
      return;
    }

    if (!tokens.trim()) {
      showToast("No tokens to push", "warning");
      return;
    }

    console.log("Pushing tokens to git", tokens);

    setIsLoading(true);
    try {
      await service.pushTokens(tokens);
      showToast("Tokens pushed successfully to Git!", "success");
      // Refresh history
      if (activeTab === "history") {
        loadCommitHistory();
      }
    } catch (error) {
      console.error("Error pushing to Git:", error);
      showToast(
        `Error pushing to Git: ${error instanceof Error ? error.message : "Check console for details"}`,
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadCommitHistory = async () => {
    const service = useGitHubApi ? githubService : gitService;
    if (!service) return;

    setIsLoading(true);
    try {
      const history = await service.getCommitHistory();
      setCommitHistory(history);
    } catch (error) {
      console.error("Error loading commit history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "history" && (gitService || githubService)) {
      loadCommitHistory();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "tokens":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-16)",
            }}
          >
            {(gitService || githubService) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-8)",
                  padding: "var(--spacing-8)",
                  backgroundColor: "var(--background-secondary)",
                  borderRadius: "var(--spacing-8)",
                }}
              >
                <span className="body-s">Git Method:</span>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={useGitHubApi}
                    onChange={(e) => setUseGitHubApi(e.target.checked)}
                  />
                  <span className="body-s">
                    Use GitHub API (recommended for CORS)
                  </span>
                </label>
              </div>
            )}
            <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
              <button
                type="button"
                data-appearance="secondary"
                onClick={handleGetTokens}
                style={{ flex: 1 }}
              >
                Get Local
              </button>
              {(gitService || githubService) && (
                <button
                  type="button"
                  data-appearance="secondary"
                  onClick={handlePullFromGit}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  {isLoading ? "Pulling..." : "Pull from Git"}
                </button>
              )}
            </div>

            <textarea
              data-appearance="code"
              rows={15}
              className="tokens-textarea"
              value={tokens}
              onChange={handleTokensChange}
              spellCheck={false}
              style={{ width: "100%" }}
            />

            <div style={{ display: "flex", gap: "var(--spacing-8)" }}>
              <button
                type="button"
                data-appearance="primary"
                onClick={handleSetTokens}
                style={{ flex: 1 }}
              >
                Set Local
              </button>
              {(gitService || githubService) && (
                <button
                  type="button"
                  data-appearance="primary"
                  onClick={handlePushToGit}
                  disabled={isLoading}
                  style={{ flex: 1 }}
                >
                  {isLoading ? "Pushing..." : "Push to Git"}
                </button>
              )}
            </div>
          </div>
        );

      case "git-config":
        return (
          <GitConfigComponent
            onConfigSave={handleGitConfigSave}
            currentConfig={gitConfig}
            onShowToast={showToast}
          />
        );

      case "history":
        return (
          <div style={{ padding: "var(--spacing-16)" }}>
            <h3 className="title-s">Commit History</h3>
            {isLoading ? (
              <p className="body-m">Loading...</p>
            ) : commitHistory.length > 0 ? (
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  marginTop: "var(--spacing-12)",
                }}
              >
                {commitHistory.map((commit, index) => (
                  <div
                    key={index}
                    style={{
                      borderBottom: "1px solid var(--foreground-secondary)",
                      padding: "var(--spacing-8) 0",
                    }}
                  >
                    <div
                      className="body-m"
                      style={{ fontWeight: "var(--font-weight-bold)" }}
                    >
                      {commit.message}
                    </div>
                    <div
                      className="body-s"
                      style={{
                        color: "var(--foreground-secondary)",
                        marginTop: "var(--spacing-4)",
                      }}
                    >
                      {commit.author} • {commit.date}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="body-m">No commit history available</p>
            )}
          </div>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--foreground-secondary)",
          backgroundColor: "var(--background-tertiary)",
        }}
      >
        {[
          { id: "tokens" as Tab, label: "Tokens" },
          { id: "git-config" as Tab, label: "Git Config" },
          { id: "history" as Tab, label: "History" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="body-s"
            style={{
              padding: "var(--spacing-8) var(--spacing-16)",
              border: "none",
              background:
                activeTab === tab.id
                  ? "var(--background-primary)"
                  : "transparent",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--accent-primary)"
                  : "2px solid transparent",
              cursor: "pointer",
              color: "var(--foreground-primary)",
              textTransform: "none",
            }}
          >
            {tab.label}
            {tab.id === "git-config" && !gitConfig && (
              <span style={{ color: "var(--error-500)" }}> *</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, padding: "var(--spacing-16)" }}>
        {renderTabContent()}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default App;
