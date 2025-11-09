# 🚀 WhatPad Deployment Guide

## Triển khai với Caddy Reverse Proxy

### Cấu trúc triển khai

```
Internet → Caddy (Port 80/443) → Frontend (Port 3000)
                                → Backend (Port 1204)
                                → MySQL (Port 1710)
```

## 📋 Yêu cầu

- Docker và Docker Compose đã cài đặt
- Server với IP public hoặc domain
- Port 80, 443 mở trên firewall

## 🔧 Cấu hình

### 1. Cập nhật file `.env`

```bash
# Frontend Configuration - Đổi localhost thành IP server hoặc domain
REACT_APP_API_URL=http://YOUR_SERVER_IP:1204
```

### 2. Cấu hình Caddyfile

File `Caddyfile` đã được tạo sẵn. Nếu bạn có domain, sửa như sau:

```caddyfile
# Với domain
yourdomain.com {
    reverse_proxy frontend:3000
    encode gzip
}

api.yourdomain.com {
    reverse_proxy backend:1204
    encode gzip
}
```

Nếu chỉ dùng IP, giữ nguyên cấu hình mặc định:
```caddyfile
# Port 80 - Frontend
:80 {
    reverse_proxy frontend:3000
    encode gzip
}

# Port 1204 - Backend API
:1204 {
    reverse_proxy backend:1204
    encode gzip
}
```

## 🚀 Triển khai

### Bước 1: Clone code lên server

```bash
git clone https://github.com/yunkhngn/whatpad.git
cd whatpad
git checkout docker
```

### Bước 2: Tạo file .env

```bash
cp .env.example .env
nano .env  # Chỉnh sửa các giá trị cần thiết
```

**Quan trọng:** Cập nhật `REACT_APP_API_URL` với IP server của bạn:
```bash
REACT_APP_API_URL=http://YOUR_SERVER_IP:1204
```

### Bước 3: Khởi động services

```bash
# Build và start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

### Bước 4: Kiểm tra trạng thái

```bash
# Kiểm tra containers đang chạy
docker-compose ps

# Kiểm tra MySQL đã khởi tạo database chưa
docker-compose logs mysql | grep "ready for connections"

# Kiểm tra backend
docker-compose logs backend | grep "Server running"

# Kiểm tra frontend
docker-compose logs frontend | grep "webpack compiled"
```

## 🌐 Truy cập ứng dụng

### Với IP Server:
- **Frontend**: `http://YOUR_SERVER_IP`
- **Backend API**: `http://YOUR_SERVER_IP:1204`
- **API Docs**: `http://YOUR_SERVER_IP:1204/docs`

### Với Domain (nếu đã cấu hình):
- **Frontend**: `http://yourdomain.com`
- **Backend API**: `http://api.yourdomain.com`

## 🔒 Bảo mật cho Production

### 1. Đổi các giá trị mặc định trong `.env`:

```bash
# Mật khẩu database mạnh
DB_ROOT_PASSWORD=your_strong_root_password
DB_PASSWORD=your_strong_db_password

# JWT Secret mạnh (có thể generate bằng: openssl rand -hex 64)
JWT_SECRET=your_very_long_random_secret_key
```

### 2. Cấu hình HTTPS với Caddy (nếu có domain):

Caddy tự động lấy SSL certificate từ Let's Encrypt:

```caddyfile
yourdomain.com {
    reverse_proxy frontend:3000
    encode gzip
    
    # Tự động redirect HTTP → HTTPS
}

api.yourdomain.com {
    reverse_proxy backend:1204
    encode gzip
    
    # CORS configuration
    header {
        Access-Control-Allow-Origin https://yourdomain.com
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
    }
}
```

### 3. Firewall Rules:

```bash
# Mở port cần thiết
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH

# Port riêng cho API (nếu cần truy cập trực tiếp)
sudo ufw allow 1204/tcp

# Enable firewall
sudo ufw enable
```

## 🔄 Update và Maintenance

### Update code mới:

```bash
# Pull code mới
git pull origin docker

# Rebuild và restart
docker-compose down
docker-compose up -d --build
```

### Backup database:

```bash
# Backup
docker-compose exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} wattpad > backup_$(date +%Y%m%d).sql

# Restore
docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} wattpad < backup_20231107.sql
```

### Reset database:

```bash
# Xóa volume và tạo lại
docker-compose down -v
docker-compose up -d
```

### Xem logs:

```bash
# Tất cả services
docker-compose logs -f

# Service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f caddy

# Caddy access logs
docker-compose exec caddy cat /var/log/caddy/access.log
docker-compose exec caddy cat /var/log/caddy/api-access.log
```

## 🐛 Troubleshooting

### Frontend không kết nối được Backend:

1. Kiểm tra `REACT_APP_API_URL` trong `.env`
2. Build lại frontend: `docker-compose up -d --build frontend`
3. Clear browser cache

### MySQL không khởi động:

```bash
# Xem logs
docker-compose logs mysql

# Nếu cần reset
docker-compose down -v
docker-compose up -d
```

### Caddy không start:

```bash
# Kiểm tra syntax Caddyfile
docker-compose exec caddy caddy fmt --overwrite /etc/caddy/Caddyfile

# Reload Caddyfile
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### Port đã được sử dụng:

Sửa port trong `.env`:
```bash
FRONTEND_PORT=8080
BACKEND_PORT=8081
DB_PORT=3307
```

## 📊 Monitoring

### Resource usage:

```bash
# CPU, Memory usage
docker stats

# Disk usage
docker system df
```

### Health checks:

```bash
# Backend health
curl http://YOUR_SERVER_IP:1204/docs

# Frontend health
curl http://YOUR_SERVER_IP

# MySQL health
docker-compose exec mysql mysqladmin -u root -p${DB_ROOT_PASSWORD} ping
```

## 🎯 Production Checklist

- [ ] Đổi tất cả passwords mặc định
- [ ] Cấu hình JWT_SECRET mạnh
- [ ] Cập nhật REACT_APP_API_URL với IP/domain thật
- [ ] Cấu hình HTTPS với Caddy (nếu có domain)
- [ ] Setup firewall rules
- [ ] Test tất cả endpoints
- [ ] Setup backup tự động
- [ ] Cấu hình monitoring/logging
- [ ] Test disaster recovery

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Logs: `docker-compose logs -f`
2. Container status: `docker-compose ps`
3. Network: `docker network ls`
4. Volumes: `docker volume ls`
