FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=5000 \
    npm_config_cache=/tmp/.npm

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /app && chown appuser:appgroup /app

WORKDIR /app
USER appuser

COPY --chown=appuser:appgroup package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=appuser:appgroup . .

EXPOSE 5000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["npm", "start"]
