FROM node:22-alpine

# Install build dependencies for native modules like bcrypt
RUN apk add --no-cache bash git python3 make g++ sudo

# Give node user sudo privileges
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Create workspace directory and set proper ownership
RUN mkdir -p /workspace/backend/node_modules /workspace/frontend/node_modules && \
    chown -R node:node /workspace

# Set the working directory
WORKDIR /workspace

# Switch to node user
USER node

# Copy package files first (for better Docker layer caching)
COPY --chown=node:node backend/package*.json /workspace/backend/
COPY --chown=node:node frontend/package*.json /workspace/frontend/

# Install dependencies and generate lock files
RUN cd /workspace/backend && npm install
RUN cd /workspace/frontend && npm install

# Keep container running
CMD ["sh", "-c", "while sleep 1000; do :; done"]