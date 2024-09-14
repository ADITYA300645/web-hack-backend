import express from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import axios from 'axios';
import { User } from '../model/user.model.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();


let repoData;
// GitHub authentication route
router.get('/', 
  passport.authenticate('github', { scope: ['repo', 'user'] })
);

// Callback route for GitHub to redirect to after authentication
router.get('/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req, res) => {
    // res.redirect('http://localhost:8000/auth/github/repos');  // Redirect to a route after successful login
    res.redirect('https://web-hack-backend.vercel.app/auth/github/repos');  // Redirect to a route after successful loginkasdklf
  }
);

router.get("/accessToken",(req,res)=>{
  console.log("object");
  res.json({accessToken : req.user.accessToken});
})

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
   repoData = response.data;
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/repoData', (req,res)=>{
  if(!repoData){
    throw new ApiError(501, "no data in repo")
  }
  return res.json(repoData);
})

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

let repoD; 
let ownerD;
// router.get('/getRepoFile', async (req, res)=>{
//   const owner = req.headers['owner'];  // accessing custom 'owner' header
//   const repo = req.headers['repo']; 

// })
// New route to get repository structure and contents
router.get('/getStructureRepo', async (req, res) => {
  //  ownerD = req.headers['owner'];
  //  repoD = req.headers['repo'];\
  const owner = req.query.owner;
  const repo = req.query.repo;

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

//


// Recursive function to traverse folders and fetch file contents
async function getRepoStructure(token, owner, repo, path = '') {
  const url = `https://api.github.com/repos/${ownerD}/${repoD}/contents/${path}`;
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
