# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight static web server
FROM node:20-alpine

WORKDIR /app

# Install a fast, zero-config production static server
RUN npm install -g serve

# Copy built assets from builder
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Start server on port 3000, listening on all interfaces
CMD ["serve", "-s", "dist", "-l", "3000"]
