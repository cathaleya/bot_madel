# Dockerfile for Next.js app with Python & R engines
FROM node:20-bookworm

# Install Python and R for psychometric analysis engines
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-numpy \
    python3-matplotlib \
    r-base \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package configurations
COPY package*.json ./
COPY prisma ./prisma/

# Install Node dependencies
RUN npm install

# Copy the rest of application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application (Direct next build, bypassing database check)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx next build

# Expose port 3000
EXPOSE 3000

# Start Next.js (Push database schema at runtime when PostgreSQL is ready, then start)
CMD npx prisma db push && npm run start

