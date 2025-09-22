# Użyj oficjalnego obrazu Debian
FROM debian:bookworm-slim

# Metadane obrazu
LABEL maintainer="zaba141@o2.pl"
LABEL version="1.0.0"
LABEL description="MCPanel - Minecraft Server Management Panel"
LABEL org.opencontainers.image.source="https://github.com/gekomod/mcpanel"

# Ustaw zmienne środowiskowe
ENV APP_HOME=/app

# Zainstaluj systemowe zależności including GLIBC_2.35
RUN apt-get update && apt-get install -y \
    screen \
    curl \
    wget \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    openjdk-17-jdk \
    openjdk-17-jre \
    libc6 \
    libstdc++6 \
    libgcc1 \
    zlib1g \
    libncurses6 \
    libnss3 \
    libssl3 \
    libcurl4 \
    libxml2 \
    liblzma5 \
    libbz2-1.0 \
    libatomic1 \
    libicu72 \
    ca-certificates \
    gnupg \
    software-properties-common \
    unzip \
    libcurl4-openssl-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g serve

RUN apt-get update && apt-get install -y \
    unzip \
    libcurl4-openssl-dev \
    && mkdir -p /app/minecraft/tools

# Utwórz katalog aplikacji
WORKDIR $APP_HOME

# Skopiuj Data
COPY data/ ./data/

# Skopiuj backend
COPY backend/ ./backend/

# Skopiuj frontend
COPY frontend/ ./frontend/

WORKDIR $APP_HOME/backend

# Zainstaluj zależności Pythona
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Zainstaluj zależności frontendu i zbuduj
WORKDIR $APP_HOME/frontend
RUN npm install && npm run build

# Wróć do głównego katalogu
WORKDIR $APP_HOME

# Utwórz skrypt uruchamiający
RUN echo '#!/bin/bash\n\
# Uruchom backend w tle\n\
cd /app/backend\n\
screen -dmS backend python3 run.py\n\
\n\
# Uruchom frontend w tle\n\
cd /app/frontend\n\
screen -dmS frontend npm run start\n\
\n\
# Wyświetl uruchomione screeny\n\
echo "Uruchomione procesy:"\n\
screen -list\n\
\n\
# Utrzymaj kontener przy życiu\n\
while true; do sleep 3600; done\n\
' > /app/start.sh && chmod +x /app/start.sh

# Otwórz porty
EXPOSE 3000
EXPOSE 5000
EXPOSE 19132/udp
EXPOSE 19133/udp
EXPOSE 25565
EXPOSE 25566
EXPOSE 25567

# Uruchom skrypt startowy
CMD ["/bin/bash", "/app/start.sh"]
