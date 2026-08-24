FROM node:22-slim

# Chromium do sistema (o puppeteer-core não baixa navegador) + fontes, senão
# sites com acentuação, CJK ou emoji renderizam com quadradinhos nas capturas.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      fonts-dejavu-core \
      fonts-noto-core \
      fonts-noto-cjk \
      fonts-noto-color-emoji \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=5177

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY lib ./lib
COPY public ./public

# O Chrome não deve rodar como root; a imagem do node já traz o usuário "node".
USER node

EXPOSE 5177
CMD ["node", "server.js"]
