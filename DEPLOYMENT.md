# Deployment Guide

This guide explains how to deploy the PPTX Editor to various platforms.

## Prerequisites

- Node.js 18+ installed
- Git repository set up
- Account on your chosen deployment platform

## Deployment Options

### 1. Vercel (Recommended)

Vercel provides excellent Next.js support and is the easiest option.

#### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name
   - Choose team/account
   - Confirm settings

5. **Automatic deployments**: Push to your main branch to trigger automatic deployments

#### Environment Variables

No environment variables are required for basic functionality.

### 2. Netlify

#### Steps:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `.next` folder to Netlify
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=.next
     ```

3. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

### 3. Railway

#### Steps:

1. **Connect your GitHub repository** to Railway
2. **Set build command**: `npm run build`
3. **Set start command**: `npm start`
4. **Deploy automatically** on push to main branch

### 4. Render

#### Steps:

1. **Connect your GitHub repository** to Render
2. **Choose Web Service**
3. **Configure**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node

## Build Configuration

### Next.js Configuration

The `next.config.js` is already configured for production builds.

### Environment Variables

Create a `.env.local` file for local development:
```env
NEXT_PUBLIC_APP_NAME=PPTX Editor
```

### Build Optimization

The application includes:
- Automatic code splitting
- Image optimization
- CSS optimization
- Tree shaking

## Performance Considerations

### Bundle Size

- Current bundle size: ~2-3MB
- Optimized with Next.js built-in features
- Lazy loading for components

### Caching

- Static assets cached by default
- API routes cached appropriately
- Browser caching headers set

## Monitoring

### Analytics

Consider adding:
- Google Analytics
- Vercel Analytics
- Custom performance monitoring

### Error Tracking

Consider adding:
- Sentry
- LogRocket
- Custom error logging

## Security

### Headers

The application includes basic security headers:
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### Content Security Policy

Consider adding CSP headers for production:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
```

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version (18+ required)
2. **Runtime errors**: Check browser console for details
3. **Performance issues**: Monitor bundle size and loading times

### Debug Mode

Enable debug mode locally:
```bash
DEBUG=* npm run dev
```

## Custom Domain

### SSL Certificate

- Automatically provided by Vercel/Netlify
- Custom domains supported
- HTTPS enforced

### DNS Configuration

Follow your platform's DNS configuration guide.

## Backup and Recovery

### Database

- No database required (client-side storage)
- Export functionality saves to JSON
- Consider cloud storage for user files

### Code

- Git repository serves as backup
- Branch protection recommended
- Automated testing before deployment

## Cost Estimation

### Vercel
- Hobby: Free (100GB bandwidth/month)
- Pro: $20/month (1TB bandwidth/month)
- Enterprise: Custom pricing

### Netlify
- Starter: Free (100GB bandwidth/month)
- Pro: $19/month (1TB bandwidth/month)
- Business: $99/month

### Other Platforms
- Railway: Pay-per-use
- Render: Free tier available

## Support

For deployment issues:
1. Check platform documentation
2. Review build logs
3. Test locally first
4. Check environment compatibility

