param (
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

# Read current version
try {
    $package = Get-Content package.json | ConvertFrom-Json
    $currentVersion = $package.version
}
catch {
    Write-Error "Failed to read package.json"
    exit 1
}

# 1. Update package.json version
if ($currentVersion -eq $Version) {
    Write-Host "Version in package.json is already $Version. Skipping update..." -ForegroundColor Yellow
}
else {
    Write-Host "1. Updating package.json to version $Version..." -ForegroundColor Cyan
    # Use call operator & to run npm to handle potential path issues, though typically direct call works
    # --no-git-tag-version prevents npm from creating the tag/commit itself, giving us control
    npm version $Version --no-git-tag-version
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to update package.json version"
        exit 1
    }
}

# 2. Stage changes
Write-Host "2. Staging all changes..." -ForegroundColor Cyan
git add .

# 3. Commit
# Check if there are changes staged for commit
$staged = git diff --cached --name-only
if ($staged) {
    Write-Host "3. Committing changes..." -ForegroundColor Cyan
    git commit -m "Release v$Version"
}
else {
    Write-Host "No changes to commit (clean working tree)." -ForegroundColor Yellow
}

# 4. Create Tag
# Check if tag exists
$tagExists = git tag -l "v$Version"
if ($tagExists) {
    Write-Host "Tag v$Version already exists. Skipping..." -ForegroundColor Yellow
}
else {
    Write-Host "4. Creating tag v$Version..." -ForegroundColor Cyan
    git tag "v$Version"
}

# 5. Push
Write-Host "5. Pushing to GitHub..." -ForegroundColor Cyan
git push origin master
git push origin "v$Version"

Write-Host "`nAll done! 🚀" -ForegroundColor Green
Write-Host "Go to https://github.com/panagiotisspak20-ship-it/sky-express-va/actions to watch the build." -ForegroundColor Green
