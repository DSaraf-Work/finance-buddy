# README Version Control System - Quick Reference

## 📋 Overview

Finance Buddy uses a **version-controlled documentation system** to keep README.md synchronized with codebase changes while preventing unnecessary updates.

## 🎯 Key Principle

**README.md is ONLY updated when explicitly requested by the user.**

## 📁 Files

1. **README.md** - Main documentation (no version metadata inside)
2. **README-version.md** - Version control metadata and complete history
3. **AGENTS.md** - Contains the full version control protocol

## 🔄 How to Update README

### User Commands

To update README, use one of these commands:

```bash
"update README"
"refresh README documentation"
"sync README with latest changes"
"update README version"
"regenerate README"
```

### What Happens

1. **Analysis**: AI analyzes all changes since last README update
2. **Summary**: Shows you what changed and what needs updating
3. **Confirmation**: Asks for your approval before making changes
4. **Update**: Updates relevant sections in README.md
5. **Version**: Increments version number appropriately
6. **History**: Adds entry to README-version.md

## 📊 Version Numbering

- **Major (X.0.0)**: Breaking changes, removed features
- **Minor (1.X.0)**: New features, enhancements
- **Patch (1.0.X)**: Bug fixes, documentation improvements

## ✅ Current Status

**Version**: v1.0.0  
**Last Updated**: 2025-11-02T14:35:00Z  
**Commit SHA**: 357d180  

## 🚫 What NOT to Do

README will **NOT** auto-update when:
- Implementing features
- Fixing bugs
- Updating dependencies
- Changing configuration
- Refactoring code
- Making any code changes

## 📖 Full Documentation

See `README-version.md` for:
- Complete version history
- Detailed update process
- Validation checklist
- Example scenarios

See `AGENTS.md` section "README Version Control Protocol" for:
- Complete AI agent instructions
- Step-by-step update process
- Troubleshooting guide

## 🎨 Example Update Flow

```
User: "update README"

AI: 
📋 README Update Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Version: v1.0.0
Latest Commit: abc1234

Detected Changes:
  ✨ New Features: 3
  🔧 API Changes: 5
  📦 Dependencies: 2

Suggested Version: v1.1.0

Sections to Update:
  ✅ Key Features
  ✅ API Endpoints
  ✅ Tech Stack
  ✅ Changelog

Proceed with README update? (y/n)

User: "y"

AI: [Updates README.md and README-version.md]
✅ README updated to v1.1.0
```

## 🔍 Check Version History

View all README versions:
```bash
cat README-version.md
```

View current version:
```bash
head -10 README-version.md
```

## 🛠️ Maintenance

The version control system is self-maintaining. Just remember:
- Only request updates when you want documentation refreshed
- Review the summary before confirming updates
- Check README-version.md to see what changed

---

**Last Updated**: 2025-11-02T14:35:00Z

