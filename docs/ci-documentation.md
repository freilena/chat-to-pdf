# Continuous Integration Documentation

## Overview

The Chat-To-PDF project uses GitHub Actions for comprehensive Continuous Integration (CI) and Continuous Deployment (CD). Our CI pipeline ensures code quality, type safety, and functionality across both backend and frontend components.

## CI Pipeline Architecture

### Workflow Files

#### 1. Main CI Pipeline (`ci.yml`)
**Location**: `.github/workflows/ci.yml`  
**Purpose**: Comprehensive quality checks for all code changes

**Trigger Events**:
- Push to any branch
- Pull requests
- Push to main branch

**Jobs** (6 parallel jobs):
1. **Backend Linting** - Code style and quality
2. **Backend Type Checking** - Static type analysis
3. **Backend Tests** - Unit and integration tests
4. **Frontend Linting** - Code style and quality
5. **Frontend Type Checking** - TypeScript validation
6. **Frontend Tests** - Unit and integration tests

#### 2. Pylint Analysis (`pylint.yml`)
**Location**: `.github/workflows/pylint.yml`  
**Purpose**: Detailed Python code analysis

**Trigger Events**:
- Push to any branch (Python files only)
- Pull requests (Python files only)

**Job**: Python Code Analysis with detailed reports

## Detailed Job Specifications

### Backend Jobs

#### Backend Linting
- **Tool**: Ruff (fast Python linter)
- **Python Version**: 3.11
- **Dependencies**: Installed from `api/requirements.txt`
- **Command**: `ruff check .`
- **Working Directory**: `./api`
- **Caching**: Pip dependencies cached

#### Backend Type Checking
- **Tool**: MyPy (static type checker)
- **Python Version**: 3.11
- **Dependencies**: Installed from `api/requirements.txt`
- **Command**: `mypy app`
- **Working Directory**: `./api`
- **Caching**: Pip dependencies cached

#### Backend Tests
- **Tool**: Pytest (testing framework)
- **Python Version**: 3.11
- **Dependencies**: Installed from `api/requirements.txt`
- **Command**: `pytest tests/ -v`
- **Working Directory**: `./api`
- **Caching**: 
  - Pip dependencies cached
  - Hugging Face embedding model cached (`~/.cache/huggingface`)
- **Test Count**: 32 tests
- **Coverage**: PDF processing, embeddings, search, API endpoints

### Frontend Jobs

#### Frontend Linting
- **Tool**: ESLint (JavaScript/TypeScript linter)
- **Node Version**: 20
- **Dependencies**: Installed via `npm ci`
- **Command**: `npm run lint`
- **Working Directory**: `./web`
- **Caching**: NPM dependencies cached

#### Frontend Type Checking
- **Tool**: TypeScript Compiler
- **Node Version**: 20
- **Dependencies**: Installed via `npm ci`
- **Command**: `npx tsc --noEmit`
- **Working Directory**: `./web`
- **Caching**: NPM dependencies cached

#### Frontend Tests
- **Tool**: Vitest (testing framework)
- **Node Version**: 20
- **Dependencies**: Installed via `npm ci`
- **Command**: `npm run test`
- **Working Directory**: `./web`
- **Caching**: NPM dependencies cached
- **Test Count**: 3 tests
- **Coverage**: API routes, components, page functionality

### Pylint Analysis Job

#### Python Code Analysis
- **Tool**: Pylint (comprehensive Python analyzer)
- **Python Version**: 3.11
- **Dependencies**: Installed from `api/requirements.txt` + pylint
- **Command**: `pylint app/ --output-format=text --reports=y`
- **Working Directory**: `./api`
- **Caching**: Pip dependencies cached
- **Output**: Detailed reports with code quality metrics

## Performance Characteristics

### Runtime Performance
- **First Run**: ~5 minutes (cache warming)
- **Subsequent Runs**: ~3-4 minutes (with caching)
- **Parallel Execution**: All jobs run simultaneously
- **Cache Hit Rate**: High (dependencies rarely change)

### Resource Usage
- **Runner**: Ubuntu Latest (GitHub-hosted)
- **Concurrent Jobs**: 6 parallel jobs
- **Memory**: Standard GitHub Actions limits
- **Storage**: Cached dependencies and models

## Caching Strategy

### Dependency Caching
- **Backend**: Pip cache keyed by `api/requirements.txt`
- **Frontend**: NPM cache keyed by `web/package-lock.json`
- **Cache Duration**: 7 days (GitHub default)

