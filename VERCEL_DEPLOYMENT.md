# Vercel Deployment Checklist

## Before Deploying

1. **Commit all changes**:

   ```bash
   git add .
   git commit -m "Fix Vercel parsing issues with better error handling and configuration"
   git push
   ```

2. **Verify configuration files**:
   - ✅ `vercel.json` exists with function timeout settings
   - ✅ `next.config.js` has `output: 'standalone'` and serverless polyfills
   - ✅ All API routes have proper error handling

## Deploy to Vercel

1. **Deploy using Vercel CLI**:

   ```bash
   vercel --prod
   ```

2. **Or deploy via GitHub integration** (push to main branch)

## After Deployment

1. **Test health endpoint**:

   ```
   https://your-app.vercel.app/api/health
   ```

   Should return: `{"status":"healthy","timestamp":"...","environment":"production","runtime":"nodejs"}`

2. **Check Vercel function logs**:

   ```bash
   vercel logs --follow
   ```

3. **Test with a small PPTX file** (under 4MB):
   - Upload a simple 1-2 slide presentation
   - Check browser console for any errors
   - Check Vercel function logs for parsing details

## Troubleshooting

### If parsing still fails:

1. **Check file size**: Ensure PPTX is under 4MB
2. **Check Vercel logs**: Look for specific error messages
3. **Test health endpoint**: Verify API is accessible
4. **Check function timeout**: Ensure `maxDuration: 60` is set

### Common Vercel Issues:

- **Function timeout**: Increase `maxDuration` in `vercel.json`
- **Memory limits**: Check `NODE_OPTIONS` in `vercel.json`
- **Node.js compatibility**: Ensure `runtime: 'nodejs'` in API routes

### Debug Commands:

```bash
# Check Vercel deployment status
vercel ls

# View function logs
vercel logs --follow

# Check function configuration
vercel inspect

# Redeploy if needed
vercel --prod --force
```

## Expected Behavior

After successful deployment:

- ✅ Health endpoint returns 200
- ✅ PPTX parsing works for files under 4MB
- ✅ Detailed logs appear in Vercel function logs
- ✅ No timeout or memory errors

## Next Steps

If parsing works:

1. Test with larger files (up to 4MB limit)
2. Monitor Vercel usage and costs
3. Consider implementing file size optimization

If parsing still fails:

1. Check Vercel logs for specific error details
2. Consider implementing client-side parsing for small files
3. Contact Vercel support for serverless function issues
