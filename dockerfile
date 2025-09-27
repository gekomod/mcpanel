# Użyj oficjalnego obrazu Debian
FROM debian:bookworm-slim

# Metadane obrazu
LABEL maintainer="zaba141@o2.pl"
LABEL version="1.0.0"
LABEL description="MCPanel - Minecraft Server Management Panel"
LABEL org.opencontainers.image.source="https://github.com/gekomod/mcpanel"

# Ustaw zmienne środowiskowe
ENV APP_HOME=/app

# Zainstaluj systemowe zależności
RUN apt-get update && apt-get install -y \
    supervisor \
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
    unzip \
    libcurl4-openssl-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g serve

# Utwórz katalog aplikacji
WORKDIR $APP_HOME

# Skopiuj konfigurację supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Skopiuj pliki zależności i zainstaluj je
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip3 install --no-cache-dir -r backend/requirements.txt --break-system-packages

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install

# Skopiuj resztę kodu aplikacji
COPY . .

# Zbuduj frontend
RUN cd frontend && npm run build

# Otwórz porty
EXPOSE 3000
EXPOSE 5000
EXPOSE 19132/udp
EXPOSE 19133/udp
EXPOSE 25565
EXPOSE 25566
EXPOSE 25567

# Uruchom skrypt startowy
CMD ["/start.sh"]