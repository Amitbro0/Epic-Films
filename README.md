# Video Editing Studio Web App

A professional, modern web application for a video editing studio, built with Next.js and MongoDB.

## Features

### Public Website
- **Hero Section**: Catchy headline and call-to-action.
- **Services & Pricing**: Clear list of services and pricing packages.
- **Portfolio**: Showcase of previous work (YouTube/Vimeo links).
- **Booking System**: Easy form for clients to book edits and submit Drive links.
- **Order Tracking**: Clients can check the status of their order using their phone number and Order ID.

### Admin Panel
- **Dashboard**: Overview of total orders, revenue, and pending projects.
- **Order Management**: View all bookings, update status (Pending -> Processing -> Completed), and track payments.
- **Secure Access**: Simple login protection for the admin area.

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas URL)

### Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create a `.env.local` file in the root directory and add your MongoDB URI:
    ```env
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/video-studio?retryWrites=true&w=majority
    ```

3.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the site.

### Configuration

All text, prices, services, and status colors are editable in a single file:
**`src/config/siteConfig.js`**

- **Change Studio Name**: Edit `studioName` and `contact` details.
- **Update Prices**: Modify the `services` and `pricing` arrays.
- **Add Portfolio Items**: Add new objects to the `portfolio` array.
- **Customize Statuses**: Change colors and labels in `statusColors`.

### Admin Access

- **URL**: `/admin/login`
- **Default Credentials**:
    - Username: `admin`
    - Password: `admin123`
    *(Note: Change these in `src/app/api/auth/login/route.js` for production)*

## Deployment

Recommended hosting: **Vercel** (Frontend + API) + **MongoDB Atlas** (Database).

1.  Push code to GitHub.
2.  Import project in Vercel.
3.  Add `MONGODB_URI` to Vercel Environment Variables.
4.  Deploy!
