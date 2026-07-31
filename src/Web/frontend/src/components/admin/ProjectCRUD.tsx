import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Input } from "../ui/Input"

export function ProjectCRUD() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', summary: '', descriptionMdx: '', techStack: '',
    status: 'Published', order: 0, isFeatured: false
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch("http://171.233.238.34:5000/api/content/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    }
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`http://171.233.238.34:5000/api/content/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const saveProject = useMutation({
    mutationFn: async (data: any) => {
      const isEdit = !!editingProject;
      const url = isEdit 
        ? `http://171.233.238.34:5000/api/content/projects/${editingProject.id}`
        : `http://171.233.238.34:5000/api/content/projects`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to save project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
    }
  });

  const openModal = (project?: any) => {
    if (project) {
      setEditingProject(project);
      setFormData(project);
    } else {
      setEditingProject(null);
      setFormData({
        title: '', slug: '', summary: '', descriptionMdx: '', techStack: '',
        status: 'Published', order: projects.length + 1, isFeatured: false
      });
    }
    setIsModalOpen(true);
  };

  if (isLoading) return <div className="text-zinc-500 font-mono">LOADING_REGISTRY...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold">PROJECTS_REGISTRY</h1>
        <Button size="sm" onClick={() => openModal()} className="bg-[#DEFF9A] text-black hover:bg-[#DEFF9A]/80 uppercase tracking-wider">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((proj: any) => (
          <div key={proj.id} className="flex items-center justify-between p-6 border border-[#27272A] bg-[#0A0A0C] rounded-lg hover:border-[#3F3F46] transition-colors">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <h3 className="text-xl font-heading font-bold text-white">{proj.title}</h3>
                <Badge variant="outline" className={proj.status === 'Published' ? 'text-[#DEFF9A] border-[#DEFF9A]' : 'text-zinc-500'}>
                  {proj.status}
                </Badge>
              </div>
              <div className="text-sm font-mono text-zinc-500">Tech Stack: {proj.techStack}</div>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => openModal(proj)} className="text-[#00E5FF] hover:bg-[#00E5FF]/10">
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" size="icon" 
                onClick={() => { if (confirm("Are you sure?")) deleteProject.mutate(proj.id); }}
                className="text-[#F43F5E] hover:bg-[#F43F5E]/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="p-8 border border-dashed border-[#27272A] rounded-lg text-center text-zinc-500 font-mono">NO_PROJECTS_FOUND</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121215] border border-[#27272A] rounded-lg w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-heading">{editingProject ? 'EDIT_PROJECT' : 'NEW_PROJECT'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-zinc-500"><X className="w-5 h-5"/></Button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveProject.mutate(formData); }} className="space-y-4">
              <Input placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              <Input placeholder="Slug (e.g. my-project)" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} required />
              <Input placeholder="Tech Stack (e.g. React, .NET)" value={formData.techStack} onChange={e => setFormData({...formData, techStack: e.target.value})} />
              <Input placeholder="Summary" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#27272A]">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saveProject.isPending} className="bg-[#00E5FF] text-black hover:bg-[#00E5FF]/80">
                  {saveProject.isPending ? 'SAVING...' : 'SAVE_PROJECT'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
