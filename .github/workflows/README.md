# GitHub Actions Workflows

This directory contains CI/CD workflows for the Property Management System.

## Workflows

### 1. CI Pipeline (`ci.yml`)

Main continuous integration pipeline that runs on:
- Pull requests to `main`, `develop`, or `feature/**` branches
- Pushes to `main` and `develop` branches

**Jobs:**
- **Lint & Type Check**: Runs ESLint and TypeScript type checking
- **Build**: Builds the Next.js application
- **Test**: Runs test suite (when tests are added)
- **Security Audit**: Runs `npm audit` for dependency vulnerabilities
- **Database Migration Check**: Validates SQL migration files
- **Workflow Summary**: Generates a summary of all job results

### 2. Workflow System Tests (`workflow-tests.yml`)

Specialized workflow that validates the workflow system implementation. Runs on:
- Pull requests that modify workflow-related files
- Pushes to `main` and `develop` that modify workflow files

**Jobs:**
- **Workflow Schema Validation**: Validates SQL schema for workflow system
- **Workflow Actions Validation**: Type checks and validates workflow server actions
- **Workflow UI Validation**: Type checks and validates workflow UI components

## Workflow Triggers

### Pull Request Workflow
The CI pipeline automatically runs when:
- A pull request is opened
- A pull request is updated (new commits pushed)
- A pull request is synchronized (rebased/merged)

### Push Workflow
The CI pipeline runs on direct pushes to:
- `main` branch
- `develop` branch

## Required Secrets

The following secrets should be configured in GitHub repository settings:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Local Testing

You can test the CI pipeline locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or download from https://github.com/nektos/act/releases

# Run the CI workflow
act pull_request

# Run a specific job
act -j lint-and-typecheck
```

## Adding New Workflows

When adding new workflows:

1. Create a new `.yml` file in `.github/workflows/`
2. Follow the existing workflow structure
3. Add appropriate triggers (pull_request, push, etc.)
4. Document the workflow in this README
5. Test locally using `act` before committing

## Workflow Status Badges

Add these badges to your README.md:

```markdown
![CI Pipeline](https://github.com/Exela-Tech/Propeerty_Management/workflows/CI%20Pipeline/badge.svg)
![Workflow System Tests](https://github.com/Exela-Tech/Propeerty_Management/workflows/Workflow%20System%20Tests/badge.svg)
```