### Model Caching
- **Embedding Model**: `all-MiniLM-L6-v2` (~80MB)
- **Cache Location**: `~/.cache/huggingface`
- **Cache Key**: `${{ runner.os }}-huggingface-all-MiniLM-L6-v2`
- **Benefit**: Avoids re-downloading model on every run

## CI Status and Behavior

### Merge Requirements
- **Status**: Informational only
- **Blocking**: No (can merge even if checks fail)
- **Future**: Can be configured to block merges if needed

### Notifications
- **Primary**: GitHub UI (Actions tab, PR status)
- **Email**: Optional (user-configurable)
- **Slack/Teams**: Not configured (can be added)

### Failure Handling
- **Retry Policy**: Manual re-run available
- **Partial Failures**: Individual jobs can fail independently
- **Debugging**: Full logs available in GitHub Actions UI

## Monitoring and Maintenance

### Health Monitoring
- **Success Rate**: Tracked via GitHub Actions metrics
- **Runtime Trends**: Monitor for performance regressions
- **Cache Efficiency**: Monitor cache hit rates

### Maintenance Tasks
- **Dependency Updates**: Update action versions quarterly
- **Python/Node Updates**: Update versions as needed
- **Cache Cleanup**: Automatic (GitHub manages)

## Troubleshooting

### Common Issues

#### Backend Tests Fail with "Model Not Found"
- **Cause**: Embedding model cache miss
- **Solution**: Re-run the job (model will be cached)
- **Prevention**: Model caching is configured

#### Frontend Type Checking Fails
- **Cause**: Missing `next-env.d.ts` or TypeScript config issues
- **Solution**: Ensure `next-env.d.ts` is committed
- **Prevention**: TypeScript config validation

#### Linting Failures
- **Cause**: Code style violations
- **Solution**: Run locally first to fix issues
- **Commands**:
  - Backend: `cd api && ruff check .`
  - Frontend: `cd web && npm run lint`

#### Dependency Installation Failures
- **Cause**: Network issues or dependency conflicts
- **Solution**: Check `requirements.txt` and `package.json`
- **Prevention**: Regular dependency updates

### Debugging Commands

#### Local Testing (Backend)
```bash
cd api
pip install -r requirements.txt
ruff check .
mypy app
pytest tests/ -v
```

#### Local Testing (Frontend)
```bash
cd web
npm ci
npm run lint
npx tsc --noEmit
npm run test
```

## Future Enhancements

### Tier 2: Docker Build Validation
- **Purpose**: Verify Docker images build successfully
- **Trigger**: PRs to main only
- **Runtime**: ~10-15 minutes with caching
- **Jobs**: Build `Dockerfile.api` and `Dockerfile.web`

### Security Scanning
- **Tools**: `pip-audit`, `npm audit`
- **Schedule**: Weekly runs
- **Purpose**: Dependency vulnerability scanning

### Integration Tests
- **Purpose**: End-to-end testing with full stack
- **Trigger**: Main branch after merge
- **Runtime**: ~15-20 minutes
- **Setup**: Full docker-compose stack

### Performance Testing
- **Purpose**: Load testing and performance regression detection
- **Trigger**: Scheduled runs
- **Tools**: Custom performance benchmarks

## Configuration Management

### Environment Variables
- **GitHub Secrets**: Not currently used
- **Environment-Specific**: Not configured
- **Future**: Can add environment-specific configurations

### Branch Protection Rules
- **Current**: Not enforced
- **Optional**: Can be enabled to require CI checks
- **Configuration**: GitHub repository settings

## Best Practices

### Development Workflow
1. **Local Testing**: Run tests locally before pushing
2. **Incremental Commits**: Small, focused commits
3. **PR Reviews**: Use CI status in PR reviews
4. **Merge Strategy**: Consider CI status before merging

### Code Quality
1. **Linting**: Fix linting issues immediately
2. **Type Safety**: Maintain strict type checking
3. **Test Coverage**: Maintain comprehensive test suite
4. **Documentation**: Keep CI docs updated

### Performance Optimization
1. **Cache Efficiency**: Monitor cache hit rates
2. **Dependency Management**: Keep dependencies up to date
3. **Job Optimization**: Monitor job runtimes
4. **Resource Usage**: Optimize resource consumption

---

*This documentation is maintained alongside the CI configuration. Update this file when making changes to the CI pipeline.*
