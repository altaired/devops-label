# DevOps course PR Validator

A Github Action for labeling and validating pull requests containing contribution proposals in the course DD2476 at KTH, Sweden.

The action does the following:
* Checks that only a single category is modified on each checked PR
* Checks that only a single folder in that category is modified
* That the naming structure of the authors folder holds, e.g 'name1-name2'
* If the PR is a proposal or not and assign a label if it is a proposal
* Fetches statistics of all pull requests with the proposal label



## Usage
Example of how to include the action in your workflow, the action is made to be run upon each pull request.
```
name: Validate and label PR
  id: vlpr
  uses: altaired/devops-label@v1.1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    configuration-path: .github/config.yml
```

### Inputs
#### `github-token`
An API token with push access, I recommend setting it to `${{ secrets.GITHUB_TOKEN }}`, which is the token of the github action bot.

#### `configuration-path`
The path to the configuration file

### Configuration file
In order for the action to work, a configuration file is **required**. The structure of the file is as follows:

A complete example of a configuration file can be found [here](./.github/config.yml)

```
issue: <issue_number>
dir: <directory>
categories:
  <label_name>:
    suffix: <glob_suffix>
    proposal: <proposal_filename>
    folder: <folder_glob>
    glob: <category_glob>
```
The required `<parameter>` are as folows:
#### `<issue_number>`
The number of the issue where to post the proposal statistics

#### `<directory>`
A glob for telling what directories to account for. Set to `"**"` to run for all files.

#### `<label_name>`
The name of the label

#### `<glob_suffix>`
A glob that is enforced on all children in the authors contribution folder.

Set to `"*"` to not allow folders to be created.

Set to `"**"` to allow any files / folders

#### `<proposal_file>`
A glob describing the proposal file, for the devops course, `README.md` is used

#### `<folder_glob>`
A glob describing the structure of the author folder

For the course the following is used `+([a-zA-Z])?(-+([a-zA-Z]))`, allowing max 2 persons.

To allow max 3 persons, use the folowing `+([a-zA-Z])?(-+([a-zA-Z]))?(-+([a-zA-Z]))`

#### `<category_glob>`
A glob for matching the category, i.e the folder structure up until and not including the authors folder.

E.g. `demo/contributions/presentation/week[1-9]/`

## Development
The action is build with *Node.js*, *Typescript* and tested with *Jest*.

After cloning the repository, run:
`npm install` to install all dependencies.

Some functionality is tested with *Jest* and these tests can be run using `npm run test`


**IMPORTANT**
In order for this action to be used without having to install dependencies and building it every time in other repositories, the action is built and compiled in the dist folder. This has to be done manually before each push. Use the command `npm run build` for this.

## License Summary
This code is made available under the MIT license.

## Authors
Simon Persson, simon@persson.dev



