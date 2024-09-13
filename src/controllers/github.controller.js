import express from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import axios from 'axios';

const router = express.Router();

// GitHub authentication route
router.get('/', 
  passport.authenticate('github', { scope: ['repo', 'user'] })
);

// Callback route for GitHub to redirect to after authentication
router.get('/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:8000/auth/github/repos');  // Redirect to a route after successful login
  }
);

// GET route to fetch repositories of the authenticated user
router.get('/repos', async (req, res) => {
  console.log("hitted repos")
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${req.user.accessToken}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// POST route to deploy a repo
router.post('/deploy', async (req, res) => {
  const { repoName } = req.body;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const deployResponse = await deployRepoToService(req.user.accessToken, repoName);
    res.json({ message: 'Repository is being deployed', deployResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to deploy the repository to a service (example)
async function deployRepoToService(token, repoName) {
  return { success: true, message: `Deploying repo: ${repoName}` };
}

// New route to get repository structure and contents
router.get('/getStructureRepo', async (req, res) => {
  const { owner, repo } = req.query;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const repoStructure = await getRepoStructure(req.user.accessToken, owner, repo);
    res.json(repoStructure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recursive function to traverse folders and fetch file contents
async function getRepoStructure(token, owner, repo, path = '') {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = { Authorization: `token ${token}` };

  const response = await axios.get(url, { headers });
  const repoContent = response.data;

  let files = [];

  for (const item of repoContent) {
    if (item.type === 'file') {
      const fileResponse = await axios.get(item.download_url);
      files.push({
        fileName: item.name,
        content: fileResponse.data
      });
    } else if (item.type === 'dir') {
      const subDirFiles = await getRepoStructure(token, owner, repo, item.path);
      files = files.concat(subDirFiles);
    }
  }

  return files;
}

export default router;
