# Carrier Identity Verification System

A comprehensive real-time carrier identity verification platform designed to prevent double brokering in the U.S. trucking industry. This system provides freight brokers with the tools to instantly verify carrier legitimacy, check FMCSA records, and ensure compliance before assigning loads.

## 🎯 Features

### Core Verification Capabilities
- **Real-time FMCSA Data Lookup**: Instant access to carrier records from FMCSA SAFER database
- **Document Verification**: AI-powered OCR processing of W9s, COIs, and authority letters
- **Risk Assessment**: Advanced scoring based on safety violations and operational patterns
- **Identity Certificate Generation**: Digital verification badges for trusted carriers
- **Automated Fraud Detection**: Pattern recognition for suspicious carrier behavior

### Broker Dashboard
- **Carrier Search**: Search by MC/DOT number or company name
- **Risk Analysis**: Color-coded risk levels with detailed factor breakdown
- **Verification Status**: Real-time verification progress tracking
- **Compliance Monitoring**: Insurance expiry and authority status alerts
- **Reporting**: Downloadable verification reports and audit trails

### Carrier Portal
- **Self-Registration**: Carriers can claim their MC/DOT numbers
- **Document Upload**: Secure upload for required verification documents
- **Verification Tracking**: Real-time status updates on verification progress
- **Profile Management**: Maintain up-to-date company and contact information

## 🏗 Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Document Processing**: Tesseract.js for OCR, file validation
- **Authentication**: NextAuth.js
- **UI Components**: Lucide React icons, React Hot Toast

### Database Schema
```
Users ← Companies → Carriers → Documents
                      ↓
                  Verifications
                      ↓
              Inspection Records
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Yarn or npm

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd carrier-verification-system
```

2. **Install dependencies**
```bash
yarn install
# or
npm install
```

3. **Setup environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/carrier_verification"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# FMCSA API (Optional - demo mode available)
FMCSA_API_KEY="your-fmcsa-api-key"
FMCSA_BASE_URL="https://mobile.fmcsa.dot.gov/qc/services/carriers"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

4. **Setup database**
```bash
yarn db:push
# or
npx prisma db push
```

5. **Run the development server**
```bash
yarn dev
# or
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Demo Data

The system includes mock FMCSA data for testing:

### Test Carriers
- **MC123456 / DOT123456**: Low-risk authorized carrier
- **MC999999 / DOT999999**: High-risk carrier with violations
- **MC666666 / DOT666666**: Critical risk carrier (out of service)

### Demo Features
1. Search for any of the test MC numbers
2. View real-time risk assessment
3. See safety scores and recommendations
4. Test document upload workflow

## 🔧 API Endpoints

### Carrier Lookup
```typescript
GET /api/carriers/lookup?mc=123456
GET /api/carriers/lookup?dot=1234567
GET /api/carriers/lookup?name=carrier+name

Response: {
  fmcsaData: CarrierData,
  existingCarrier: DatabaseCarrier,
  verificationSummary: VerificationStatus,
  riskFactors: RiskFactor[],
  recommendations: Recommendation[]
}
```

### Carrier Registration
```typescript
POST /api/carriers/register
Body: {
  mcNumber: string,
  dotNumber: string,
  email: string,
  password: string,
  contactName: string,
  phoneNumber: string
}
```

### Document Upload
```typescript
POST /api/documents/upload
FormData: {
  carrierId: string,
  documentType: 'W9' | 'COI' | 'AUTHORITY_LETTER',
  file: File
}
```

## 🔐 Security Features

### Data Protection
- Password hashing with bcryptjs
- File type validation for uploads
- SQL injection prevention with Prisma
- XSS protection with input sanitization

### Document Security
- Secure file storage with UUID naming
- File size and type restrictions
- OCR processing in secure environment
- Document verification against FMCSA records

### Audit Logging
- Complete user action tracking
- Document access logs
- Verification attempt records
- Flag report histories

## 🏢 Business Logic

### Risk Scoring Algorithm
The system calculates risk scores based on:
- **Operating Status** (40% weight): Authorization level
- **BASIC Scores** (30% weight): Safety performance metrics
- **Inspection History** (20% weight): Recent violations and out-of-service events
- **Fleet Size** (10% weight): Operational capacity indicators

### Verification Process
1. **FMCSA Data Verification**: Real-time authority and safety check
2. **Document Upload**: Required documents (W9, COI, Authority Letter)
3. **OCR Processing**: Automated text extraction and data parsing
4. **Cross-Validation**: Document data vs. FMCSA records matching
5. **Manual Review**: Flagged cases reviewed by verification team
6. **Certification**: Verified carriers receive digital certificates

### Risk Levels
- **LOW (0-39%)**: Minimal risk, standard monitoring
- **MEDIUM (40-59%)**: Moderate risk, enhanced communication
- **HIGH (60-79%)**: Significant risk, additional documentation required
- **CRITICAL (80-100%)**: Extreme risk, recommend alternative carriers

## 🔄 Workflow Examples

### Broker Verification Workflow
1. Enter MC/DOT number in search
2. Review FMCSA data and risk assessment
3. Check verification status and documents
4. Review recommendations and risk factors
5. Make informed decision on carrier approval

### Carrier Registration Workflow
1. Submit MC/DOT number and contact information
2. System validates against FMCSA database
3. Upload required documents (W9, COI, Authority Letter)
4. OCR processes and verifies documents
5. Automated verification or manual review
6. Receive verification certificate upon approval

## 🚧 Development

### Project Structure
```
├── components/          # React components
├── lib/                # Utilities and services
├── pages/              # Next.js pages and API routes
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── styles/             # CSS and styling
└── uploads/            # Document storage (excluded from git)
```

### Key Services
- **FMCSA Service** (`lib/fmcsa-api.ts`): External API integration
- **Document Verification** (`lib/document-verification.ts`): OCR and validation
- **Database** (`lib/prisma.ts`): Data access layer

### Adding New Document Types
1. Update Prisma schema enum
2. Add parsing logic in document-verification service
3. Update frontend components
4. Add validation rules

## 📋 Deployment

### Production Checklist
- [ ] Configure production database
- [ ] Set up real FMCSA API credentials
- [ ] Configure email service
- [ ] Set up file storage (AWS S3, etc.)
- [ ] Enable SSL/TLS
- [ ] Configure monitoring and logging
- [ ] Set up backup procedures

### Environment Variables
Ensure all production environment variables are set:
- Database connection strings
- API keys and secrets
- Email configuration
- File storage settings
- Security tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Review the documentation

## 📜 License

This project is proprietary software developed for freight broker carrier verification. All rights reserved.

---

**Built to eliminate double brokering and enhance supply chain security in the trucking industry.**
