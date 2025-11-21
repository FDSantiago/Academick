# ============================================
# Multi-stage Dockerfile for Laravel Application
# PHP 8.2 + Nginx + SQLite + Vite + React + Inertia.js
# Optimized for Coolify deployment
# ============================================

# ============================================
# Stage 1: Composer Dependencies
# ============================================
FROM composer:2 AS composer-stage

WORKDIR /app

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies (production only, no dev dependencies)
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# Copy application files for autoload optimization
COPY . .

# Generate optimized autoloader
RUN composer dump-autoload --optimize --no-dev

# ============================================
# Stage 2: Node.js Build Stage
# ============================================
FROM node:20-alpine AS node-stage

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm ci --prefer-offline --no-audit

# Copy application files needed for build
COPY . .
COPY --from=composer-stage /app/vendor ./vendor

# Build frontend assets with Vite
RUN npm run build

# Clean up npm cache to reduce image size
RUN npm cache clean --force

# ============================================
# Stage 3: Final Production Image
# ============================================
FROM php:8.2-fpm-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    sqlite \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    libxml2-dev \
    curl-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_sqlite \
        mbstring \
        xml \
        ctype \
        json \
        tokenizer \
        bcmath \
        curl \
        fileinfo \
        zip \
        gd \
        opcache \
    && apk del --no-cache \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        oniguruma-dev \
        libxml2-dev \
        curl-dev

# Configure PHP for production
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=256'; \
    echo 'opcache.interned_strings_buffer=16'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.validate_timestamps=0'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'opcache.enable_cli=0'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# Configure PHP settings
RUN { \
    echo 'memory_limit=512M'; \
    echo 'upload_max_filesize=50M'; \
    echo 'post_max_size=50M'; \
    echo 'max_execution_time=300'; \
    echo 'expose_php=Off'; \
    } > /usr/local/etc/php/conf.d/custom.ini

# Configure Nginx
RUN mkdir -p /run/nginx && \
    rm -f /etc/nginx/http.d/default.conf

COPY <<'EOF' /etc/nginx/http.d/laravel.conf
server {
    listen 80;
    listen [::]:80;
    server_name _;
    root /var/www/html/public;

    index index.php index.html;

    charset utf-8;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }

    # Main location block
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM configuration
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        
        # Increase timeouts for long-running requests
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
    }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Configure Supervisor
COPY <<'EOF' /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:php-fpm]
command=php-fpm -F
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
autorestart=true
startretries=3

[program:nginx]
command=nginx -g 'daemon off;'
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
autorestart=true
startretries=3
EOF

# Copy application files from composer stage
COPY --from=composer-stage --chown=www-data:www-data /app /var/www/html

# Copy built assets from node stage
COPY --from=node-stage --chown=www-data:www-data /app/public/build /var/www/html/public/build

# Copy environment file (will be overridden by Coolify)
COPY --chown=www-data:www-data .env.example /var/www/html/.env

# Create necessary directories and set permissions
RUN mkdir -p \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache \
    /var/www/html/database \
    /var/log/supervisor \
    && chown -R www-data:www-data \
        /var/www/html/storage \
        /var/www/html/bootstrap/cache \
        /var/www/html/database \
    && chmod -R 775 \
        /var/www/html/storage \
        /var/www/html/bootstrap/cache \
        /var/www/html/database

# Create SQLite database file if it doesn't exist
RUN touch /var/www/html/database/database.sqlite \
    && chown www-data:www-data /var/www/html/database/database.sqlite \
    && chmod 664 /var/www/html/database/database.sqlite

# Create startup script
COPY <<'EOF' /usr/local/bin/docker-entrypoint.sh
#!/bin/sh
set -e

echo "Starting Laravel application..."

# Wait a moment for any mounted volumes to be ready
sleep 2

# Ensure database file exists with correct permissions
if [ ! -f /var/www/html/database/database.sqlite ]; then
    echo "Creating SQLite database file..."
    touch /var/www/html/database/database.sqlite
    chown www-data:www-data /var/www/html/database/database.sqlite
    chmod 664 /var/www/html/database/database.sqlite
fi

# Ensure storage and cache directories have correct permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Run Laravel optimization commands
echo "Optimizing Laravel application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Note: Migrations should be run manually via Coolify or a separate command
# php artisan migrate --force

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]