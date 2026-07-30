# Frontend Architecture

## 1. Tech Stack
- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: @tanstack/react-query + Axios
- **Routing**: React Router DOM v7 (or equivalent)
- **Animations**: Framer Motion & Three.js (@react-three/fiber)
- **UI Components**: Shadcn UI (Custom manual implementation) + Lucide React icons.

## 2. Folder Structure
```
src/Web/frontend/src/
├── assets/         # Static images, 3D models (.gltf), fonts
├── components/
│   ├── ui/         # Reusable Shadcn-like components (Button, Input, Modal)
│   ├── public/     # Components specific to the public portfolio
│   └── admin/      # Components specific to the admin dashboard
├── hooks/          # Custom React hooks (e.g., useSignalR)
├── lib/            # Utility functions (e.g., clsx merging for Tailwind)
├── pages/          # Route components (Home, Dashboard, etc.)
├── services/       # API clients (Axios setups)
└── store/          # Zustand stores (authStore, themeStore)
```

## 3. Design Philosophy
- **Wow Factor**: The public site should use smooth transitions (Framer Motion) and a 3D interactive hero section to impress visitors immediately.
- **Performance**: Heavy 3D assets must be lazy-loaded.
- **Admin UX**: The dashboard must prioritize speed and utility. Data tables should have sorting and pagination. Rich text editing (TipTap) is used for project descriptions.
- **Real-time**: The dashboard uses SignalR to listen to new contact messages instantly.
