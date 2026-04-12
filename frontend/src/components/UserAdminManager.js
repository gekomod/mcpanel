import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FiUsers, FiPlus, FiUserPlus, FiEdit2, FiTrash2, FiSearch,
  FiX, FiCheck, FiShield, FiMail, FiUser, FiLock,
  FiAlertCircle, FiRefreshCw, FiClock, FiPlay, FiToggleLeft,
  FiToggleRight, FiServer, FiTerminal, FiKey
} from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const spin = keyframes`from{transform:rotate(0)}to{transform:rotate(360deg)}`;

const Page = styled.div`padding:0;animation:${fadeIn} .3s ease;`;

const TabBar = styled.div`display:flex;gap:4px;margin-bottom:22px;border-bottom:1px solid #3a3f57;`;
const Tab = styled.button`
  padding:10px 20px;background:none;border:none;cursor:pointer;font-size:14px;
  font-weight:${p=>p.$active?'600':'400'};
  color:${p=>p.$active?'#3b82f6':'#6b7293'};
  border-bottom:2px solid ${p=>p.$active?'#3b82f6':'transparent'};
  margin-bottom:-1px;display:flex;align-items:center;gap:7px;transition:all .2s;
  &:hover{color:${p=>p.$active?'#3b82f6':'#a4aabc'};}
`;
const Toolbar = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;flex-wrap:wrap;`;
const ToolbarLeft = styled.div`display:flex;align-items:center;gap:12px;flex-wrap:wrap;`;
const SearchWrap = styled.div`
  display:flex;align-items:center;gap:8px;background:#35394e;border:1px solid #3a3f57;
  border-radius:8px;padding:8px 12px;min-width:220px;&:focus-within{border-color:#3b82f6;}
`;
const SearchInput = styled.input`background:transparent;border:none;color:#fff;outline:none;font-size:13px;flex:1;&::placeholder{color:#6b7293;}`;
const AddBtn = styled.button`
  display:flex;align-items:center;gap:7px;padding:9px 18px;background:#3b82f6;color:#fff;
  border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;
  transition:background .2s;&:hover{background:#2563eb;}
`;
const Card = styled.div`background:#2e3245;border-radius:10px;border:1px solid #3a3f57;overflow:hidden;`;
const Table = styled.table`width:100%;border-collapse:collapse;`;
const Th = styled.th`text-align:left;padding:12px 16px;color:#6b7293;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #3a3f57;background:#2a2f45;`;
const Tr = styled.tr`border-bottom:1px solid #3a3f57;transition:background .15s;&:last-child{border-bottom:none;}&:hover{background:#222b43;}`;
const Td = styled.td`padding:12px 16px;color:#e2e8f0;font-size:13.5px;`;
const Avatar = styled.div`width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;flex-shrink:0;`;
const UserCell = styled.div`display:flex;align-items:center;gap:10px;`;
const UserName = styled.div`font-weight:600;color:#fff;font-size:13.5px;`;
const UserEmail = styled.div`font-size:12px;color:#6b7293;`;
const RoleBadge = styled.span`
  padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;
  background:${p=>({admin:'rgba(239,68,68,.15)',moderator:'rgba(251,191,36,.15)',user:'rgba(16,185,129,.15)'}[p.$r]||'rgba(107,114,128,.15)')};
  color:${p=>({admin:'#f87171',moderator:'#fbbf24',user:'#10b981'}[p.$r]||'#9ca3af')};
`;
const StatusDot = styled.span`
  display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;
  color:${p=>p.$active?'#10b981':'#6b7293'};
  &::before{content:'';width:6px;height:6px;border-radius:50%;background:${p=>p.$active?'#10b981':'#4b5268'};}
`;
const Actions = styled.div`display:flex;gap:6px;`;
const IconBtn = styled.button`
  width:30px;height:30px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;
  background:${p=>p.$del?'rgba(239,68,68,.12)':p.$green?'rgba(16,185,129,.12)':'rgba(59,130,246,.12)'};
  color:${p=>p.$del?'#f87171':p.$green?'#10b981':'#60a5fa'};
  transition:all .2s;&:hover{filter:brightness(1.4);transform:scale(1.07);}&:disabled{opacity:.35;cursor:not-allowed;transform:none;}
`;
const Empty = styled.div`text-align:center;padding:40px;color:#6b7293;font-size:14px;`;
const Spin = styled.span`display:inline-flex;animation:${spin} .8s linear infinite;`;
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:9999;animation:${fadeIn} .2s ease;`;
const Modal = styled.div`background:#2e3245;border-radius:12px;padding:28px;width:100%;max-width:520px;border:1px solid #3a3f57;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:${fadeIn} .25s ease;max-height:90vh;overflow-y:auto;`;
const ModalHead = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;padding-bottom:16px;border-bottom:1px solid #3a3f57;`;
const ModalTitle = styled.h2`font-size:18px;font-weight:700;color:#fff;margin:0;display:flex;align-items:center;gap:9px;`;
const CloseBtn = styled.button`background:none;border:none;color:#6b7293;cursor:pointer;padding:4px;display:flex;align-items:center;&:hover{color:#fff;}`;
const Field = styled.div`margin-bottom:16px;`;
const Label = styled.label`display:block;font-size:13px;font-weight:500;color:#a4aabc;margin-bottom:6px;`;
const InputWrap = styled.div`display:flex;align-items:center;gap:9px;background:#1a1f35;border:1.5px solid ${p=>p.$focus?'#3b82f6':'#2a2f4a'};border-radius:8px;padding:0 12px;transition:border-color .2s;`;
const IIcon = styled.span`color:#4b5268;font-size:15px;flex-shrink:0;`;
const Input = styled.input`flex:1;background:transparent;border:none;outline:none;color:#fff;font-size:14px;padding:10px 0;&::placeholder{color:#3a4060;}`;
const Select = styled.select`width:100%;padding:10px 12px;background:#1a1f35;border:1.5px solid #2a2f4a;border-radius:8px;color:#fff;font-size:14px;outline:none;cursor:pointer;&:focus{border-color:#3b82f6;}option{background:#1a1f35;}`;
const ModalActions = styled.div`display:flex;justify-content:flex-end;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid #3a3f57;`;
const CancelBtn = styled.button`padding:9px 18px;background:#35394e;color:#a4aabc;border:none;border-radius:8px;cursor:pointer;font-size:14px;&:hover{background:#3d4260;color:#fff;}`;
const SaveBtn = styled.button`padding:9px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;display:flex;align-items:center;gap:7px;&:hover:not(:disabled){background:#2563eb;}&:disabled{opacity:.5;cursor:not-allowed;}`;
const ErrBox = styled.div`background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:7px;padding:10px 13px;margin-bottom:14px;display:flex;align-items:center;gap:8px;color:#f87171;font-size:13px;`;
const PermGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;`;
const PermToggle = styled.label`display:flex;align-items:center;justify-content:space-between;background:#1a1f35;border:1px solid #2a2f4a;border-radius:8px;padding:10px 14px;cursor:pointer;font-size:13px;color:#a4aabc;transition:border-color .2s;&:hover{border-color:#3b82f6;}`;
const Toggle = styled.input.attrs({type:'checkbox'})`appearance:none;width:36px;height:20px;background:${p=>p.checked?'#3b82f6':'#35394e'};border-radius:10px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0;&::after{content:'';position:absolute;top:3px;left:${p=>p.checked?'19px':'3px'};width:14px;height:14px;background:#fff;border-radius:50%;transition:left .2s;}`;
const TypeBadge = styled.span`padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;background:${p=>({restart:'rgba(251,191,36,.15)',stop:'rgba(239,68,68,.15)',start:'rgba(16,185,129,.15)',command:'rgba(139,92,246,.15)'}[p.$t]||'rgba(107,114,128,.15)')};color:${p=>({restart:'#fbbf24',stop:'#f87171',start:'#10b981',command:'#a78bfa'}[p.$t]||'#9ca3af')};`;

const PERM_LABELS = {
  can_start:'Start serwera', can_stop:'Zatrzymanie', can_restart:'Restart',
  can_edit_files:'Edycja plików', can_manage_users:'Zarządzanie użytk.', can_install_plugins:'Instalacja pluginów',
};
const EMPTY_USER = {username:'',email:'',password:'',role:'user'};
const EMPTY_PERM = {user_id:'',server_id:'',can_start:false,can_stop:false,can_restart:false,can_edit_files:false,can_manage_users:false,can_install_plugins:false};
const EMPTY_TASK = {server_id:'',name:'',task_type:'restart',cron_expr:'0 3 * * *',command:'',enabled:true};

function UserAdminManager() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [userErr, setUserErr] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [focus, setFocus] = useState(null);

  const [perms, setPerms] = useState([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [servers, setServers] = useState([]);
  const [permOpen, setPermOpen] = useState(false);
  const [permForm, setPermForm] = useState(EMPTY_PERM);
  const [editPermId, setEditPermId] = useState(null);
  const [permErr, setPermErr] = useState('');
  const [permSaving, setPermSaving] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskErr, setTaskErr] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const r = await api.get('/auth/users'); setUsers(r.data||[]); }
    catch { try { const r = await api.get('/users'); setUsers(r.data||[]); } catch { toast.error('Błąd pobierania użytkowników'); } }
    finally { setLoadingUsers(false); }
  }, []);

  const fetchPerms = useCallback(async () => {
    setLoadingPerms(true);
    try { const r = await api.get('/admin/permissions'); setPerms(r.data||[]); }
    catch { toast.error('Błąd pobierania uprawnień'); }
    finally { setLoadingPerms(false); }
  }, []);

  const fetchServers = useCallback(async () => {
    try { const r = await api.get('/servers'); setServers(r.data||[]); } catch {}
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try { const r = await api.get('/admin/tasks'); setTasks(r.data||[]); }
    catch { toast.error('Błąd pobierania zadań'); }
    finally { setLoadingTasks(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchServers(); }, [fetchUsers, fetchServers]);
  useEffect(() => { if (tab==='perms') fetchPerms(); }, [tab, fetchPerms]);
  useEffect(() => { if (tab==='tasks') fetchTasks(); }, [tab, fetchTasks]);

  const F = field => ({
    value: userForm[field], onChange: e => setUserForm(p=>({...p,[field]:e.target.value})),
    onFocus: () => setFocus(field), onBlur: () => setFocus(null),
  });

  const openAdd = () => { setUserForm(EMPTY_USER); setUserErr(''); setAddOpen(true); };
  const openEdit = u => { setEditUser({...u}); setUserErr(''); setEditOpen(true); };

  const handleAddUser = async () => {
    if (!userForm.username.trim()||!userForm.email.trim()||!userForm.password) { setUserErr('Uzupełnij wszystkie pola'); return; }
    if (userForm.password.length<6) { setUserErr('Hasło min. 6 znaków'); return; }
    setUserSaving(true);
    try {
      await api.post('/auth/register', userForm);
      if (userForm.role!=='user') { const r=await api.get('/auth/users'); const nu=r.data.find(u=>u.username===userForm.username); if(nu) await api.put(`/auth/users/${nu.id}`,{role:userForm.role}); }
      toast.success(`Użytkownik "${userForm.username}" dodany`); setAddOpen(false); fetchUsers();
    } catch(err) { setUserErr(err.response?.data?.error||'Błąd dodawania'); }
    finally { setUserSaving(false); }
  };

  const handleUpdateUser = async () => {
    if (!(editUser.username||'').trim()||!(editUser.email||'').trim()) { setUserErr('Nazwa i email są wymagane'); return; }
    setUserSaving(true);
    try {
      await api.put(`/auth/users/${editUser.id}`,{username:editUser.username,email:editUser.email,role:editUser.role,is_active:editUser.is_active});
      toast.success('Zaktualizowano'); setEditOpen(false); fetchUsers();
    } catch(err) { setUserErr(err.response?.data?.error||'Błąd aktualizacji'); }
    finally { setUserSaving(false); }
  };

  const handleDeleteUser = async u => {
    if (u.id===currentUser?.id) { toast.error('Nie możesz usunąć własnego konta'); return; }
    if (!window.confirm(`Usunąć "${u.username}"?`)) return;
    try { await api.delete(`/auth/users/${u.id}`); toast.success('Usunięto'); setUsers(prev=>prev.filter(x=>x.id!==u.id)); }
    catch(err) { toast.error(err.response?.data?.error||'Błąd usuwania'); }
  };

  const openAddPerm = () => { setPermForm(EMPTY_PERM); setEditPermId(null); setPermErr(''); setPermOpen(true); };
  const openEditPerm = p => {
    setPermForm({user_id:p.user_id,server_id:p.server_id,can_start:p.can_start,can_stop:p.can_stop,can_restart:p.can_restart,can_edit_files:p.can_edit_files,can_manage_users:p.can_manage_users,can_install_plugins:p.can_install_plugins});
    setEditPermId(p.id); setPermErr(''); setPermOpen(true);
  };
  const handleSavePerm = async () => {
    if (!permForm.user_id||!permForm.server_id) { setPermErr('Wybierz użytkownika i serwer'); return; }
    setPermSaving(true);
    try { await api.post('/admin/permissions', permForm); toast.success('Zapisano'); setPermOpen(false); fetchPerms(); }
    catch(err) { setPermErr(err.response?.data?.error||'Błąd'); }
    finally { setPermSaving(false); }
  };
  const handleDeletePerm = async id => {
    if (!window.confirm('Usunąć uprawnienie?')) return;
    try { await api.delete(`/admin/permissions/${id}`); toast.success('Usunięto'); setPerms(prev=>prev.filter(p=>p.id!==id)); }
    catch(err) { toast.error(err.response?.data?.error||'Błąd'); }
  };
  const togglePerm = key => setPermForm(p=>({...p,[key]:!p[key]}));

  const openAddTask = () => { setTaskForm(EMPTY_TASK); setEditTaskId(null); setTaskErr(''); setTaskOpen(true); };
  const openEditTask = t => { setTaskForm({server_id:t.server_id,name:t.name,task_type:t.task_type,cron_expr:t.cron_expr,command:t.command||'',enabled:t.enabled}); setEditTaskId(t.id); setTaskErr(''); setTaskOpen(true); };
  const handleSaveTask = async () => {
    if (!taskForm.server_id||!taskForm.name.trim()||!taskForm.cron_expr.trim()) { setTaskErr('Uzupełnij wymagane pola'); return; }
    if (taskForm.task_type==='command'&&!taskForm.command.trim()) { setTaskErr('Wpisz komendę'); return; }
    setTaskSaving(true);
    try {
      if (editTaskId) { await api.put(`/admin/tasks/${editTaskId}`,taskForm); toast.success('Zaktualizowano'); }
      else { await api.post('/admin/tasks',taskForm); toast.success('Zadanie dodane'); }
      setTaskOpen(false); fetchTasks();
    } catch(err) { setTaskErr(err.response?.data?.error||'Błąd'); }
    finally { setTaskSaving(false); }
  };
  const handleDeleteTask = async (id,name) => {
    if (!window.confirm(`Usunąć "${name}"?`)) return;
    try { await api.delete(`/admin/tasks/${id}`); toast.success('Usunięto'); setTasks(prev=>prev.filter(t=>t.id!==id)); }
    catch(err) { toast.error(err.response?.data?.error||'Błąd'); }
  };
  const handleRunTask = async (id,name) => {
    const tid=toast.loading(`Wykonywanie "${name}"...`);
    try { await api.post(`/admin/tasks/${id}/run`); toast.update(tid,{render:`✅ Wykonano "${name}"`,type:'success',isLoading:false,autoClose:3000}); fetchTasks(); }
    catch(err) { toast.update(tid,{render:`❌ ${err.response?.data?.error||'Błąd'}`,type:'error',isLoading:false,autoClose:4000}); }
  };
  const handleToggleTask = async t => {
    try { await api.put(`/admin/tasks/${t.id}`,{enabled:!t.enabled}); setTasks(prev=>prev.map(x=>x.id===t.id?{...x,enabled:!x.enabled}:x)); }
    catch { toast.error('Błąd'); }
  };

  const filteredUsers = users.filter(u=>u.username?.toLowerCase().includes(search.toLowerCase())||(u.email||'').toLowerCase().includes(search.toLowerCase()));
  const filteredPerms = perms.filter(p=>p.username?.toLowerCase().includes(permSearch.toLowerCase())||p.server_name?.toLowerCase().includes(permSearch.toLowerCase()));
  const filteredTasks = tasks.filter(t=>t.name?.toLowerCase().includes(taskSearch.toLowerCase())||servers.find(s=>s.id===t.server_id)?.name?.toLowerCase().includes(taskSearch.toLowerCase()));
  const serverName = id => servers.find(s=>s.id===parseInt(id))?.name||`#${id}`;

  return (
    <Page>
      <TabBar>
        <Tab $active={tab==='users'} onClick={()=>setTab('users')}><FiUsers /> Użytkownicy ({users.length})</Tab>
        <Tab $active={tab==='perms'} onClick={()=>setTab('perms')}><FiKey /> Uprawnienia ({perms.length})</Tab>
        <Tab $active={tab==='tasks'} onClick={()=>setTab('tasks')}><FiClock /> Zadania ({tasks.length})</Tab>
      </TabBar>

      {tab==='users' && <>
        <Toolbar>
          <ToolbarLeft>
            <SearchWrap>
              <FiSearch color="#6b7293" size={14}/>
              <SearchInput placeholder="Szukaj użytkownika..." value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <FiX size={14} color="#6b7293" style={{cursor:'pointer'}} onClick={()=>setSearch('')}/>}
            </SearchWrap>
          </ToolbarLeft>
          <div style={{display:'flex',gap:8}}>
            <IconBtn onClick={fetchUsers}>{loadingUsers?<Spin><FiRefreshCw/></Spin>:<FiRefreshCw/>}</IconBtn>
            <AddBtn onClick={openAdd}><FiPlus/> Dodaj użytkownika</AddBtn>
          </div>
        </Toolbar>
        <Card>
          <Table>
            <thead><tr><Th>Użytkownik</Th><Th>Rola</Th><Th>Status</Th><Th>Utworzony</Th><Th style={{textAlign:'right'}}>Akcje</Th></tr></thead>
            <tbody>
              {loadingUsers ? <tr><Td colSpan={5}><Empty><Spin><FiRefreshCw/></Spin> Ładowanie...</Empty></Td></tr>
              : filteredUsers.length===0 ? <tr><Td colSpan={5}><Empty>{search?`Brak wyników dla: ${search}`:'Brak użytkowników'}</Empty></Td></tr>
              : filteredUsers.map(u=>(
                <Tr key={u.id}>
                  <Td><UserCell><Avatar>{u.username?.charAt(0)?.toUpperCase()}</Avatar><div><UserName>{u.username}</UserName><UserEmail>{u.email||'—'}</UserEmail></div></UserCell></Td>
                  <Td><RoleBadge $r={u.role}>{u.role}</RoleBadge></Td>
                  <Td><StatusDot $active={u.is_active!==false}>{u.is_active!==false?'Aktywny':'Zablokowany'}</StatusDot></Td>
                  <Td style={{color:'#6b7293',fontSize:12}}>{u.created_at?new Date(u.created_at).toLocaleDateString('pl'):'—'}</Td>
                  <Td><Actions style={{justifyContent:'flex-end'}}>
                    <IconBtn onClick={()=>openEdit(u)}><FiEdit2/></IconBtn>
                    <IconBtn $del onClick={()=>handleDeleteUser(u)} disabled={u.id===currentUser?.id}><FiTrash2/></IconBtn>
                  </Actions></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </>}

      {tab==='perms' && <>
        <Toolbar>
          <ToolbarLeft>
            <SearchWrap>
              <FiSearch color="#6b7293" size={14}/>
              <SearchInput placeholder="Szukaj po użytkowniku lub serwerze..." value={permSearch} onChange={e=>setPermSearch(e.target.value)}/>
              {permSearch && <FiX size={14} color="#6b7293" style={{cursor:'pointer'}} onClick={()=>setPermSearch('')}/>}
            </SearchWrap>
          </ToolbarLeft>
          <div style={{display:'flex',gap:8}}>
            <IconBtn onClick={fetchPerms}>{loadingPerms?<Spin><FiRefreshCw/></Spin>:<FiRefreshCw/>}</IconBtn>
            <AddBtn onClick={openAddPerm}><FiPlus/> Dodaj uprawnienie</AddBtn>
          </div>
        </Toolbar>
        <Card>
          <Table>
            <thead><tr><Th>Użytkownik</Th><Th>Serwer</Th><Th>Uprawnienia</Th><Th style={{textAlign:'right'}}>Akcje</Th></tr></thead>
            <tbody>
              {loadingPerms ? <tr><Td colSpan={4}><Empty><Spin><FiRefreshCw/></Spin> Ładowanie...</Empty></Td></tr>
              : filteredPerms.length===0 ? <tr><Td colSpan={4}><Empty>Brak uprawnień. Kliknij "Dodaj uprawnienie" aby przydzielić dostęp.</Empty></Td></tr>
              : filteredPerms.map(p=>(
                <Tr key={p.id}>
                  <Td><UserCell><Avatar>{p.username?.charAt(0)?.toUpperCase()}</Avatar><UserName>{p.username}</UserName></UserCell></Td>
                  <Td style={{color:'#a4aabc'}}><FiServer size={12} style={{marginRight:6}}/>{p.server_name}</Td>
                  <Td>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {Object.entries(PERM_LABELS).map(([key,label])=>p[key]?(
                        <span key={key} style={{padding:'2px 8px',borderRadius:12,fontSize:11,background:'rgba(59,130,246,.15)',color:'#60a5fa'}}>{label}</span>
                      ):null)}
                      {!Object.keys(PERM_LABELS).some(k=>p[k]) && <span style={{color:'#6b7293',fontSize:12}}>Tylko podgląd</span>}
                    </div>
                  </Td>
                  <Td><Actions style={{justifyContent:'flex-end'}}>
                    <IconBtn onClick={()=>openEditPerm(p)}><FiEdit2/></IconBtn>
                    <IconBtn $del onClick={()=>handleDeletePerm(p.id)}><FiTrash2/></IconBtn>
                  </Actions></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </>}

      {tab==='tasks' && <>
        <Toolbar>
          <ToolbarLeft>
            <SearchWrap>
              <FiSearch color="#6b7293" size={14}/>
              <SearchInput placeholder="Szukaj zadania..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)}/>
              {taskSearch && <FiX size={14} color="#6b7293" style={{cursor:'pointer'}} onClick={()=>setTaskSearch('')}/>}
            </SearchWrap>
          </ToolbarLeft>
          <div style={{display:'flex',gap:8}}>
            <IconBtn onClick={fetchTasks}>{loadingTasks?<Spin><FiRefreshCw/></Spin>:<FiRefreshCw/>}</IconBtn>
            <AddBtn onClick={openAddTask}><FiPlus/> Dodaj zadanie</AddBtn>
          </div>
        </Toolbar>
        <Card>
          <Table>
            <thead><tr><Th>Nazwa</Th><Th>Serwer</Th><Th>Typ</Th><Th>Cron</Th><Th>Ostatnie uruch.</Th><Th>Status</Th><Th style={{textAlign:'right'}}>Akcje</Th></tr></thead>
            <tbody>
              {loadingTasks ? <tr><Td colSpan={7}><Empty><Spin><FiRefreshCw/></Spin> Ładowanie...</Empty></Td></tr>
              : filteredTasks.length===0 ? <tr><Td colSpan={7}><Empty>Brak zadań. Kliknij "Dodaj zadanie" aby zaplanować pierwsze.</Empty></Td></tr>
              : filteredTasks.map(t=>(
                <Tr key={t.id}>
                  <Td style={{fontWeight:600,color:'#fff'}}>{t.name}</Td>
                  <Td style={{color:'#a4aabc'}}><FiServer size={12} style={{marginRight:6}}/>{serverName(t.server_id)}</Td>
                  <Td><TypeBadge $t={t.task_type}>{t.task_type}</TypeBadge></Td>
                  <Td><code style={{background:'#1a1f35',padding:'2px 7px',borderRadius:5,fontSize:12,color:'#a78bfa'}}>{t.cron_expr}</code></Td>
                  <Td style={{color:'#6b7293',fontSize:12}}>{t.last_run?new Date(t.last_run).toLocaleString('pl'):'—'}</Td>
                  <Td><StatusDot $active={t.enabled}>{t.enabled?'Aktywne':'Wyłączone'}</StatusDot></Td>
                  <Td><Actions style={{justifyContent:'flex-end'}}>
                    <IconBtn $green onClick={()=>handleRunTask(t.id,t.name)} title="Uruchom teraz"><FiPlay/></IconBtn>
                    <IconBtn onClick={()=>handleToggleTask(t)} title={t.enabled?'Wyłącz':'Włącz'}>{t.enabled?<FiToggleRight/>:<FiToggleLeft/>}</IconBtn>
                    <IconBtn onClick={()=>openEditTask(t)}><FiEdit2/></IconBtn>
                    <IconBtn $del onClick={()=>handleDeleteTask(t.id,t.name)}><FiTrash2/></IconBtn>
                  </Actions></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </>}

      {/* MODAL: Dodaj użytkownika */}
      {addOpen && (
        <Overlay onClick={()=>setAddOpen(false)}>
          <Modal onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <ModalTitle><FiUserPlus/> Nowy użytkownik</ModalTitle>
              <CloseBtn onClick={()=>setAddOpen(false)}><FiX size={20}/></CloseBtn>
            </ModalHead>
            {userErr && <ErrBox><FiAlertCircle/>{userErr}</ErrBox>}
            <Field><Label>Nazwa użytkownika *</Label><InputWrap $focus={focus==='username'}><IIcon><FiUser/></IIcon><Input placeholder="np. jankowalski" type="text" {...F('username')}/></InputWrap></Field>
            <Field><Label>Email *</Label><InputWrap $focus={focus==='email'}><IIcon><FiMail/></IIcon><Input placeholder="jan@example.com" type="email" {...F('email')}/></InputWrap></Field>
            <Field><Label>Hasło * (min. 6 znaków)</Label><InputWrap $focus={focus==='password'}><IIcon><FiLock/></IIcon><Input placeholder="••••••••" type="password" {...F('password')}/></InputWrap></Field>
            <Field><Label>Rola</Label><Select value={userForm.role} onChange={e=>setUserForm(p=>({...p,role:e.target.value}))}><option value="user">Użytkownik</option><option value="moderator">Moderator</option><option value="admin">Administrator</option></Select></Field>
            <ModalActions>
              <CancelBtn onClick={()=>setAddOpen(false)}>Anuluj</CancelBtn>
              <SaveBtn onClick={handleAddUser} disabled={userSaving}>{userSaving?<><Spin><FiRefreshCw/></Spin> Zapisywanie...</>:<><FiCheck/> Dodaj</>}</SaveBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {/* MODAL: Edytuj użytkownika */}
      {editOpen && editUser && (
        <Overlay onClick={()=>setEditOpen(false)}>
          <Modal onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <ModalTitle><FiEdit2/> Edytuj: {editUser.username}</ModalTitle>
              <CloseBtn onClick={()=>setEditOpen(false)}><FiX size={20}/></CloseBtn>
            </ModalHead>
            {userErr && <ErrBox><FiAlertCircle/>{userErr}</ErrBox>}
            <Field><Label>Nazwa użytkownika *</Label><InputWrap><IIcon><FiUser/></IIcon><Input type="text" value={editUser.username||''} onChange={e=>setEditUser(p=>({...p,username:e.target.value}))}/></InputWrap></Field>
            <Field><Label>Email *</Label><InputWrap><IIcon><FiMail/></IIcon><Input type="email" value={editUser.email||''} onChange={e=>setEditUser(p=>({...p,email:e.target.value}))}/></InputWrap></Field>
            <Field><Label>Rola</Label><Select value={editUser.role||'user'} onChange={e=>setEditUser(p=>({...p,role:e.target.value}))}><option value="user">Użytkownik</option><option value="moderator">Moderator</option><option value="admin">Administrator</option></Select></Field>
            <Field><Label>Status konta</Label><Select value={editUser.is_active?'active':'inactive'} onChange={e=>setEditUser(p=>({...p,is_active:e.target.value==='active'}))}><option value="active">Aktywny</option><option value="inactive">Zablokowany</option></Select></Field>
            <ModalActions>
              <CancelBtn onClick={()=>setEditOpen(false)}>Anuluj</CancelBtn>
              <SaveBtn onClick={handleUpdateUser} disabled={userSaving}>{userSaving?<><Spin><FiRefreshCw/></Spin> Zapisywanie...</>:<><FiCheck/> Zapisz</>}</SaveBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {/* MODAL: Uprawnienie */}
      {permOpen && (
        <Overlay onClick={()=>setPermOpen(false)}>
          <Modal onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <ModalTitle><FiShield/> {editPermId?'Edytuj uprawnienie':'Nowe uprawnienie'}</ModalTitle>
              <CloseBtn onClick={()=>setPermOpen(false)}><FiX size={20}/></CloseBtn>
            </ModalHead>
            {permErr && <ErrBox><FiAlertCircle/>{permErr}</ErrBox>}
            <Field><Label>Użytkownik *</Label>
              <Select value={permForm.user_id} onChange={e=>setPermForm(p=>({...p,user_id:parseInt(e.target.value)||''}))}>
                <option value="">— wybierz —</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
              </Select>
            </Field>
            <Field><Label>Serwer *</Label>
              <Select value={permForm.server_id} onChange={e=>setPermForm(p=>({...p,server_id:parseInt(e.target.value)||''}))}>
                <option value="">— wybierz —</option>
                {servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field><Label>Uprawnienia</Label>
              <PermGrid>
                {Object.entries(PERM_LABELS).map(([key,label])=>(
                  <PermToggle key={key}>
                    <span>{label}</span>
                    <Toggle checked={!!permForm[key]} onChange={()=>togglePerm(key)}/>
                  </PermToggle>
                ))}
              </PermGrid>
            </Field>
            <ModalActions>
              <CancelBtn onClick={()=>setPermOpen(false)}>Anuluj</CancelBtn>
              <SaveBtn onClick={handleSavePerm} disabled={permSaving}>{permSaving?<><Spin><FiRefreshCw/></Spin> Zapisywanie...</>:<><FiCheck/> Zapisz</>}</SaveBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {/* MODAL: Zadanie */}
      {taskOpen && (
        <Overlay onClick={()=>setTaskOpen(false)}>
          <Modal onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <ModalTitle><FiClock/> {editTaskId?'Edytuj zadanie':'Nowe zadanie'}</ModalTitle>
              <CloseBtn onClick={()=>setTaskOpen(false)}><FiX size={20}/></CloseBtn>
            </ModalHead>
            {taskErr && <ErrBox><FiAlertCircle/>{taskErr}</ErrBox>}
            <Field><Label>Nazwa zadania *</Label><InputWrap><IIcon><FiClock/></IIcon><Input placeholder="np. Nocny restart" value={taskForm.name} onChange={e=>setTaskForm(p=>({...p,name:e.target.value}))}/></InputWrap></Field>
            <Field><Label>Serwer *</Label>
              <Select value={taskForm.server_id} onChange={e=>setTaskForm(p=>({...p,server_id:parseInt(e.target.value)||''}))}>
                <option value="">— wybierz —</option>
                {servers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field><Label>Typ zadania *</Label>
              <Select value={taskForm.task_type} onChange={e=>setTaskForm(p=>({...p,task_type:e.target.value}))}>
                <option value="restart">Restart serwera</option>
                <option value="stop">Zatrzymanie serwera</option>
                <option value="start">Uruchomienie serwera</option>
                <option value="command">Wyślij komendę</option>
              </Select>
            </Field>
            {taskForm.task_type==='command' && (
              <Field><Label>Komenda *</Label><InputWrap><IIcon><FiTerminal/></IIcon><Input placeholder="np. say Restart za 5 minut" value={taskForm.command} onChange={e=>setTaskForm(p=>({...p,command:e.target.value}))}/></InputWrap></Field>
            )}
            <Field>
              <Label>Wyrażenie cron * <span style={{color:'#6b7293',fontWeight:400,fontSize:11}}>(min godz dzień mies dzień_tyg)</span></Label>
              <InputWrap><IIcon><FiClock/></IIcon><Input placeholder="0 3 * * *" value={taskForm.cron_expr} onChange={e=>setTaskForm(p=>({...p,cron_expr:e.target.value}))}/></InputWrap>
              <div style={{marginTop:6,fontSize:11,color:'#6b7293'}}>
                Kliknij: {[['0 3 * * *','co noc 3:00'],['0 */6 * * *','co 6h'],['0 3 * * 1','pon. 3:00'],['*/30 * * * *','co 30min']].map(([expr,desc])=>(
                  <code key={expr} style={{color:'#a78bfa',cursor:'pointer',marginRight:10}} onClick={()=>setTaskForm(p=>({...p,cron_expr:expr}))}>{expr} ({desc})</code>
                ))}
              </div>
            </Field>
            <Field><Label>Status</Label>
              <Select value={taskForm.enabled?'enabled':'disabled'} onChange={e=>setTaskForm(p=>({...p,enabled:e.target.value==='enabled'}))}>
                <option value="enabled">Aktywne</option>
                <option value="disabled">Wyłączone</option>
              </Select>
            </Field>
            <ModalActions>
              <CancelBtn onClick={()=>setTaskOpen(false)}>Anuluj</CancelBtn>
              <SaveBtn onClick={handleSaveTask} disabled={taskSaving}>{taskSaving?<><Spin><FiRefreshCw/></Spin> Zapisywanie...</>:<><FiCheck/> {editTaskId?'Zapisz':'Dodaj'}</>}</SaveBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Page>
  );
}

export default UserAdminManager;
