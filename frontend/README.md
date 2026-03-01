# Clinic Management System - Frontend

Frontend React application for the Clinic Management System built with React 18, Vite, Redux Toolkit, and Tailwind CSS.

## Getting Started

### Prerequisites
- Node.js (v20.19+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

Development mode with hot reload:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api/                 # API endpoints and axios configuration
│   ├── components/          # Reusable UI components
│   │   └── common/         # Common components (Header, Sidebar, UI)
│   ├── context/            # React Context (Auth)
│   ├── pages/              # Page components
│   │   ├── doctor/        # Doctor-specific pages
│   │   ├── patient/       # Patient-specific pages
│   │   └── receptionist/  # Receptionist-specific pages
│   ├── store/             # Redux store and slices
│   │   └── slices/       # Redux slices (auth, appointment, etc.)
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── package.json
```

## Key Features

- **Multi-Role Authentication**: Login as Doctor, Patient, or Receptionist
- **Role-Based Dashboards**: Different UI and features for each role
- **Appointment Management**: Book, cancel, and view appointments
- **Queue Management**: Real-time queue tracking
- **Medical Records**: View and manage medical records
- **Billing System**: Track and manage patient billing
- **Responsive Design**: Works on desktop, tablet, and mobile

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Icons** - Icon library

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`. Make sure the backend server is running before starting the frontend application.

### Available API Endpoints

See [backend README.md](../backend/README.md) for detailed API documentation.

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## Development

To add a new feature:

1. Create API endpoints in `src/api/endpoints.js`
2. Create Redux slices in `src/store/slices/`
3. Create components in `src/components/`
4. Create pages in `src/pages/`
5. Update routing in `src/App.jsx`

## Build & Deployment

Build the application:
```bash
npm run build
```

The build output will be in the `dist/` folder, ready for deployment.

## License

MIT

