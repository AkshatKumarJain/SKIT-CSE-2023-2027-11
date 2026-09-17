import { useState } from "react";
import "./TeamSelection.css";

function TeamSelection() {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "You",
      email: "student@college.edu",
      role: "Team Leader",
    },
  ]);

  const [search, setSearch] = useState("");

  const students = [
    {
      id: 2,
      name: "Rahul Sharma",
      email: "rahul@college.edu",
    },
    {
      id: 3,
      name: "Aman Verma",
      email: "aman@college.edu",
    },
    {
      id: 4,
      name: "Riya Singh",
      email: "riya@college.edu",
    },
  ];

  const addMember = (student) => {
    if (members.length >= 4) {
      alert("Maximum 4 members allowed");
      return;
    }

    if (members.some((member) => member.id === student.id)) {
      return;
    }

    setMembers([
      ...members,
      {
        ...student,
        role: "Member",
      },
    ]);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="team-page">
      <div className="team-container">

        {/* Page Header */}
        <div className="page-header">
          <h1>Team Selection</h1>
          <p>Create your team and select your teammates.</p>
        </div>

        <div className="team-grid">

          {/* Create Team */}
          <div className="card">
            <h2>Create Team</h2>
            <p className="card-description">
              Enter a name for your project team.
            </p>

            <label>Team Name</label>

            <input
              type="text"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />

            <button className="primary-btn">
              Create Team
            </button>
          </div>

          {/* Current Team */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2>My Team</h2>
                <p className="card-description">
                  {teamName || "No team created yet"}
                </p>
              </div>

              <span className="team-count">
                {members.length}/4
              </span>
            </div>

            <div className="members-list">
              {members.map((member) => (
                <div className="member" key={member.id}>
                  <div className="avatar">
                    {member.name.charAt(0)}
                  </div>

                  <div className="member-info">
                    <h3>{member.name}</h3>
                    <p>{member.email}</p>
                  </div>

                  <span className="role">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Find Students */}
        <div className="card students-card">
          <h2>Find Teammates</h2>

          <p className="card-description">
            Search for students and add them to your team.
          </p>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="students-list">
            {filteredStudents.map((student) => {
              const alreadyAdded = members.some(
                (member) => member.id === student.id
              );

              return (
                <div className="student-row" key={student.id}>
                  <div>
                    <h3>{student.name}</h3>
                    <p>{student.email}</p>
                  </div>

                  <button
                    className="secondary-btn"
                    disabled={alreadyAdded}
                    onClick={() => addMember(student)}
                  >
                    {alreadyAdded ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TeamSelection;