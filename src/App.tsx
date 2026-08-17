import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EmailAuth from './pages/EmailAuth'
import Vote from './pages/Vote'
import Confirmation from './pages/Confirmation'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<EmailAuth />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<div className="page"><span className="spinner" /></div>}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="page"><span className="spinner" /></div>}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
