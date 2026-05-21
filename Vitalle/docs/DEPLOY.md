# Deploy - Vitalle

## Google Cloud Platform (GCP)

### Pré-requisitos
- Google Cloud SDK instalado
- Projeto GCP criado
- APIs habilitadas: Cloud Run, Container Registry, Secret Manager

### 1. Configurar Secrets
```bash
# Criar secrets no Secret Manager
gcloud secrets create vitalle-db-url --data-file=- <<< "postgresql://..."
gcloud secrets create vitalle-jwt-secret --data-file=- <<< "your-secret"
gcloud secrets create vitalle-whatsapp-token --data-file=- <<< "your-token"
gcloud secrets create vitalle-pagbank-token --data-file=- <<< "your-token"
```

### 2. Build & Push
```bash
# Backend
docker build -f docker/Dockerfile.backend -t gcr.io/PROJECT_ID/vitalle-backend .
docker push gcr.io/PROJECT_ID/vitalle-backend

# Frontend
docker build -f docker/Dockerfile.frontend -t gcr.io/PROJECT_ID/vitalle-frontend .
docker push gcr.io/PROJECT_ID/vitalle-frontend
```

### 3. Deploy Cloud Run
```bash
# Backend
gcloud run deploy vitalle-backend \
  --image gcr.io/PROJECT_ID/vitalle-backend \
  --platform managed \
  --region us-east1 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --set-secrets "DATABASE_URL=vitalle-db-url:latest,JWT_SECRET=vitalle-jwt-secret:latest"

# Frontend
gcloud run deploy vitalle-frontend \
  --image gcr.io/PROJECT_ID/vitalle-frontend \
  --platform managed \
  --region us-east1 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://vitalle-backend-xxxx.run.app"
```

### 4. Database Migration (Produção)
```bash
# Executar migrations no Cloud Run Job
gcloud run jobs create vitalle-migrate \
  --image gcr.io/PROJECT_ID/vitalle-backend \
  --command "npx" \
  --args "prisma,migrate,deploy" \
  --set-secrets "DATABASE_URL=vitalle-db-url:latest"

gcloud run jobs execute vitalle-migrate
```

### 5. Cloud Scheduler (Cron Jobs)
```bash
# Lembrete D+1 (todo dia às 18h)
gcloud scheduler jobs create http vitalle-reminder-d1 \
  --schedule "0 18 * * *" \
  --uri "https://vitalle-backend-xxxx.run.app/api/v1/whatsapp/cron/reminders" \
  --http-method POST

# Verificar assinaturas expiradas (todo dia às 00h)
gcloud scheduler jobs create http vitalle-check-subscriptions \
  --schedule "0 0 * * *" \
  --uri "https://vitalle-backend-xxxx.run.app/api/v1/subscriptions/cron/check-expired" \
  --http-method POST
```

---

## Deploy com Docker Compose (VPS)

### 1. Copiar arquivos para o servidor
```bash
scp -r . user@server:/opt/vitalle
```

### 2. Configurar ambiente
```bash
ssh user@server
cd /opt/vitalle
cp .env.example .env
nano .env  # Editar com credenciais reais
```

### 3. Executar
```bash
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

### 4. Configurar Nginx (reverse proxy)
```nginx
server {
    listen 443 ssl;
    server_name app.vitalle.com.br;

    ssl_certificate /etc/letsencrypt/live/app.vitalle.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.vitalle.com.br/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
