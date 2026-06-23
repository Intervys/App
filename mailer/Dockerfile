FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production --no-audit
COPY server.js .
EXPOSE 3001
CMD ["node", "server.js"]
