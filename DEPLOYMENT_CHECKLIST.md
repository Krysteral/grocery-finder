# Deployment Checklist

Use this checklist to ensure your application is ready for deployment.

## Environment Variables

- [ ] Verify all required environment variables are set in your deployment platform
- [ ] Ensure no sensitive credentials are committed to the repository
- [ ] Confirm that `.env.local` is in `.gitignore`

## API Keys and Credentials

- [ ] Google Maps API key is set up with the correct restrictions
- [ ] Kroger API credentials are valid and have the necessary permissions
- [ ] All API keys have appropriate usage limits configured

## Performance

- [ ] Images are optimized
- [ ] Bundle size is reasonable
- [ ] No unnecessary dependencies

## Security

- [ ] No sensitive information is exposed to the client
- [ ] API routes are properly protected
- [ ] Authentication is working correctly

## Browser Compatibility

- [ ] Application works in all major browsers
- [ ] Mobile responsiveness is tested

## Functionality

- [ ] All core features are working
- [ ] Error handling is in place
- [ ] Loading states are implemented

## Post-Deployment

- [ ] Verify all API integrations work in the production environment
- [ ] Check for any CORS issues
- [ ] Monitor for any errors in production logs
\`\`\`

Let's also update the `.gitignore` file to ensure sensitive files are not committed:

```text file=".gitignore"
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
