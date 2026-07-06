import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Code2 } from 'lucide-react';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', template: 'blank' });

  const handleCreateProject = () => {
    if (!newProject.name) return;
    const project = {
      id: 'proj_' + Date.now(),
      ...newProject,
      createdAt: new Date(),
    };
    setProjects([...projects, project]);
    setNewProject({ name: '', description: '', template: 'blank' });
    setShowForm(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🔥 Kiln</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> New Project
        </button>
      </div>

      {showForm && (
        <div className="new-project-form">
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
          <select value={newProject.template} onChange={(e) => setNewProject({ ...newProject, template: e.target.value })}>
            <option value="blank">Blank</option>
            <option value="web-app">Web App</option>
            <option value="api">REST API</option>
          </select>
          <button className="btn btn-primary" onClick={handleCreateProject}>
            Create
          </button>
        </div>
      )}

      <div className="projects-container">
        {projects.length === 0 ? (
          <div className="empty-state">
            <Code2 size={48} />
            <p>No projects yet. Create your first one!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <button className="btn btn-primary" onClick={() => navigate(`/editor/${project.id}`)}>
                  Open
                </button>
                <button className="btn btn-secondary" onClick={() => handleDeleteProject(project.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
