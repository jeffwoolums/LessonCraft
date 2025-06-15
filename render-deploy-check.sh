#!/bin/bash

echo "==== Render Deploy Pre-Check ===="

# Check Git status
git status

# Check for untracked files
echo "==== Untracked files check ===="
git ls-files --others --exclude-standard

# Check for casing conflicts (Linux-safe)
echo "==== Case sensitivity check ===="
git ls-files | grep -i prompt

# Confirm you're on main branch
echo "==== Branch check ===="
git branch --show-current

echo "==== Remote check ===="
git remote -v

echo "==== IF CLEAN: You are safe to deploy to Render ===="
