import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";
import Home from "./pages/Home.jsx";
import Items from "./pages/Items.jsx";
import ItemDetails from "./pages/ItemDetails.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Login from "./Auth/Login.jsx";
import Register from "./Auth/Register.jsx";
import PostItem from "./pages/PostItem.jsx";
import Profile from "./pages/Profile.jsx";

import VerifyEmail from "./Auth/VerifyEmail.jsx";
import ForgotPassword from "./Auth/ForgotPassword.jsx";
import ResetPassword from "./Auth/ResetPassword.jsx";

import RequireAdmin from "./Auth/RequireAdmin.jsx";
import AdminLayout from "./pages/Admin/AdminLayout.jsx";
import Dashboard from "./pages/Admin/Dashboard.jsx";
import PendingApprovals from "./pages/Admin/PendingApprovals.jsx";
import AllItems from "./pages/Admin/AllItems.jsx";
import Users from "./pages/Admin/Users.jsx";
import Categories from "./pages/Admin/Categories.jsx";
import Messages from "./pages/Admin/Messages.jsx";

// The public website: Header on top, Footer at the bottom
function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}



export default function App() {
  return (
    <Routes>
      {/* Public pages (with Header and Footer) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/items" element={<Items />} />
        <Route path="/items/:id" element={<ItemDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/post-item" element={<PostItem />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin pages (own layout, only for admins) */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pending" element={<PendingApprovals />} />
        <Route path="items" element={<AllItems />} />
        <Route path="users" element={<Users />} />
        <Route path="categories" element={<Categories />} />
        <Route path="messages" element={<Messages />} />
      </Route>
    </Routes>
  );
}