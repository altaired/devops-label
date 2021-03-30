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
    console.log('invalid pr number');
    return false;
  }

  const ghClient = getOctokit(ghToken);
  const files = await getPRFiles(ghClient, prNumber);

  console.log('parsing configuration file...');
  const config = await getConfiguration(ghClient, configPath);
  const { categories, issue, dir } = config;

  // Only continue if all files are in the specified path
  if (!files.map((file: any) => file.filename).every((file: string) => minimatch(file, dir))) {
    console.log('files outside config directory');
    return false;
  }

  const label = checkCategoryLabel(files, categories);
  if (label != undefined) {
    await addLabel(ghClient, prNumber, label);
  } else {
    setFailed('no single match found, make sure only one category is modified');
    return false;
  }

  const addProposalLabel = shouldHaveProposalLabel(files, categories[label]);
  if (addProposalLabel) {
    console.log('pr is a new proposal, adding label');
    addLabel(ghClient, prNumber, 'proposal');
  }
  return true;
}

async function addLabel(client: any, prNumber: number, label: string): Promise<boolean> {
  const current = await client.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
  });

  const { data } = current;
  const labels: string[] = data.map((label: any) => label.name);
  console.log(`current labels: [${labels.join(', ')}]`);

  await client.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: [...labels, label],
  });
  return true;
}

function setFailed(error: string): void {
  core.setFailed(error);
}

export function checkCategoryLabel(files: any[], categories: any): string | undefined {
  for (let category in categories) {
    if (files.length > 0) {
      const { glob, suffix, folder } = categories[category];
      const sameCategory = files.every((file) => minimatch(file.filename, `${glob}${folder}/${suffix}`));
      const sameDirectory = checkSameDirectory(files, categories[category]);
      if (sameCategory && sameDirectory) {
        console.log(`matched with label ${category}`);
        return category;
      }
    }
  }
  console.log('no match found');
  return undefined;
}

export function checkSameDirectory(files: any[], category: any): boolean {
  const { glob, folder } = category;
  const filenames = files.map((file) => file.filename.split('/'));
  const first = filenames[0];
  const prefix: string[] = `${glob}${folder}`.split('/');
  const length = prefix.length;
  for (let filename of filenames) {
    for (let i = 0; i < length; i++) {
      if (first[i] !== filename[i]) {
        return false;
      }
    }
  }
  return true;
}

export function shouldHaveProposalLabel(files: any[], category: any): boolean {
  const { glob, folder, proposal } = category;
  // Checks if the pr includes an added file by the name of category.proposal
  return files.some((file) => file.status === 'added' && minimatch(file.filename, `${glob}${folder}/${proposal}`));
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
