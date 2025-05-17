# Netlify Troubleshooting Guide

This document provides solutions for common issues encountered when deploying the Quiz Portal on Netlify.

## Redirect and Function Issues

### Invalid Redirect Rules

If you see an error like:
```
Could not parse redirect:
"path" field must not start with "/.netlify"
```

**Solution:**
- Remove any redirects in `netlify.toml` that start with `/.netlify`
- Use our API routes that start with `/api` instead

### Function Execution Failures

If your functions are returning 500 errors:

1. **Check Netlify Function Logs**:
   - Go to Functions > Your Function > Logs
   - Look for specific error messages

2. **Common Function Issues**:
   - Firebase admin initialization failures due to incorrect credentials
   - Missing environment variables
   - CORS issues

## Environment Variable Issues

### Firebase Admin SDK Initialization Failures

If Firebase Admin SDK fails to initialize:

1. **Check Private Key Format**:
   - Ensure `FIREBASE_PRIVATE_KEY` includes the quotes: `"-----BEGIN PRIVATE KEY-----\nXXX...\n-----END PRIVATE KEY-----\n"`
   - Make sure newlines are properly preserved

2. **Verify Project ID and Client Email**:
   - Double-check that these match your service account file exactly

## Build Failures

### Node.js Version Issues

If you encounter Node.js compatibility errors:

1. **Set Node Version**:
   - Add `NODE_VERSION=16` to environment variables
   - Or update `netlify.toml` to include:
     ```toml
     [build.environment]
       NODE_VERSION = "16"
     ```

### Package Dependency Issues

If builds fail due to package issues:

1. **Check Package Versions**:
   - Make sure dependencies are compatible with Node.js v16
   - Install missing dependencies locally and commit changes

## Client-Side API Connection Issues

If the frontend can't connect to the API:

1. **Check API URL**:
   - Set `REACT_APP_API_URL=/api` for production
   - This works with our redirect rules in `netlify.toml`

2. **Verify Network Requests**:
   - Use browser dev tools to check network requests
   - Look for CORS errors or 404s

## Deployment Checklist

Before deploying:

1. ✅ Remove any `.netlify` paths from redirects
2. ✅ Set `NODE_VERSION=16` in environment variables
3. ✅ Configure all Firebase environment variables correctly
4. ✅ Set `REACT_APP_API_URL=/api`
5. ✅ Ensure `.gitignore` excludes service account keys
