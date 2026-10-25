FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY scripts ./scripts
COPY public ./public
COPY worker ./worker
COPY drizzle ./drizzle
COPY .openai/hosting.json ./.openai/hosting.json
ENV ATLAS_HOST=0.0.0.0 ATLAS_DATA_DIR=/data PORT=3000
EXPOSE 3000
CMD ["node", "scripts/start.mjs"]
