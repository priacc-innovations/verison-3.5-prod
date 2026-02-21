import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Trash2, Mail, Eye, EyeOff, Pencil } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../api/axiosInstance';
import toast from "react-hot-toast";

interface HRMember {
  id: string;
  fullName: string;
  email: string;
  empid: string;
  role: string;
  createdAt: string;
}

interface TrainerMember {
  id: string;
  fullName: string;
  email: string;
  empid: string;
  role: string;
  domain: string;
  createdAt: string;
}

export default function HRManagement() {
  const [activeView, setActiveView] = useState<'hr' | 'trainer'>('hr');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [hrMembers, setHrMembers] = useState<HRMember[]>([]);
  const [trainers, setTrainers] = useState<TrainerMember[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    empid: '',
    password: '',
    domain: '',
  });

  // ---------------- LOAD MEMBERS ----------------
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const res = await api.get("/user/all");
      setHrMembers(res.data.filter((u: any) => u.role === "hr"));
      setTrainers(res.data.filter((u: any) => u.role === "trainer"));
    } catch {
      toast.error("Failed to load members");
    }
  };

  // ---------------- DELETE ----------------
  const confirmDelete = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-medium">Are you sure you want to delete this user?</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 rounded bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              handleDelete(id);
            }}
            className="px-3 py-1 rounded bg-red-500 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    ));
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/user/delete/${id}`);
      toast.success("User deleted successfully");
      loadMembers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  // ---------------- EDIT ----------------
  const openEdit = (user: any) => {
    setEditUser({
      id: user.id,
      fullName: user.fullName || "",
      email: user.email || "",
      empid: String(user.empid || ""),   // ⭐ FORCE STRING
      role: user.role,
      domain: user.domain || ""
    });
    setShowEditForm(true);
  };


  const handleEditSave = async () => {
    try {
      await api.put(`/user/hr/update/${editUser.id}`, {
        fullName: editUser.fullName,
        email: editUser.email,
        empid: editUser.empid,   // string, never null
        role: editUser.role,
        domain: editUser.role === "trainer" ? editUser.domain : null
      });
      toast.success("User updated successfully");
      setShowEditForm(false);
      loadMembers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  // ---------------- ADD HR / TRAINER ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.endsWith("@priaccinnovations.ai")) {
      toast.error("Email must end with @priaccinnovations.ai");
      return;
    }

    try {
      await api.post("/user/add", {
        ...formData,
        role: activeView === "hr" ? "hr" : "trainer",
        domain: activeView === "trainer" ? formData.domain : null
      });

      toast.success(`${activeView === "hr" ? "HR" : "Trainer"} account created`);
      setShowAddForm(false);
      setFormData({ fullName: "", email: "", empid: "", password: "", domain: "" });
      loadMembers();
    } catch {
      toast.error("Failed to create account");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            HR & Trainer Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage HR staff and domain trainers
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <UserPlus className="w-5 h-5" />
          Add New {activeView === 'hr' ? 'HR' : 'Trainer'}
        </Button>
      </div>

      {/* TOGGLE */}
      <div className="flex gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveView('hr')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'hr'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          HR Staff ({hrMembers.length})
        </button>

        <button
          onClick={() => setActiveView('trainer')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${activeView === 'trainer'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
          Trainers ({trainers.length})
        </button>
      </div>

      {/* ---------------- ADD FORM ---------------- */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold mb-6">
              Add New {activeView === 'hr' ? 'HR Staff' : 'Trainer'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Full Name" required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />

              <Input type="email" placeholder="Email Address" required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />

              <Input placeholder="Employee ID" required
                value={formData.empid}
                onChange={(e) => setFormData({ ...formData, empid: e.target.value })} />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {activeView === 'trainer' && (
                <select
                  required
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border"
                >
                  <option value="">Select Domain</option>
                  <option value="Java Developer">Java Developer</option>
                  <option value="Python Developer">Python Developer</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Frontend">Frontend</option>
                </select>
              )}

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">Create Account</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* ---------------- HR LIST ---------------- */}
      {activeView === 'hr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hrMembers.map((member) => (
            <Card key={member.id} glassmorphism>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{member.fullName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4" /> {member.email}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">EmpID: {member.empid}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => openEdit(member)}>
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </button>
                    <button onClick={() => confirmDelete(member.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- TRAINER LIST ---------------- */}
      {activeView === 'trainer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trainers.map((trainer) => (
            <Card key={trainer.id} glassmorphism>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{trainer.fullName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="w-4 h-4" /> {trainer.email}
                      </div>
                      <span className="inline-flex px-3 py-1 mt-2 text-xs rounded-full bg-blue-100 text-blue-800">
                        {trainer.domain}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">EmpID: {trainer.empid}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => openEdit(trainer)}>
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </button>
                    <button onClick={() => confirmDelete(trainer.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- EDIT MODAL ---------------- */}
      {showEditForm && editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-[400px] space-y-4">
            <h2 className="text-xl font-bold">Edit User</h2>

            <Input
              value={editUser.fullName}
              onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
            />

            <Input
              value={editUser.email}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            />

            <Input
              value={editUser.empid}
              onChange={(e) => setEditUser({ ...editUser, empid: e.target.value })}
            />

            <select
              value={editUser.role}
              onChange={(e) =>
                setEditUser({
                  ...editUser,
                  role: e.target.value,
                  domain: e.target.value === "trainer" ? editUser.domain : null
                })
              }
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="hr">HR</option>
              <option value="trainer">Trainer</option>
            </select>

            {editUser.role === "trainer" && (
              <select
                value={editUser.domain || ""}
                onChange={(e) =>
                  setEditUser({ ...editUser, domain: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Domain</option>
                <option value="Java Developer">Java Developer</option>
                <option value="Python Developer">Python Developer</option>
                <option value="DevOps">DevOps</option>
                <option value="Data Science">Data Science</option>
                <option value="Frontend">Frontend</option>
              </select>
            )}

            <div className="flex gap-3">
              <Button onClick={handleEditSave} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setShowEditForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
