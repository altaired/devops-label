# PR Validator for DD2476

A Github Action for labeling and validating pull requests containing contribution proposals in the course DD2476 at KTH, Sweden.

## Get started

### Use the action
 
The action can be included in your action workflow as `altaired/devops-label@v1.1`



Below is an example of a `.github/workflows/main.yml`
```
on: [pull_request]

jobs:
  devops-label:
    runs-on: ubuntu-latest
    name: Pull Request Validator
    steps:
    - name: Validate and label PR
      id: vlpr
      uses: altaired/devops-label@v1.1
      with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          configuration-path: .github/config.yml

```

The action uses two inputs:
```
  github-token: A GitHub token with push access to the repository
  
  configuration-path: Path to the configuration path. If not provided, the default is '.github/config.yml'
```

More about the configuration file can be found further down.

### Development

The action is built using Node.js and Typescript and jest is used for testing. NPM is used for managing packages.

After cloning the repository, install the dependencies using:

```
npm install
```

To run the tests use:
```
npm run test
```

#### Compile the action
In order to use the action it has to be compiled first. This is can be done with NCC, using the following command:
```
npm run build && ncc build --source-map
```

## Configuration
The action requires a configuration file, below is an example of such a file.

```
# The number of the issue where the summary should be written to
issue: 3 

# The action only takes action for files matching this glob pattern
dir: demo/contributions/** 

# Below all categories is specified
categories: 
  course-automation:
  
    # A glob pattern for the files in the authors proposal folder. Set to '*' to not allow folders
    suffix: '**' 
    
    # The name of the proposal file
    proposal: README.md
    
    # Glob for validating the folder account names. This one allows two names in the format 'name1-name2'
    folder: +([a-zA-Z])?(-+([a-zA-Z])) 
    
    # Glob for the base path of the category. Files matching will be labeled with this category
    glob: demo/contributions/course-automation/ 
    
  presentation:
    suffix: '**'
    proposal: README.md
    folder: +([a-zA-Z])?(-+([a-zA-Z]))
    glob: demo/contributions/course-automation/week[1-9]/
  demo:
    suffix: '**'
    proposal: README.md
    folder: +([a-zA-Z])?(-+([a-zA-Z]))
    glob: demo/contributions/demo/
  essay:
    suffix: '**'
    proposal: README.md
    folder: +([a-zA-Z])?(-+([a-zA-Z]))
    glob: demo/contributions/essay/
  executable-tutorial:
    suffix: '**'
    proposal: README.md
    folder: +([a-zA-Z])?(-+([a-zA-Z]))
    glob: demo/contributions/executable-tutorial/
  feedback:
    suffix: '**'
    proposal: README.md
    folder: +([a-zA-Z])?(-+([a-zA-Z]))
    glob: demo/contributions/feedback/
  open-source:
    suffix: '**'
    proposal: README.md
    folder: +([a-zA-Z])?(-+([a-zA-Z]))
    glob: demo/contributions/open-source/
```


