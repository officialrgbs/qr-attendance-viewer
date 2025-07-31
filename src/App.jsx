import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const TODAY = new Date().toISOString().split("T")[0];

function App() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedSection, setSelectedSection] = useState("Gregorio Y. Zara");
  const [attendanceMap, setAttendanceMap] = useState({});

  // Listen to all students
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const studentList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(studentList);
    });

    return () => unsubscribe();
  }, []);

  // Filter students by selected section
  useEffect(() => {
    const filtered = students.filter(
      (student) => student.section === selectedSection
    );
    setFilteredStudents(filtered);
  }, [students, selectedSection]);

  // Real-time attendance updates for filtered students
  useEffect(() => {
    const unsubscribes = [];

    filteredStudents.forEach((student) => {
      const docRef = doc(db, "students", student.id, "attendance", TODAY);
      const unsubscribe = onSnapshot(docRef, (snap) => {
        setAttendanceMap((prevMap) => ({
          ...prevMap,
          [student.id]: snap.exists() ? snap.data().status : "absent",
        }));
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [filteredStudents]);

  const getStudentsByStatus = (status) =>
    filteredStudents.filter((s) => attendanceMap[s.id] === status);

  const keySuffix = (list) =>
    JSON.stringify(list.map((s) => s.id).sort()).replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Attendance – <span className="text-indigo-600">{TODAY}</span>
        </h1>

        <div className="mb-8">
          <label className="block text-md font-medium text-gray-700 mb-2">
            Filter by Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full max-w-sm border border-indigo-300 bg-white shadow-sm rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          >
            <option value="Gregorio Y. Zara">Gregorio Y. Zara</option>
            {/* Add more sections if needed */}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* On Time */}
          <div>
            <h2 className="text-xl font-semibold text-green-700 mb-4">
              ✅ On Time
            </h2>
            <AnimatePresence mode="wait">
              <motion.ul
                key={`onTime-${selectedSection}-${keySuffix(
                  getStudentsByStatus("On Time")
                )}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {getStudentsByStatus("On Time").map((student) => (
                  <li
                    key={student.id}
                    className="bg-green-100 border border-green-300 text-green-900 px-4 py-2 rounded-lg shadow hover:bg-green-200 transition"
                  >
                    {student.name}
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

          {/* Late */}
          <div>
            <h2 className="text-xl font-semibold text-yellow-700 mb-4">
              ⏰ Late
            </h2>
            <AnimatePresence mode="wait">
              <motion.ul
                key={`late-${selectedSection}-${keySuffix(
                  getStudentsByStatus("Late")
                )}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {getStudentsByStatus("Late").map((student) => (
                  <li
                    key={student.id}
                    className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-4 py-2 rounded-lg shadow hover:bg-yellow-200 transition"
                  >
                    {student.name}
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>

          {/* Absent */}
          <div>
            <h2 className="text-xl font-semibold text-red-700 mb-4">
              ❌ Absent
            </h2>
            <AnimatePresence mode="wait">
              <motion.ul
                key={`absent-${selectedSection}-${keySuffix(
                  getStudentsByStatus("absent")
                )}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {getStudentsByStatus("absent").map((student) => (
                  <li
                    key={student.id}
                    className="bg-red-100 border border-red-300 text-red-900 px-4 py-2 rounded-lg shadow hover:bg-red-200 transition"
                  >
                    {student.name}
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
