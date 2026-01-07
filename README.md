# SimamiaKodi - Property & Rent Management System

A comprehensive property management solution designed for landlords, property managers, and real estate professionals in Kenya. SimamiaKodi streamlines rent collection, tenant management, maintenance tracking, and financial reporting.

##  Features

### Property Management
- **Multi-Property Support**: Manage multiple properties from a single dashboard
- **Unit Management**: Track individual units with occupancy status
- **Property Details**: Store location, type, unit count, and ownership information
- **Real-time Occupancy Tracking**: Monitor vacant and occupied units

### Tenant Management
- **Tenant Profiles**: Complete tenant information with contact details
- **Lease Tracking**: Monitor lease start dates and tenant status
- **Active/Inactive Status**: Easy tenant lifecycle management
- **Property Assignment**: Link tenants to specific properties and units

### Financial Management
- **Payment Processing**: Record and track rent payments
- **Multiple Payment Methods**: Support for M-Pesa, Bank Transfer, and Cash
- **Payment Status Tracking**: Monitor paid, pending, and overdue payments
- **Expense Management**: Track property-related expenses by category
- **Financial Reports**: Comprehensive revenue, expense, and profit analysis

### Reporting & Analytics
- **Financial Summary**: Total revenue, expenses, net profit, and profit margins
- **Monthly Revenue Trends**: Visual line charts showing income patterns
- **Expense Breakdown**: Categorized expense analysis with doughnut charts
- **Payment Status Dashboard**: Bar charts showing payment distribution
- **Occupancy Analytics**: Property-level occupancy visualization
- **Date Range Filtering**: Generate reports for custom time periods
- **Property-Specific Reports**: Filter analytics by individual properties
- **PDF Export**: Export reports for sharing and record-keeping

### Additional Features
- **Payment Plans**: Flexible payment scheduling for tenants
- **Maintenance Requests**: Track and manage property maintenance
- **Agent Management**: Manage property agents and caretakers
- **Communication**: SMS and WhatsApp integration for tenant notifications
- **User Management**: Multi-user access with role-based permissions

##  Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **RESTful API** architecture
- **CORS** enabled for cross-origin requests
- **Environment Variables** for configuration

### Frontend
- **HTML5/CSS3** with modern responsive design
- **JavaScript (ES6+)** for dynamic functionality
- **Chart.js** for data visualization
- **html2pdf.js** for PDF report generation
- **IndexedDB** for client-side caching and performance

### Communication
- **WhatsApp API** for direct tenant communication

##  Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

##  Installation

### 1. Clone the Repository
```bash
git clone https://github.com/maxoti/simamiakodi.git
cd simamiakodi
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb simamiakodi

# Run migrations (if available)
npm run migrate

# Or manually import your schema
psql simamiakodi < database/schema.sql
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/simamiakodi
JWT_SECRET=your_jwt_secret_key
MOBIWAVE_API_KEY=your_mobiwave_key
WHATSAPP_API_KEY=your_whatsapp_key
```

### 5. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

### 6. Access the Application
Open your browser and navigate to:
- Dashboard: `http://localhost:5000/dashboard.html`
- Reports: `http://localhost:5000/pages/reports/analytics.html`

##  API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Properties
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Tenants
- `GET /api/tenants` - Get all tenants
- `POST /api/tenants` - Add new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Remove tenant

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record payment
- `PUT /api/payments/:id` - Update payment
- `GET /api/payments/tenant/:id` - Get tenant payment history

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Record expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Units
- `GET /api/units` - Get all units
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit

### Maintenance
- `GET /api/maintenance` - Get maintenance requests
- `POST /api/maintenance` - Create maintenance request
- `PUT /api/maintenance/:id` - Update request status

### Reports
All report data is aggregated from the existing endpoints using client-side filtering and calculations.

##  Usage Guide

### Adding a Property
1. Navigate to Properties section
2. Click "Add New Property"
3. Fill in property details (name, location, type, units)
4. Save the property

### Recording a Payment
1. Go to Payments section
2. Click "Record Payment"
3. Select tenant and property
4. Enter amount, date, and payment method
5. Submit the payment

### Generating Reports
1. Open Reports & Analytics page
2. Select report type (Financial Summary, Occupancy, etc.)
3. Choose date range using Start Date and End Date filters
4. Select specific property or "All Properties"
5. Click "Generate Report"
6. Export to PDF using "Export PDF" button

### Filtering Reports by Property
- Use the Property dropdown to view analytics for specific properties
- Select "All Properties" to see aggregated data
- All charts and metrics update automatically when filters change

##  Dashboard Features

### Key Metrics Cards
- **Total Properties**: Count of all managed properties
- **Active Tenants**: Number of current tenants
- **Monthly Revenue**: Current month's rental income
- **Monthly Expenses**: Current month's costs
- **Pending Issues**: Outstanding maintenance requests
- **Payment Plans**: Active payment arrangements

### Recent Activity
- Recent payments with status indicators
- Quick action buttons for common tasks
- Pending tasks and notifications

##  Reports & Analytics Features

### Financial Reports
- **Total Revenue**: Sum of all payments in selected period
- **Total Expenses**: Sum of all expenses in selected period
- **Net Profit**: Revenue minus expenses
- **Profit Margin**: Percentage profitability metric

### Visual Analytics
1. **Monthly Revenue Trend**: Line chart showing income over 12 months
2. **Expense Breakdown**: Doughnut chart categorizing expenses
3. **Payment Status**: Bar chart of paid/pending/overdue payments
4. **Occupancy by Property**: Pie chart showing occupied vs vacant units

### Advanced Filtering
- Date range selection for historical analysis
- Property-specific filtering for detailed insights
- Report type selection for different views
- Real-time chart updates

### Performance Optimization
- **IndexedDB Caching**: Client-side data storage for faster load times
- **Debounced Updates**: Smooth filtering without performance lag
- **Lazy Loading**: Charts render progressively
- **Efficient Queries**: Optimized database calls

##  Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Environment variable protection
- SQL injection prevention
- CORS configuration
- Input validation and sanitization

##  Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U username -d simamiakodi
```

### Port Already in Use
```bash
# Kill process on port 5000
sudo lsof -t -i tcp:5000 | xargs kill -9
```

### Reports Showing Zero Values
- Check date filters match your data dates
- Verify backend API is returning data: `http://localhost:5000/api/payments`
- Open browser console and run: `SimamiaKodiReports.getStats()`
- Ensure database has payment/expense records

### Property Not Showing in Dropdown
- Refresh the page after adding properties
- Check `/api/properties` returns data with `property_id` and `property_name`
- Verify backend is running on port 5000

##  Browser Compatibility

-  Chrome 90+
-  Firefox 88+
-  Safari 14+
-  Edge 90+

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 👥 Authors

- Maxwell - Initial work - [GitHub](https://github.com/maxoti)

##  Acknowledgments

- Chart.js for beautiful data visualizations
- PostgreSQL community for robust database support
- Node.js and Express.js communities
- All contributors and testers

## 📞 Support

For support, email maxoti96@gmail.com or open an issue on GitHub.


### Version History
- **v1.0.0** (Current)
  - Initial release
  - Core property and tenant management
  - Payment and expense tracking
  - Comprehensive reporting module
  - SMS/WhatsApp integration

---

**Built with  for property managers in Kenya**

*SimamiaKodi - Manage Your Properties with Confidence*