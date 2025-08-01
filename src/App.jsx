import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - offset * 60000);
  return localTime.toISOString().split("T")[0];
};

const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const isWeekend = (dateString) => {
  const day = new Date(dateString).getDay();
  return day === 0 || day === 6; // Sunday (0) or Saturday (6) Peak shit
};

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedSection, setSelectedSection] = useState("Gregorio Y. Zara");
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [mode, setMode] = useState("Time In");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "students"),
      (snapshot) => {
        const studentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching students:", err);
        setError("Failed to load students. Please try again later.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = students.filter((student) => student.section === selectedSection);
    setFilteredStudents(filtered);
  }, [students, selectedSection]);

  useEffect(() => {
    const unsubscribes = [];

    filteredStudents.forEach((student) => {
      const docRef = doc(db, "students", student.id, "attendance", selectedDate);
      const unsubscribe = onSnapshot(docRef, (snap) => {
        setAttendanceMap((prevMap) => ({
          ...prevMap,
          [student.id]: snap.exists() ? snap.data() : null,
        }));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [filteredStudents, selectedDate]);

  const getTimeInCategory = (type) => {
    return filteredStudents.filter((student) => {
      const record = attendanceMap[student.id];
      if (!record) return type === "Absent";
      if (type === "On Time") return record.status === "On Time";
      if (type === "Late") return record.status === "Late";
      return false;
    });
  };

  const getTimeOutCategory = (type) => {
    return filteredStudents.filter((student) => {
      const record = attendanceMap[student.id];
      const out = record?.timeOutTime;
      return type === "In RMCHS" ? !out : !!out;
    });
  };

  const categories = mode === "Time In"
    ? [
        {
          key: "On Time",
          title: "✅ On Time",
          text: "text-green-700",
          bg: "bg-green-100",
          border: "border-green-300",
          hover: "hover:bg-green-200",
          textItem: "text-green-900",
          list: getTimeInCategory("On Time"),
        },
        {
          key: "Late",
          title: "⏰ Late",
          text: "text-yellow-700",
          bg: "bg-yellow-100",
          border: "border-yellow-300",
          hover: "hover:bg-yellow-200",
          textItem: "text-yellow-900",
          list: getTimeInCategory("Late"),
        },
        {
          key: "Absent",
          title: "❌ Absent",
          text: "text-red-700",
          bg: "bg-red-100",
          border: "border-red-300",
          hover: "hover:bg-red-200",
          textItem: "text-red-900",
          list: getTimeInCategory("Absent"),
        },
      ]
    : [
        {
          key: "In RMCHS",
          title: "🏫 In RMCHS",
          text: "text-green-700",
          bg: "bg-green-100",
          border: "border-green-300",
          hover: "hover:bg-green-200",
          textItem: "text-green-900",
          list: getTimeOutCategory("In RMCHS"),
        },
        {
          key: "Left",
          title: "🚪 Left",
          text: "text-red-700",
          bg: "bg-red-100",
          border: "border-red-300",
          hover: "hover:bg-red-200",
          textItem: "text-red-900",
          list: getTimeOutCategory("Left"),
        },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
          Attendance – <span className="text-indigo-600">{selectedDate}</span>
        </h1>
        {loading && (
          <div className="text-center text-lg text-indigo-600 font-semibold my-12 animate-pulse">
            Loading attendance data...
          </div>
        )}
        {error && (
          <div className="text-center text-red-600 font-semibold my-12">
            {error}
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="flex justify-around text-gray-700 font-medium mb-6">
              <div>Total: {filteredStudents.length}</div>
              <div>Present: {filteredStudents.length - getTimeInCategory("Absent").length}</div>
              <div>Absent: {getTimeInCategory("Absent").length}</div>
            </div>
            <div className="flex justify-center space-x-4 mb-6">
              {["Time In", "Time Out"].map((m) => (
                <motion.button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-5 py-2 rounded-full border font-semibold transition-all ${
                    m === mode
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "bg-white text-indigo-600 border-indigo-300"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {m}
                </motion.button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Filter by Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full border border-indigo-300 bg-white shadow-sm rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                >
                  <option value="Gregorio Y. Zara">Gregorio Y. Zara</option>
                </select>
              </div>

              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={getLocalDate()}
                  className="w-full border border-indigo-300 bg-white shadow-sm rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
            </div>
            {isWeekend(selectedDate) ? (
              <div className="text-center text-xl text-gray-600 mt-12">
                📅 It's a weekend. No attendance expected.
              </div>
            ) : (
              <div className={`grid gap-6 ${mode === "Time In" ? "md:grid-cols-3" : "md:grid-cols-2"} grid-cols-1`}>
                {categories.map(({ key, title, list, text, bg, border, hover, textItem }) => (
                  <div key={key}>
                    <h2 className={`text-xl font-semibold ${text} mb-4`}>
                      {title} <span className="ml-1 text-gray-600">({list.length})</span>
                    </h2>
                    <AnimatePresence mode="wait">
                      <motion.ul
                        key={`${key}-${selectedSection}-${mode}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        {list.map((student) => {
                          const record = attendanceMap[student.id];
                          const time =
                            mode === "Time In"
                              ? record?.status !== "Absent"
                                ? record?.timeInTime
                                : null
                              : record?.timeOutTime;

                          return (
                            <motion.li
                              key={student.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              layout
                              className={`${bg} ${border} ${textItem} ${hover} px-4 py-2 rounded-lg shadow border transition`}
                            >
                              <div className="flex flex-col">
                                <span>{student.name}</span>
                                {time && <span className="text-sm text-gray-600">{time}</span>}
                              </div>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;