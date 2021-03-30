import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import * as yaml from 'js-yaml';
import minimatch from 'minimatch';

async function run(): Promise<boolean> {
  console.log('fetching inputs...');
  const ghToken = core.getInput('github-token');
  const configPath = core.getInput('configuration-path');

  const prNumber = getPRNumber();

  if (prNumber == undefined) {
    return false;
  }

  const ghClient = getOctokit(ghToken);

  const { data: pullRequest } = await ghClient.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const files = await getPRFiles(ghClient, prNumber);

  const config = await getConfiguration(ghClient, configPath);
  console.log(config);

  const { categories, issue } = config;
  console.log(categories);
  console.log(issue);
  checkCategoryLabel(files, categories);
  return true;
}

function checkCategoryLabel(files: any[], globs: any): string | undefined {
  for (let category in globs) {
    if (files.every((file) => globs[category].some((glob: string) => minimatch(file.filename, glob)))) {
      console.log(`matched with label ${category}`);
    }
  }
  console.log('no match found');
  return undefined;
}

async function getPRFiles(client: any, prNumber: number): Promise<any> {
  const filesResponse = client.pulls.listFiles.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  const files = await client.paginate(filesResponse);

  console.log('changed files:');
  for (const file of files) {
    console.log(`   ${file.filename} (${file.status})`);
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

async function fetchFile(client: any, path: string): Promise<string> {
  const response: any = await client.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: path,
    ref: context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

async function getConfiguration(client: any, configPath: string): Promise<any> {
  const configurationContent: string = await fetchFile(client, configPath);
  try {
    return yaml.load(configurationContent);
  } catch (error) {
    return '';
  }
}

run();
