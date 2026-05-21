# API Documentation - Vitalle

## Base URL
```
http://localhost:3001/api/v1
```

## Swagger UI
```
http://localhost:3001/api/docs
```

## Authentication

All endpoints (except public ones) require Bearer token:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### Auth
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Login | No |
| POST | `/auth/register` | Register tenant + user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Revoke refresh token | Yes |

### Users
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/users` | List users in tenant | Yes |
| GET | `/users/me` | Get current user | Yes |

### Tenants
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/tenants/current` | Get current tenant | Yes |
| GET | `/tenants` | List all tenants | SUPPORT |
| PATCH | `/tenants/current` | Update tenant | DOCTOR |

### Doctors
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/doctors` | List doctors in tenant | Yes |
| GET | `/doctors/:id/slots` | Get available slots | Yes |

### Patients
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/patients` | Create patient | Yes |
| GET | `/patients` | List patients (with search) | Yes |
| GET | `/patients/:id` | Get patient by ID | Yes |
| PATCH | `/patients/:id` | Update patient | Yes |
| DELETE | `/patients/:id` | Soft delete patient | Yes |

### Appointments
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/appointments` | Create appointment | Yes |
| GET | `/appointments` | List appointments (filters) | Yes |
| PATCH | `/appointments/:id/status` | Update status | Yes |
| PATCH | `/appointments/:id/cancel` | Cancel appointment | Yes |

### Medical Records
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/medical-records` | Create record | Yes |
| GET | `/medical-records/patient/:id` | Get by patient | Yes |
| GET | `/medical-records/:id` | Get by ID | Yes |

### Subscriptions
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/subscriptions/current` | Get current subscription | Yes |

### Payments
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/payments` | List payments | Yes |
| POST | `/payments/webhook/pagbank` | PagBank webhook | Public |

### WhatsApp
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/whatsapp/send` | Send message | Yes |
| GET | `/whatsapp/webhook` | Webhook verification | Public |
| POST | `/whatsapp/webhook` | Inbound messages | Public |

### Contracts
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/contracts/current` | Get contract content | Yes |
| GET | `/contracts/status` | Check acceptance status | Yes |
| POST | `/contracts/accept` | Accept contract | Yes |

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Pagination

Endpoints that return lists support:
```
?page=1&limit=20
```

Response format:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```
