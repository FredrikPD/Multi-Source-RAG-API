FROM node:20-alpine

WORKDIR /app

# 1. Install deps
COPY package*.json ./
RUN npm ci --omit=dev    # or `npm install --only=production` if you prefer

# 2. Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# 3. App source
COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]