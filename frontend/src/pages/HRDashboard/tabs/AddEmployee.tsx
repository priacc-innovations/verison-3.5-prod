import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Upload, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import api from "../../../api/axiosInstance";

export default function AddEmployee() {
  const [singleEmailError, setSingleEmailError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    employee_id: "",
    date_of_birth: "",
    joining_date: new Date().toISOString().split("T")[0],
    department: "",
    designation: "",
    domain: "",
    salary: "",
    password: "",
  });

  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // ---------------- SINGLE ADD ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.endsWith("@priaccinnovations.ai")) {
      setSingleEmailError("Email must end with @priaccinnovations.ai");
      setTimeout(() => setSingleEmailError(""), 3000);
      return;
    }

    const payload = {
      fullName: formData.full_name,
      email: formData.email,
      password: formData.password,
      empid: formData.employee_id,
      dob: formData.date_of_birth,
      joiningDate: formData.joining_date,
      designation: formData.designation,
      domain: formData.domain,
      department: formData.department,
      baseSalary: Number(formData.salary),
      role: "employee"
    };

    try {
      await api.post("/user/add", payload);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setFormData({
          full_name: "",
          email: "",
          employee_id: "",
          date_of_birth: "",
          joining_date: new Date().toISOString().split("T")[0],
          department: "",
          designation: "",
          domain: "",
          salary: "",
          password: "",
        });
      }, 2000);

    } catch (err) {
      console.error("Failed to add employee", err);
      alert("Backend error. Check logs.");
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------------- FILE SELECT ----------------
  const handleExcelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const isExcel =
      file.type.includes("spreadsheet") ||
      file.name.endsWith(".xlsx") ||
      file.name.endsWith(".xls");

    const isCSV =
      file.type === "text/csv" || file.name.endsWith(".csv");

    if (!isExcel && !isCSV) {
      setUploadStatus("Invalid file. Please upload Excel (.xlsx/.xls) or CSV (.csv)");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setExcelFile(file);
    setUploadStatus("File selected: " + file.name);
  };

  // ---------------- BULK UPLOAD (PERFECTLY FIXED) ----------------
  const handleBulkUploadSubmit = async () => {
    if (!excelFile) return;

    try {
      let rows: any[] = [];
      const file = excelFile;
      const isCSV = file.name.toLowerCase().endsWith(".csv");

      // ----- PARSE CSV -----
      if (isCSV) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        const rawHeaders = lines[0].split(",");

        const headers = rawHeaders.map((h) => h.trim().toLowerCase());

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          let obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx]?.trim() || "";
          });
          rows.push(obj);
        }

      } else {
        // ----- PARSE EXCEL -----
        const data = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }

      if (rows.length === 0) {
        setUploadStatus("No data found in file");
        return;
      }

      // ------------ CLEAN & MAP TO BACKEND FIELDS --------------
      const employees = rows
        .map((r: any) => {
          const get = (...keys: string[]) => {
            const key = keys.find((k) => r[k] && String(r[k]).trim() !== "");
            return key ? String(r[key]).trim() : "";
          };

          // AUTO-FIX DATE FORMATS
          const fixDate = (d: string) => {
            if (!d) return "";
            if (d.includes("-") && d.length === 10) return d; // yyyy-MM-dd or dd-MM-yyyy

            try {
              const parsed = new Date(d);
              if (!isNaN(parsed.getTime()))
                return parsed.toISOString().split("T")[0];
            } catch { }

            return d;
          };

          return {
            fullName: get("full_name", "name", "fullname"),
            email: get("email"),
            empid: get("employee_id", "empid", "employee id", "emp_id"),
            dob: fixDate(get("date_of_birth", "dob", "birthdate")),
            joiningDate: fixDate(get("joining_date", "joining date")),
            department: get("department"),
            designation: get("designation"),
            domain: get("domain"),
            baseSalary: Number(get("salary", "base_salary")),
            password: get("password"),
            role: "employee"
          };
        })
        .filter((e) =>
          e.fullName &&
          e.email &&
          e.empid &&
          e.password &&
          e.email.endsWith("@priaccinnovations.ai")
        );

      if (employees.length === 0) {
        setUploadStatus("No valid records found");
        return;
      }

      await api.post("/user/add-bulk", employees);

      setUploadStatus(`Successfully uploaded ${employees.length} employees!`);
      setExcelFile(null);
      if (fileRef.current) fileRef.current.value = "";

      setTimeout(() => setUploadStatus(""), 3000);

    } catch (err) {
      console.error(err);
      setUploadStatus("Bulk upload failed");
    }
  };

  // ---------------- TEMPLATE DOWNLOAD ----------------
  const downloadCSVTemplate = () => {
    const template =
      "employee_id,full_name,email,date_of_birth,joining_date,department,designation,domain,salary,password\n" +
      "EMP011,John Doe,john@priaccinnovations.ai,1995-05-15,2025-01-15,IT,Software Developer,Java Developer,60000,temp123\n";

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_template.csv";
    a.click();
  };

  // ============= FULL UI BELOW (unchanged) =============
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Employee Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add employees individually or upload via Excel/CSV
          </p>
        </div>

        <Button variant="outline" className="gap-2" onClick={downloadCSVTemplate}>
          <Download className="w-5 h-5" /> Download Sample File
        </Button>
      </div>

      <div className="max-w-3xl">

        {/* Single Add */}
        <Card glassmorphism>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Employee Registration Form</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <Input label="Employee ID" name="employee_id" required value={formData.employee_id} onChange={handleChange} labelClassName="required-label" />
                <Input label="Full Name" name="full_name" required value={formData.full_name} onChange={handleChange} labelClassName="required-label" />
                <Input label="Email" name="email" type="email" required value={formData.email} onChange={handleChange} labelClassName="required-label" />
                <Input label="Date of Birth" name="date_of_birth" type="date" required value={formData.date_of_birth} onChange={handleChange} labelClassName="required-label" />
                <Input label="Joining Date" name="joining_date" type="date" required value={formData.joining_date} onChange={handleChange} labelClassName="required-label" />

                <div className="space-y-1">
                  <label className="required-label block mb-1">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    <option value="">Select Department</option>
                    <option value="IT">IT</option>
                   
                  </select>
                </div>

                <Input label="Designation" name="designation" required value={formData.designation} onChange={handleChange} labelClassName="required-label" />

                <div className="space-y-1">
                  <label className="required-label block mb-1">Domain</label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
                  >
                    <option value="">Select Domain</option>
                    <option value="Java Developer">Java Developer</option>
                    <option value="Python Developer">Python Developer</option>
                    <option value="Frontend">Frontend</option>
                    <option value="DevOps">DevOps</option>
                    <option value="SAP">SAP</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Java Full Stack Developer">Java Full Stack Developer</option>
                    <option value="Python Full Stack Developer">Python Full Stack Developer</option>
                    <option value="Testing">Testing</option>
                    <option value="PowerBI">PowerBI</option>
                  </select>
                </div>

                <Input label="Monthly Salary" name="salary" type="number" required value={formData.salary} onChange={handleChange} labelClassName="required-label" />
                <Input label="Password" name="password" type="password" required value={formData.password} onChange={handleChange} labelClassName="required-label" />
              </div>

              {singleEmailError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <p className="text-red-700 dark:text-red-400 font-medium">{singleEmailError}</p>
                </motion.div>
              )}

              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-green-100 rounded-lg">
                  <p className="text-green-700 font-medium">Employee added successfully!</p>
                </motion.div>
              )}

              <Button type="submit" size="lg" className="gap-2">
                <UserPlus className="w-5 h-5" /> Add Employee
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bulk Upload */}
        <Card glassmorphism className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bulk Upload via Excel / CSV</CardTitle>

              <input
                type="file"
                ref={fileRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-5 h-5" /> Upload File
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-lg mb-4 ${uploadStatus.toLowerCase().includes("invalid")
                  ? "bg-red-100 dark:bg-red-900/20"
                  : "bg-green-100 dark:bg-green-900/20"
                  }`}
              >
                <p
                  className={`font-medium ${uploadStatus.toLowerCase().includes("invalid")
                    ? "text-red-700 dark:text-red-400"
                    : "text-green-700 dark:text-green-400"
                    }`}
                >
                  {uploadStatus}
                </p>
              </motion.div>
            )}

            {excelFile && (
              <Button onClick={handleBulkUploadSubmit} className="w-full gap-2 mb-4">
                <Upload className="w-5 h-5" /> Submit File
              </Button>
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload an Excel (.xlsx / .xls) or CSV (.csv) with required employee fields.
            </p>
          </CardContent>

          <CardContent>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mt-3">
              <p className="font-semibold text-gray-900 dark:text-white">
                Bulk Upload Instructions:
              </p>

              <ul className="list-disc pl-6 space-y-1">
                <li>Only Excel or CSV files: <strong>.xlsx / .xls / .csv</strong></li>
                <li>Google Sheets must be downloaded as Excel (.xlsx) or CSV (.csv).</li>
                <li>First row must contain required fields:</li>
              </ul>

              <div className="ml-6 text-xs">
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md block mt-1">
                  employee_id, full_name, email, date_of_birth, joining_date, department, designation, domain, salary, password
                </code>
              </div>
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}
