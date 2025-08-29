# Testing Vercel PPTX Parsing - Debug Guide

## 🚀 **Latest Deployment URL:**

```
https://pptxparser-kqmqc8rlx-deans-projects-50cc7ae5.vercel.app
```

## ✅ **Recent Fixes Applied:**

### **Fixed 404 Error:**

- Added proper CORS headers
- Added OPTIONS method support
- Enhanced API route configuration

### **Fixed 413 Error:**

- Increased file size limit to 4MB
- Better error messages with file size details
- Proper HTTP status codes

### **Enhanced Error Handling:**

- Detailed error responses
- Memory usage monitoring
- Timeout protection (50 seconds)
- Better logging throughout the process

## 🔍 **Step 1: Test Basic Endpoints**

### Health Check:

```bash
curl https://pptxparser-kqmqc8rlx-deans-projects-50cc7ae5.vercel.app/api/health
```

### Test Endpoint:

```bash
curl https://pptxparser-kqmqc8rlx-deans-projects-50cc7ae5.vercel.app/api/test
```

## 📁 **Step 2: Test with PPTX File**

### Requirements:

- **File size**: Must be under 4MB (increased from 1MB)
- **File type**: Valid PPTX format
- **Complexity**: Simple 1-2 slide presentation

### Test File Creation:

1. Create a simple PowerPoint with 1-2 slides
2. Add minimal text content
3. Save as PPTX
4. Check file size (should be < 4MB)

## 🧪 **Step 3: Monitor Vercel Logs**

### View Real-time Logs:

```bash
vercel logs --follow
```

### View Specific Deployment Logs:

```bash
vercel logs https://pptxparser-kqmqc8rlx-deans-projects-50cc7ae5.vercel.app
```

## 🐛 **Step 4: Debug Common Issues**

### If you get "Error parsing PPTX file":

1. **Check Vercel logs** for detailed error messages
2. **Verify file size** is under 4MB
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

### File Size Error Response:

```json
{
  "error": "File too large. Maximum size is 4MB for Vercel deployment.",
  "details": "Your file is X.XXMB, limit is 4MB",
  "fileSize": 1234567,
  "maxSize": 4194304
}
```

## 🔧 **Step 5: Troubleshooting**

### Memory Issues:

- Error: "Parsing failed due to memory constraints"
- Solution: Use smaller file (< 4MB)

### Timeout Issues:

- Error: "Parsing timeout - function took too long"
- Solution: Use simpler PPTX file

### File Format Issues:

- Error: "Invalid PPTX file: missing ppt/ directory"
- Solution: Ensure file is valid PPTX format

### CORS Issues:

- Error: 404 or CORS errors
- Solution: Check if OPTIONS method is working

## 📊 **Step 6: Compare Local vs Vercel**

### Local Success, Vercel Failure:

1. Check file size limits (local: no limit, Vercel: 4MB)
2. Check memory usage in logs
3. Look for timeout issues
4. Verify Node.js compatibility

## 🎯 **Step 7: Test Commands**

### Test with curl:

```bash
curl -X POST \
  -F "file=@your-file.pptx" \
  https://pptxparser-kqmqc8rlx-deans-projects-50cc7ae5.vercel.app/api/pptx/parse
```

### Test OPTIONS method:

```bash
curl -X OPTIONS \
  https://pptxparser-kqmqc8rlx-deans-projects-50cc7ae5.vercel.app/api/pptx/parse
```

### Test with browser:

1. Open your app URL
2. Upload a PPTX file (under 4MB)
3. Check browser console for errors
4. Check Vercel logs for server errors

## 📝 **Step 8: Report Results**

After testing, report:

1. **File size** used
2. **Error message** received (if any)
3. **Vercel logs** output
4. **Browser console** errors
5. **Whether health/test endpoints work**
6. **Whether OPTIONS method works**

## 🚨 **Current Vercel Configuration:**

- **Memory**: 2048MB max (Hobby plan)
- **File size**: 4MB limit (increased)
- **Timeout**: 60 seconds max
- **CORS**: Enabled with proper headers
- **Methods**: POST and OPTIONS supported

## 💡 **Next Steps if Parsing Still Fails:**

1. **Check Vercel logs** for specific error details
2. **Verify file format** is valid PPTX
3. **Test with smaller file** first
4. **Upgrade to Pro plan** for higher limits
5. **Implement client-side parsing** for small files

## 🔍 **Debugging Checklist:**

- [ ] Health endpoint returns 200
- [ ] Test endpoint returns 200
- [ ] OPTIONS method returns 200
- [ ] File size is under 4MB
- [ ] File is valid PPTX format
- [ ] Vercel logs show detailed errors
- [ ] Browser console shows proper error messages
