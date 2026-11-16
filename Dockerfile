FROM node:24-slim

WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy the rest of the app
COPY . .

ENV NODE_ENV=production
ENV PORT=44100
ENV HOST=0.0.0.0

EXPOSE 44100

CMD ["npm", "start"]
