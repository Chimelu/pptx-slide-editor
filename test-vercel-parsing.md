# Testing Vercel PPTX Parsing - Debug Guide

## 🚀 **Latest Deployment URL:**
```
https://pptxparser-ey3bvwrjx-deans-projects-50cc7ae5.vercel.app
```

## 🔍 **Step 1: Test Basic Endpoints**

### Health Check:
```bash
curl https://pptxparser-ey3bvwrjx-deans-projects-50cc7ae5.vercel.app/api/health
```

### Test Endpoint:
```bash
curl https://pptxparser-ey3bvwrjx-deans-projects-50cc7ae5.vercel.app/api/test
```

## 📁 **Step 2: Test with Small PPTX File**

### Requirements:
- **File size**: Must be under 1MB (due to Hobby plan limits)
- **File type**: Valid PPTX format
- **Complexity**: Simple 1-2 slide presentation

### Test File Creation:
1. Create a simple PowerPoint with 1-2 slides
2. Add minimal text content
3. Save as PPTX
4. Check file size (should be < 1MB)

## 🧪 **Step 3: Monitor Vercel Logs**

### View Real-time Logs:
```bash
vercel logs --follow
```

### View Specific Deployment Logs:
```bash
vercel logs https://pptxparser-ey3bvwrjx-deans-projects-50cc7ae5.vercel.app
```

## 🐛 **Step 4: Debug Common Issues**

### If you get "Error parsing PPTX file":

1. **Check Vercel logs** for detailed error messages
2. **Verify file size** is under 1MB
3. **Check file format** is valid PPTX
4. **Look for specific error details** in the response

### Expected Error Response Format:
```json
{
  "error": "Failed to parse PPTX file",
  "details": "Specific error message",
  "timestamp": "2024-01-XX...",
  "environment": "production",
  "runtime": "nodejs"
}
```

## 🔧 **Step 5: Troubleshooting**

### Memory Issues:
- Error: "Parsing failed due to memory constraints"
- Solution: Use smaller file (< 1MB)

### Timeout Issues:
- Error: "Parsing timeout - function took too long"
- Solution: Use simpler PPTX file

### File Format Issues:
- Error: "Invalid PPTX file: missing ppt/ directory"
- Solution: Ensure file is valid PPTX format

## 📊 **Step 6: Compare Local vs Vercel**

### Local Success, Vercel Failure:
1. Check file size limits (local: no limit, Vercel: 1MB)
2. Check memory usage in logs
3. Look for timeout issues
4. Verify Node.js compatibility

## 🎯 **Step 7: Test Commands**

### Test with curl:
```bash
curl -X POST \
  -F "file=@your-file.pptx" \
  https://pptxparser-ey3bvwrjx-deans-projects-50cc7ae5.vercel.app/api/pptx/parse
```

### Test with browser:
1. Open your app URL
2. Upload a small PPTX file
3. Check browser console for errors
4. Check Vercel logs for server errors

## 📝 **Step 8: Report Results**

After testing, report:
1. **File size** used
2. **Error message** received
3. **Vercel logs** output
4. **Browser console** errors
5. **Whether health/test endpoints work**

## 🚨 **Common Vercel Hobby Plan Limitations:**

- **Memory**: 2048MB max
- **File size**: 1MB limit (conservative)
- **Timeout**: 60 seconds max
- **Concurrent executions**: Limited

## 💡 **Next Steps if Parsing Still Fails:**

1. **Upgrade to Pro plan** for higher limits
2. **Implement client-side parsing** for small files
3. **Use external parsing service**
4. **Optimize PPTX files** before upload
