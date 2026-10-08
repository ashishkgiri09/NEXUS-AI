FROM node:20-slim

# Install system dependencies, git, python3, and playwright dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    python3-pip \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Setup workspace directory
WORKDIR /workspace

# Default command keeps container alive for orchestration execution
CMD ["tail", "-f", "/dev/null"]
