const axios = require('axios');

const checkCommits = async (repo, taskId, token) => {
  try {
    const [owner, repoName] = repo.split('/');
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/commits`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const commits = response.data;
    const matchingCommit = commits.find((commit) =>
      commit.commit.message.includes(taskId)
    );
    return matchingCommit || false;
  } catch (err) {
    console.error('GitHub API error:', err);
    return false;
  }
};

module.exports = { checkCommits };