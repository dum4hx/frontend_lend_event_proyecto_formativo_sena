# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Receive the API URL at build time so Vite can bake it into the bundle
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Stage: Development / Development runtime
# This stage is used when building for development
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install a simple server to serve the static files
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the requested port
EXPOSE 5173

# Healthcheck to ensure the container is running
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Start the server on port 5173 serving the dist folder
CMD ["serve", "-s", "dist", "-l", "5173"]
