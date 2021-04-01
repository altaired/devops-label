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
  categories: { category: string; open: number; closed: number; total: number }[];
}

type Github = InstanceType<typeof GitHub>;

async function run(): Promise<boolean> {
  // Fetching action inputs
  const ghToken: string = core.getInput('github-token');
  const configPath: string = core.getInput('configuration-path');
  const prNumber: number | undefined = getPullRequestNumber();

  // Check the the PR has a number, if not, it is probably an issue and not a PR
  if (prNumber == undefined) {
    core.setFailed('invalid pr number');
    return false;
  }

  // Gets the octokit client and the files of the pull request
  const ghClient: Github = getOctokit(ghToken);
  const files = await getPullRequestFiles(ghClient, prNumber);

  // Loads the provided configuration
  const config: any = await getConfiguration(ghClient, configPath);
  if (config == undefined) {
    core.setFailed('no configuration provided');
    return false;
  }
  const { categories, issue, dir } = config;

  // Check that the pr only contain files in the target dir, otherwise cancel
  if (!files.map((file: any) => file.filename).every((file: string) => minimatch(file, dir))) {
    return false;
  }

  // Determine what category this PR is modifing and make sure only that category is modified
  const label = checkCategoryLabel(files, categories);
  if (label != undefined) {
    await addLabel(ghClient, prNumber, label);
  } else {
    core.setFailed('no distinct match found, make sure only one category is modified');
    return false;
  }

  // Check if the proposal file was added in this PR, if so, add the proposal label as well
  const proposalLabel = shouldHaveProposalLabel(files, categories[label]);
  if (proposalLabel) {
    await addLabel(ghClient, prNumber, 'proposal');
  }

  // Retrive and generate a summary of all proposals in the repository
  const stats: ProposalStatistics | undefined = await getProposalStatistics(ghClient, categories);
  if (stats !== undefined) {
    await publishProposalStatistics(ghClient, issue, stats);
  }

  return true;
}

/**
 * Retrives the current labels of a given pull request and adds the specified label
 * @param client The Octokit client
 * @param prNumber The number of the pull request to update
 * @param label The label to add
 * @returns True if all requests succeeded
 */
async function addLabel(client: Github, prNumber: number, label: string): Promise<boolean> {
  try {
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
  } catch (error) {
    core.setFailed('failed to add label');
    return false;
  }
}

/**
 * Retrieves statiscicts for all provided categories.
 * The statistics include the number of open and closed pull requests.
 * @param client The Octokit client
 * @param categories The categories to fetch stats for
 * @returns A promise of ProposalStatistics or undefined (if error occured)
 */
async function getProposalStatistics(client: Github, categories: any): Promise<ProposalStatistics | undefined> {
  try {
    const cat = await Promise.all(
      Object.keys(categories).map(async (category) => {
        const openPRs = await search(client, category, true, false);
        const closedPRs = await search(client, category, false, true);
        const [open, closed] = [openPRs, closedPRs].map((res) => res.data.total_count);
        return {
          category,
          open: open,
          closed: closed,
          total: open + closed,
        };
      })
    );
    console.log(cat);
    return {
      categories: cat,
    };
  } catch (error) {
    core.setFailed('failed to get proposal statistics');
    return undefined;
  }
}

/**
 * Updates the target issue with the passed proposal statistics
 * @param client The Octokit client
 * @param issue The number of the issue to update
 * @param stats The proposal statistics
 * @returns A promise of void when complete
 */
async function publishProposalStatistics(client: Github, issue: number, stats: ProposalStatistics): Promise<void> {
  await client.issues.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: issue,
    body: generateStatisticsBody(stats),
    labels: ['generated'],
  });
  return;
}

/**
 * Generates a markdown string based on given proposal statistics
 * @param stats The statistics
 * @returns A markdown formatted string
 */
function generateStatisticsBody(stats: ProposalStatistics): string {
  const tableRows = stats.categories
    .map((category) => {
      return `|${category.category}|${category.open}|${category.closed}|${category.total}|`;
    })
    .join('\n');
  return `
  # Generated proposal summary
  updated: ${new Date().toISOString()}

  | Category      | Open PRs      | Closed PRs  | Total |
  | ------------- |:-------------:| -----------:| -----:|
  ${tableRows}
  `;
}

/**
 * Searches for pull requests on github with the given parameters
 * @param client The Octokit client
 * @param category The category label of the PRs
 * @param open If the PRs are open or not
 * @param merged If the PRs are merged or not
 * @returns The raw http response for the Octokit client
 */
async function search(client: Github, category: string, open: boolean, merged: boolean): Promise<any> {
  const paramState: string = open ? 'state:open' : 'state:closed';
  const paramMerged: string = merged ? 'is:merged' : 'is:unmerged';
  const { owner, repo } = context.repo;
  return client.search.issuesAndPullRequests({
    q: `is:pull-request+repo:${owner}/${repo}+label:proposal+label:${category}+${paramState}+${paramMerged}`,
  });
}

/**
 * Checks if the files all are in the same category and the same author folder
 * @param files The files to check
 * @param categories The categories to check for
 * @returns A string if a category was found, otherwise undefined
 */
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

/**
 * Checks if the files are in the same directory, this since the globs only check the format of the usernames
 * and not that they are the same across all files.
 * @param files The files to check
 * @param category The category of the files
 * @returns true if it is the same directory, otherwise false
 */
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

/**
 * Checks if the proposal file is new for this PR, thus, if the proposal label should be added.
 * @param files The files included in the PR
 * @param category The matched category
 * @returns true if the proposal label should be added, otherwise false
 */
export function shouldHaveProposalLabel(files: any[], category: any): boolean {
  const { glob, folder, proposal } = category;
  // Checks if the pr includes an added file by the name of category.proposal
  return files.some((file) => file.status === 'added' && minimatch(file.filename, `${glob}${folder}/${proposal}`));
}

/**
 * Retrieves the files of the targeted pull request
 * @param client The Octokit client
 * @param prNumber The number of the targeted pull request
 * @returns A promise containing the files
 */
async function getPullRequestFiles(client: Github, prNumber: number): Promise<any> {
  const filesResponse = client.pulls.listFiles.endpoint.merge({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return await client.paginate(filesResponse);
}

/**
 * Gets the number of the pull request, if applicable.
 * @returns The PR number, if found, otherwise undefined
 */
function getPullRequestNumber(): number | undefined {
  const pr = context.payload.pull_request;
  if (!pr) {
    return undefined;
  }
  return pr.number;
}

/**
 * Fetches a file from the PR and returns it as a string
 * @param client The Octokit client
 * @param path The path of the file
 * @returns A promise of string
 */
async function fetchFile(client: Github, path: string): Promise<string> {
  const response: any = await client.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: path,
    ref: context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

/**
 * Parses the yaml configuration file from the repository
 * @param client The Octokit client
 * @param configPath The path to the config file
 * @returns A promise of with the configuration, if not found it returns undefined
 */
async function getConfiguration(client: Github, configPath: string): Promise<Configuration | undefined> {
  const configurationContent: string = await fetchFile(client, configPath);
  try {
    return yaml.load(configurationContent) as Configuration;
  } catch (error) {
    return undefined;
  }
}

run();
