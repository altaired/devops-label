import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import * as yaml from 'js-yaml';
import minimatch from 'minimatch';

export interface Configuration {
  issue: number;
  dir: string;
  categories: any;
}

export interface ProposalStatistics {
  total: number;
  open: number;
  closed: number;
  openByCategory: { name: string; count: number }[];
  closedByCategory: { name: string; count: number }[];
}

type Github = InstanceType<typeof GitHub>;

async function run(): Promise<boolean> {
  // Fetching action inputs
  const ghToken: string = core.getInput('github-token');
  const configPath: string = core.getInput('configuration-path');
  const prNumber: number | undefined = getPullRequestNumber();

  if (prNumber == undefined) {
    setFailed('invalid pr number');
    return false;
  }

  const ghClient: Github = getOctokit(ghToken);
  const files = await getPullRequestFiles(ghClient, prNumber);

  const config = await getConfiguration(ghClient, configPath);
  if (config == undefined) {
    setFailed('no configuration provided');
    return false;
  }

  const { categories, issue, dir } = config;

  // Only continue if all files are in the specified path
  if (!files.map((file: any) => file.filename).every((file: string) => minimatch(file, dir))) {
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
    addLabel(ghClient, prNumber, 'proposal');
  }

  await getProposalStatistics(ghClient, categories);
  return true;
}

async function addLabel(client: Github, prNumber: number, label: string): Promise<boolean> {
  const current = await client.issues.listLabelsOnIssue({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
  });

  const { data } = current;
  const labels: string[] = data.map((label: any) => label.name);

  await client.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
    labels: [...labels, label],
  });
  return true;
}

async function getProposalStatistics(client: Github, categories: any): Promise<any> {
  for (let category in categories) {
    const result = await client.search.issuesAndPullRequests({
      q: `is:pull-request+label:proposal+label:${category}`,
    });
    console.log(result);
  }
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
        return category;
      }
    }
  }
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

async function getPullRequestFiles(client: Github, prNumber: number): Promise<any> {
  const filesResponse = client.pulls.listFiles.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return await client.paginate(filesResponse);
}

function getPullRequestNumber(): number | undefined {
  const pr = context.payload.pull_request;
  if (!pr) {
    return undefined;
  }
  return pr.number;
}

async function fetchFile(client: Github, path: string): Promise<string> {
  const response: any = await client.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: path,
    ref: context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

async function getConfiguration(client: Github, configPath: string): Promise<Configuration | undefined> {
  const configurationContent: string = await fetchFile(client, configPath);
  try {
    return yaml.load(configurationContent) as Configuration;
  } catch (error) {
    return undefined;
  }
}

run();
