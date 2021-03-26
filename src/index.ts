import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import {} from 'js-yaml';

async function run(): Promise<void> {
  const ghToken = core.getInput('github-token');
  // const configPath = core.getInput('configuration-path');

  const prNumber = getPRNumber();

  if (prNumber == undefined) {
    return;
  }

  const ghClient = getOctokit(ghToken);

  const { data: pullRequest } = await ghClient.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const files = await getPRFiles(ghClient, prNumber);

  return;
}

async function getPRFiles(client: any, prNumber: number): Promise<any> {
  const filesResponse = client.pulls.listFiles.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const files = await client.paginate(filesResponse);

  core.debug('changed files:');
  for (const file of files) {
    core.debug(`   ${file.filename} (${file.status})`);
  }
  return files;
}

function getPRNumber(): number | undefined {
  const pr = context.payload.pull_request;
  if (!pr) {
    return undefined;
  }
  return pr.number;
}

run();
