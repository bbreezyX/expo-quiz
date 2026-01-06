# 🎯 Expo Quiz

A real-time quiz application designed for events, exhibitions, and conferences. Features live sessions, participant management, automatic scoring, and real-time leaderboards.

## ✨ Features

### For Administrators

- 🎮 **Session Management** - Create, manage, and end quiz sessions with unique access codes
- 📝 **Question Bank** - Create and organize multiple-choice questions
- 📊 **Import Questions** - Bulk import questions via JSON format
- 📈 **Live Dashboard** - Monitor active sessions and participant responses in real-time
- 📜 **Session History** - View past sessions with complete participant data and scores
- 🔐 **Secure Admin Panel** - Password-protected admin access

### For Participants

- 🚀 **Easy Join** - Join sessions using unique codes or QR codes
- ⚡ **Real-time Quiz** - Answer questions with instant submission
- 🏆 **Live Leaderboard** - See rankings update in real-time
- 📱 **Mobile Friendly** - Responsive design for all devices

### For Display Screens

- 🖥️ **Public Leaderboard** - Dedicated screen for displaying live rankings
- 🔄 **Auto-refresh** - Automatic updates via Supabase Realtime

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Components:** Custom components with shadcn/ui patterns

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.17 or later
- **npm** or **yarn** package manager
- **Supabase Account** (free tier available at [supabase.com](https://supabase.com))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expo-quiz
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

#### a) Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up (usually takes 1-2 minutes)

#### b) Run Database Schema

Navigate to the **SQL Editor** in your Supabase dashboard and execute the following files in order:

1. `supabase/schema.sql` - Creates the main tables (sessions, questions, participants, answers)
2. `supabase/question_bank.sql` - Creates the question bank functionality
3. `supabase/rls-policies.sql` - Sets up Row Level Security policies
4. `supabase/functions.sql` - Creates database functions for leaderboard calculation

#### c) Enable Realtime

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Enable replication for the following tables:
   - `answers`
   - `participants`
   - `sessions`

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under **API**.

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Admin Access

To access the admin panel:

1. Navigate to `/admin/login`
2. Enter the admin password (default setup requires configuration)
3. The admin password is validated against a stored hash in Supabase

**Important:** For production use, make sure to set up proper admin authentication in your Supabase database.

## 📱 Application Routes

| Route               | Description                 | Access       |
| ------------------- | --------------------------- | ------------ |
| `/`                 | Landing page with join form | Public       |
| `/admin`            | Admin dashboard             | Protected    |
| `/admin/login`      | Admin login page            | Public       |
| `/join`             | Session join form           | Public       |
| `/join/[code]`      | Join specific session       | Public       |
| `/quiz/[code]`      | Participant quiz interface  | Participants |
| `/quiz/[code]/done` | Quiz completion page        | Participants |
| `/screen/[code]`    | Public leaderboard display  | Public       |

## 📝 Usage Guide

### Creating a Quiz Session

1. Log in to the admin panel (`/admin`)
2. Go to **Question Bank** and create questions
3. Navigate to **Session Control**
4. Click **Create New Session**
5. Select questions to include
6. Share the session code with participants

### Importing Questions

Questions can be bulk imported via JSON format:

```json
[
  {
    "text": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctIndex": 1
  }
]
```

### Participant Flow

1. Participants visit the landing page
2. Enter the session code
3. Provide their name and organization
4. Answer questions in sequence
5. View their rank on the leaderboard

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### Other Platforms

This is a standard Next.js application and can be deployed to:

- **Netlify**
- **Railway**
- **Render**
- **AWS Amplify**
- Any platform supporting Node.js

Make sure to configure environment variables on your chosen platform.

## 🔧 Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## 🐛 Troubleshooting

### Realtime Updates Not Working

- Ensure Realtime is enabled for the required tables in Supabase
- Check that RLS policies allow reading from `answers` table
- Verify your Supabase connection is active

### Questions Not Appearing

- Make sure you've run all SQL migration files
- Verify questions are assigned to the active session
- Check browser console for API errors

### Admin Login Issues

- Ensure you've set up admin credentials in Supabase
- Verify the password hash is correct
- Check middleware configuration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💬 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

Made with ❤️ for engaging live quiz experiences
