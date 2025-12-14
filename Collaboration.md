GitHub Collaboration Guide for Beginners

## 1. Branch Naming Conventions

- **Feature Branches:**  
  Use the prefix `feat/` for new features.  
  Example: `feat/login-page`

- **Bugfix Branches:**  
  Use the prefix `fix/` for bug fixes.  
  Example: `fix/navbar-overlap`

## 2. Workflow Steps

### Step 1: Fork and Clone

- **Fork** the repository to your own GitHub account (if you don’t have write access).
- **Clone** your fork to your local machine:
  ```sh
  git clone https://github.com/<your-username>/<repo-name>.git
  cd <repo-name>
  ```

### Step 2: Create a Branch

- Always create a new branch for each feature or fix:
  ```sh
  git checkout -b feat/your-feature-name
  # or
  git checkout -b fix/your-bug-description
  ```

### Step 3: Pull Before You Code

- Before you start working, **pull the latest changes** from the main branch to avoid conflicts:
  ```sh
  git checkout dev
  git pull origin dev
  git checkout feat/your-feature-name
  git merge dev
  ```
- Resolve any merge conflicts if they appear.

### Step 4: Make Your Changes

- Edit, add, or delete files as needed for your feature or fix.

### Step 5: Stage and Commit

- Stage your changes:
  ```sh
  git add .
  ```
- Write a clear commit message:
  ```sh
  git commit -m "feat: add login page"  # For features
  git commit -m "fix: correct navbar overlap issue"  # For fixes
  ```

### Step 6: Pull Again Before Pushing

- **Always pull the latest main branch again before pushing**, in case others have made changes:
  ```sh
  git checkout dev
  git pull origin dev
  git checkout feat/your-feature-name
  git merge dev
  ```
- Fix any conflicts if needed.

### Step 7: Push Your Branch

- Push your branch to GitHub:
  ```sh
  git push origin feat/your-feature-name
  # or
  git push origin fix/your-bug-description
  ```

### Step 8: Make a Pull Request (PR)

- Go to your repository on GitHub.
- Click **"Compare & pull request"**.
- Fill in the PR title and description:
  - What does your change do?
  - Any context or screenshots?
- Assign reviewers if needed.
- Submit the PR.

### Step 9: Respond to Feedback

- Make changes as requested by reviewers.
- Push updates to your branch; they’ll appear in the PR automatically.

### Step 10: Merge

- Once approved, merge your PR (or let a maintainer do it).
- Delete your branch after merging to keep things tidy.

---

## Quick Tips

- **Commit often:** Small, focused commits are easier to review.
- **Pull frequently:** Always pull before you start and before you push.
- **Write clear messages:** Use `feat:` for features, `fix:` for bug fixes.
