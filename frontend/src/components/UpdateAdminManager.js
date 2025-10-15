import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { 
  RiDownloadLine, 
  RiRefreshLine,
  RiCheckboxCircleLine,
  RiServerLine,
  RiHistoryLine,
  RiSettingsLine,
  RiInformationLine,
  RiGitBranchLine,
  RiStarLine,
  RiEyeLine,
  RiArrowLeftRightLine,
  RiFileTextLine,
  RiFileExcelLine,
  RiDatabaseLine,
  RiShieldCheckLine,
  RiRocketLine,
  RiCheckLine,
  RiAlertLine,
  RiTimeLine,
  RiCodeBoxLine
} from 'react-icons/ri';
import { 
  FaGithub, 
  FaDocker,
  FaSyncAlt,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const GlobalStyles = createGlobalStyle`
  .update-manager {
    --primary-color: #2563eb;
    --primary-dark: #1d4ed8;
    --secondary-color: #1e293b;
    --background-dark: #0f172a;
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-muted: #64748b;
    --border-color: #334155;
    --success-color: #059669;
    --warning-color: #d97706;
    --danger-color: #dc2626;
  }
`;

const Container = styled.div`
  padding: 20px;
  color: var(--text-secondary);
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
`;

const UpdateCard = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 25px;
  border-left: 4px solid var(--primary-color);
`;

const UpdateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const UpdateTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const VersionBadge = styled.span`
  padding: 8px 16px;
  background: ${props => props.$type === 'success' ? '#10b981' : '#f59e0b'};
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: white;
`;

const UpdateInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 5px;
`;

const InfoValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
`;

const ProgressContainer = styled.div`
  margin: 20px 0;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
`;

const Progress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
  width: ${props => props.$percentage || 0}%;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-muted);
`;

const UpdateActions = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;

  ${props => props.$variant === 'primary' && `
    background: var(--primary-color);
    color: white;

    &:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
    }
  `}

  ${props => props.$variant === 'secondary' && `
    background: #6b7293;
    color: white;

    &:hover {
      background: #5a5f7c;
      transform: translateY(-2px);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const GitHubCard = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
  border-left: 4px solid #10b981;
`;

const GitHubHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const GitHubTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const GitHubStats = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
`;

const RepoLink = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  &:hover {
    color: var(--primary-dark);
  }
`;

const GitHubContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const RepoInfo = styled.div`
  background: var(--background-dark);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
`;

const RepoName = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const RepoDescription = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.5;
`;

const RecentActivity = styled.div`
  background: var(--background-dark);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
`;

const ActivityTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--text-primary);
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
`;

const ActivityText = styled.div`
  flex: 1;
  font-size: 14px;
`;

const ActivityTime = styled.div`
  color: var(--text-muted);
  font-size: 12px;
`;

const ChangelogCard = styled.div`
  background: var(--secondary-color);
  border-radius: 12px;
  padding: 25px;
  border-left: 4px solid #f59e0b;
`;

const ChangelogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChangelogTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const VersionSelector = styled.select`
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-size: 14px;
`;

const ChangelogList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ChangelogItem = styled.li`
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
`;

const ChangelogIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-top: 2px;
  flex-shrink: 0;

  ${props => props.$type === 'new' && `
    background: #10b981;
    color: white;
  `}

  ${props => props.$type === 'fix' && `
    background: #3b82f6;
    color: white;
  `}

  ${props => props.$type === 'improve' && `
    background: #f59e0b;
    color: white;
  `}

  ${props => props.$type === 'docker' && `
    background: #2496ed;
    color: white;
  `}
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: var(--primary-color);
  
  &::after {
    content: '';
    width: 20px;
    height: 20px;
    border: 2px solid var(--primary-color);
    border-top: 2px solid transparent;
    border-radius: 50%;
    margin-left: 10px;
    animation: spin 1s linear infinite;
  }
`;

// GitHub API configuration
const GITHUB_REPO = 'gekomod/mcpanel';
const GITHUB_API_BASE = 'https://api.github.com/repos';

function UpdateAdminManager() {
  const { t } = useLanguage();
  const [updateStatus, setUpdateStatus] = useState('checking');
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestVersion, setLatestVersion] = useState('');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [githubData, setGithubData] = useState({
    stars: 0,
    forks: 0,
    watchers: 0,
    description: '',
    lastRelease: null,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [changelog, setChangelog] = useState([]);

  // Pobierz aktualną wersję z systemu
  const getCurrentVersion = async () => {
    try {
      // W prawdziwej aplikacji to powinno być z API systemu
      // Na razie zwracamy pusty string - pobierzemy z GitHub
      return '';
    } catch (error) {
      console.error('Error getting current version:', error);
      return '';
    }
  };

  // Sprawdź czy jest nowsza wersja
  const isNewerVersion = (latest, current) => {
    if (!latest || !current) return false;
    
    // Usuń 'v' z początku jeśli istnieje
    const cleanLatest = latest.replace(/^v/, '');
    const cleanCurrent = current.replace(/^v/, '');
    
    const latestParts = cleanLatest.split('.').map(Number);
    const currentParts = cleanCurrent.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    return false;
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Pobierz aktualną wersję systemu
      const currentVer = await getCurrentVersion();
      
      // Pobierz dane z GitHub
      await loadGitHubData(currentVer);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubData = async (currentVersion) => {
    try {
      console.log('Ładowanie danych z GitHub...');
      
      // Pobieranie informacji o repozytorium
      const repoResponse = await fetch(`${GITHUB_API_BASE}/${GITHUB_REPO}`);
      if (!repoResponse.ok) throw new Error(`GitHub API error: ${repoResponse.status}`);
      const repoData = await repoResponse.json();
      console.log('Repo data:', repoData);
      
      // Pobieranie ostatnich wydań
      const releasesResponse = await fetch(`${GITHUB_API_BASE}/${GITHUB_REPO}/releases`);
      if (!releasesResponse.ok) throw new Error(`GitHub releases error: ${releasesResponse.status}`);
      const releasesData = await releasesResponse.json();
      console.log('Releases data:', releasesData);

      const latestRelease = releasesData[0];
      const latestVersion = latestRelease ? latestRelease.tag_name : null;

      console.log('Latest release:', latestRelease);
      console.log('Latest version:', latestVersion);

      // Jeśli nie mamy aktualnej wersji z systemu, użyj najnowszej z GitHub
      let actualCurrentVersion = currentVersion;
      if (!actualCurrentVersion && latestVersion) {
        actualCurrentVersion = latestVersion;
      }

      setCurrentVersion(actualCurrentVersion || 'unknown');
      setLatestVersion(latestVersion || 'unknown');

      // Sprawdź czy jest nowsza wersja
      const hasUpdate = latestVersion && actualCurrentVersion && isNewerVersion(latestVersion, actualCurrentVersion);
      
      setUpdateStatus(hasUpdate ? 'available' : 'updated');

      // Pobieranie ostatnich commitów
      const commitsResponse = await fetch(`${GITHUB_API_BASE}/${GITHUB_REPO}/commits?per_page=5`);
      const commitsData = await commitsResponse.ok ? await commitsResponse.json() : [];

      setGithubData({
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        watchers: repoData.subscribers_count || 0,
        description: repoData.description || 'Brak opisu',
        lastRelease: latestRelease,
        recentActivity: commitsData.map(commit => ({
          message: commit.commit.message,
          date: commit.commit.author.date,
          author: commit.commit.author.name
        }))
      });

      // Załaduj changelog
      if (latestRelease) {
        const changelogItems = parseChangelog(latestRelease.body);
        setChangelog(changelogItems);
      } else {
        setChangelog([{ type: 'info', title: 'Brak informacji o wydaniach', description: 'Sprawdź repozytorium GitHub dla szczegółów' }]);
      }

      if (hasUpdate) {
        toast.success(`Dostępna nowa wersja ${latestVersion}!`);
      } else if (latestVersion) {
        toast.info(`Masz najnowszą wersję ${latestVersion}`);
      } else {
        toast.info('Brak informacji o wersjach');
      }

    } catch (error) {
      console.error('Error loading GitHub data:', error);
      
      // Pokaż prawdziwy błąd
      setUpdateStatus('error');
      setCurrentVersion('unknown');
      setLatestVersion('unknown');
      
      setGithubData({
        stars: 0,
        forks: 0,
        watchers: 0,
        description: 'Błąd ładowania danych z GitHub',
        lastRelease: null,
        recentActivity: []
      });
      
      setChangelog([{ type: 'info', title: 'Błąd połączenia', description: 'Nie udało się pobrać danych z GitHub' }]);
      
      toast.error(`Błąd: ${error.message}`);
    }
  };

  const parseChangelog = (releaseBody) => {
    if (!releaseBody) return [
      { type: 'info', title: 'Brak changelog', description: 'Sprawdź repozytorium GitHub dla szczegółów zmian' }
    ];
    
    const items = [];
    const lines = releaseBody.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('##')) {
        // Nagłówki sekcji
        items.push({
          type: 'info',
          title: trimmedLine.replace('##', '').trim(),
          description: ''
        });
      } else if (trimmedLine.startsWith('- ')) {
        // Zwykłe punkty listy
        items.push({
          type: 'improve',
          title: trimmedLine.replace('- ', '').trim(),
          description: ''
        });
      }
    });
    
    return items.length > 0 ? items : [
      { type: 'info', title: 'Aktualizacja', description: releaseBody.substring(0, 150) + '...' }
    ];
  };

  const checkForUpdates = async () => {
    try {
      setUpdateStatus('checking');
      await loadGitHubData(currentVersion);
    } catch (error) {
      console.error('Error checking updates:', error);
      setUpdateStatus('error');
      toast.error('Błąd podczas sprawdzania aktualizacji');
    }
  };

  const startUpdate = async () => {
    if (!latestVersion || latestVersion === 'unknown') {
      toast.error('Brak informacji o wersji do aktualizacji');
      return;
    }

    setIsUpdating(true);
    setUpdateProgress(0);

    try {
      // Symulacja procesu aktualizacji
      const interval = setInterval(() => {
        setUpdateProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            
            // Aktualizacja zakończona
            setTimeout(() => {
              setIsUpdating(false);
              setUpdateStatus('updated');
              setCurrentVersion(latestVersion);
              toast.success(`System zaktualizowany do wersji ${latestVersion}!`);
            }, 1000);
            
            return 100;
          }
          return newProgress;
        });
      }, 200);

    } catch (error) {
      console.error('Error during update:', error);
      setIsUpdating(false);
      toast.error('Błąd podczas aktualizacji systemu');
    }
  };

  const getUpdateStatusText = () => {
    switch (updateStatus) {
      case 'checking':
        return 'Sprawdzanie aktualizacji...';
      case 'available':
        return `Dostępna aktualizacja do ${latestVersion}`;
      case 'updated':
        return latestVersion !== 'unknown' ? `Masz najnowszą wersję ${latestVersion}` : 'System aktualny';
      case 'error':
        return 'Błąd sprawdzania aktualizacji';
      default:
        return 'Sprawdzanie...';
    }
  };

  const getUpdateButtonText = () => {
    if (isUpdating) {
      return (
        <>
          <FaSyncAlt className="fa-spin" />
          Trwa aktualizacja...
        </>
      );
    }

    switch (updateStatus) {
      case 'available':
        return (
          <>
            <RiDownloadLine />
            Zainstaluj aktualizację
          </>
        );
      case 'updated':
        return (
          <>
            <RiCheckboxCircleLine />
            System aktualny
          </>
        );
      case 'error':
        return (
          <>
            <RiRefreshLine />
            Spróbuj ponownie
          </>
        );
      default:
        return (
          <>
            <FaSyncAlt className="fa-spin" />
            Sprawdzanie...
          </>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nieznana';
    try {
      return new Date(dateString).toLocaleDateString('pl-PL');
    } catch {
      return 'Nieznana';
    }
  };

  const getTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'dzisiaj';
      if (diffDays === 1) return 'wczoraj';
      if (diffDays < 7) return `${diffDays} dni temu`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} tygodni temu`;
      return `${Math.floor(diffDays / 30)} miesięcy temu`;
    } catch {
      return 'nieznany czas';
    }
  };

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <Container className="update-manager">
          <LoadingSpinner>
            Ładowanie danych z GitHub...
          </LoadingSpinner>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <Container className="update-manager">
        <Header>
          <Title>
            <RiDownloadLine />
            Aktualizacje Panelu
          </Title>
        </Header>

        {/* Karta aktualizacji */}
        <UpdateCard>
          <UpdateHeader>
            <UpdateTitle>{getUpdateStatusText()}</UpdateTitle>
            {latestVersion !== 'unknown' && (
              <VersionBadge $type={updateStatus === 'available' ? 'warning' : 'success'}>
                {latestVersion}
              </VersionBadge>
            )}
          </UpdateHeader>
          
          <UpdateInfo>
            <InfoItem>
              <InfoLabel>Aktualna wersja</InfoLabel>
              <InfoValue>{currentVersion !== 'unknown' ? currentVersion : 'Nieznana'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Najnowsza wersja</InfoLabel>
              <InfoValue>{latestVersion !== 'unknown' ? latestVersion : 'Nieznana'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Data wydania</InfoLabel>
              <InfoValue>
                {githubData.lastRelease ? formatDate(githubData.lastRelease.published_at) : 'Nieznana'}
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <InfoValue style={{ 
                color: updateStatus === 'available' ? '#f59e0b' : '#10b981' 
              }}>
                {updateStatus === 'available' ? 'Dostępna aktualizacja' : 
                 updateStatus === 'updated' ? 'System aktualny' : 
                 updateStatus === 'error' ? 'Błąd' : 'Sprawdzanie...'}
              </InfoValue>
            </InfoItem>
          </UpdateInfo>

          {isUpdating && (
            <ProgressContainer>
              <ProgressInfo>
                <span>Postęp aktualizacji</span>
                <span>{Math.round(updateProgress)}%</span>
              </ProgressInfo>
              <ProgressBar>
                <Progress $percentage={updateProgress} />
              </ProgressBar>
            </ProgressContainer>
          )}
          
          <UpdateActions>
            <Button 
              $variant="primary" 
              onClick={startUpdate}
              disabled={isUpdating || updateStatus !== 'available'}
            >
              {getUpdateButtonText()}
            </Button>
            <Button $variant="secondary" onClick={checkForUpdates}>
              <RiRefreshLine />
              Sprawdź ponownie
            </Button>
          </UpdateActions>
        </UpdateCard>

        {/* Karta GitHub */}
        <GitHubCard>
          <GitHubHeader>
            <FaGithub style={{ fontSize: '24px', color: '#10b981' }} />
            <GitHubTitle>Repozytorium GitHub</GitHubTitle>
          </GitHubHeader>
          
          <GitHubStats>
            <Stat>
              <RiStarLine style={{ color: '#f59e0b' }} />
              <span>{githubData.stars} gwiazdek</span>
            </Stat>
            <Stat>
              <RiGitBranchLine style={{ color: '#3b82f6' }} />
              <span>{githubData.forks} forków</span>
            </Stat>
            <Stat>
              <RiEyeLine style={{ color: '#10b981' }} />
              <span>{githubData.watchers} obserwujących</span>
            </Stat>
          </GitHubStats>

          <GitHubContent>
            <RepoInfo>
              <RepoName>gekomod/mcpanel</RepoName>
              <RepoDescription>
                {githubData.description}
              </RepoDescription>
              <RepoLink href="https://github.com/gekomod/mcpanel" target="_blank">
                <RiArrowLeftRightLine />
                Przejdź do repozytorium
              </RepoLink>
            </RepoInfo>

            <RecentActivity>
              <ActivityTitle>Ostatnia aktywność</ActivityTitle>
              {githubData.recentActivity.length > 0 ? (
                githubData.recentActivity.slice(0, 3).map((activity, index) => (
                  <ActivityItem key={index}>
                    <ActivityIcon>
                      <RiCodeBoxLine />
                    </ActivityIcon>
                    <ActivityText>
                      {activity.message.split('\n')[0].substring(0, 60)}...
                    </ActivityText>
                    <ActivityTime>
                      {getTimeAgo(activity.date)}
                    </ActivityTime>
                  </ActivityItem>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  Brak danych o aktywności
                </div>
              )}
            </RecentActivity>
          </GitHubContent>
        </GitHubCard>

        {/* Karta changelog */}
        <ChangelogCard>
          <ChangelogHeader>
            <ChangelogTitle>
              {latestVersion !== 'unknown' ? `Zmiany w ${latestVersion}` : 'Informacje o wersji'}
            </ChangelogTitle>
          </ChangelogHeader>
          
          <ChangelogList>
            {changelog.map((change, index) => (
              <ChangelogItem key={index}>
                <ChangelogIcon $type={change.type}>
                  {change.type === 'new' && '+'}
                  {change.type === 'fix' && '!'}
                  {change.type === 'improve' && '∿'}
                  {change.type === 'docker' && '⎈'}
                  {change.type === 'info' && 'i'}
                </ChangelogIcon>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {change.title}
                  </div>
                  {change.description && (
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      {change.description}
                    </div>
                  )}
                </div>
              </ChangelogItem>
            ))}
          </ChangelogList>
        </ChangelogCard>
      </Container>
    </>
  );
}

export default UpdateAdminManager;