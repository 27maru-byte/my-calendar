import { useState, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────
const CATEGORIES = {
  work:     { label: "仕事",   dot: "#8B7355", bg: "#F5F0E8" },
  personal: { label: "私生活", dot: "#A0896A", bg: "#FAF6EE" },
};

const EVENT_COLORS = [
  { key: "blue",   hex: "#9E8E78", label: "ウォームグレー" },
  { key: "green",  hex: "#B5A48A", label: "サンド" },
  { key: "red",    hex: "#C4A882", label: "キャメル" },
  { key: "purple", hex: "#8B7355", label: "ダークベージュ" },
  { key: "orange", hex: "#D4BC9A", label: "クリーム" },
  { key: "pink",   hex: "#A89070", label: "モカ" },
];

const REMINDER_OPTIONS = [
  { value: 0,    label: "予定時刻" },
  { value: 5,    label: "5分前" },
  { value: 10,   label: "10分前" },
  { value: 15,   label: "15分前" },
  { value: 30,   label: "30分前" },
  { value: 60,   label: "1時間前" },
  { value: 120,  label: "2時間前" },
  { value: 1440, label: "1日前" },
];

const today = new Date();
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const SAMPLE_TODOS = [
  { id: 1, title: "企画書を提出する", category: "work",     deadline: toDateStr(today),                              done: false },
  { id: 2, title: "歯医者の予約",     category: "personal", deadline: toDateStr(new Date(Date.now()+2*86400000)),   done: false },
  { id: 3, title: "週次レポート作成", category: "work",     deadline: toDateStr(new Date(Date.now()+4*86400000)),   done: true  },
];

const SAMPLE_EVENTS = [
  {
    id: 101, title: "チームMTG", color: "blue",
    date: toDateStr(today), startTime: "10:00", endTime: "11:00",
    isAllDay: false, location: "会議室A", isOnline: false, meetingUrl: "",
    organizer: "山田 太郎", attendees: "鈴木 花子, 田中 次郎",
    reminder: 15, notes: "Q3の進捗確認", category: "work",
  },
  {
    id: 102, title: "ランチ", color: "green",
    date: toDateStr(new Date(Date.now()+1*86400000)), startTime: "12:30", endTime: "13:30",
    isAllDay: false, location: "渋谷 ランチスポット", isOnline: false, meetingUrl: "",
    organizer: "", attendees: "佐藤 美咲",
    reminder: 30, notes: "", category: "personal",
  },
  {
    id: 103, title: "オンライン勉強会", color: "purple",
    date: toDateStr(new Date(Date.now()+3*86400000)), startTime: "19:00", endTime: "21:00",
    isAllDay: false, location: "", isOnline: true, meetingUrl: "https://meet.google.com/abc-defg-hij",
    organizer: "", attendees: "",
    reminder: 10, notes: "Flutter入門", category: "work",
  },
];

const EMPTY_EVENT = {
  title: "", color: "blue",
  date: toDateStr(today), startTime: "10:00", endTime: "11:00",
  isAllDay: false, location: "", isOnline: false, meetingUrl: "",
  organizer: "", attendees: "",
  reminder: 15, notes: "", category: "work",
};

// ── Helpers ────────────────────────────────────────────────
const isOverdueTodo = (t) =>
  !t.done && new Date(t.deadline) < new Date(toDateStr(today));

const colorHex = (key) => EVENT_COLORS.find(c => c.key === key)?.hex ?? "#8B7355";

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [todos,  setTodos]  = useState(() => {
    try { const s=localStorage.getItem("mc_todos"); return s?JSON.parse(s):SAMPLE_TODOS; } catch{ return SAMPLE_TODOS; }
  });
  const [events, setEvents] = useState(() => {
    try { const s=localStorage.getItem("mc_events"); return s?JSON.parse(s):SAMPLE_EVENTS; } catch{ return SAMPLE_EVENTS; }
  });

  useEffect(()=>{ try{localStorage.setItem("mc_todos",JSON.stringify(todos));}catch{} },[todos]);
  useEffect(()=>{ try{localStorage.setItem("mc_events",JSON.stringify(events));}catch{} },[events]);
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("all");
  const [view,   setView]  = useState("calendar");

  // modals
  const [todoModal,  setTodoModal]  = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // event object
  const [editingEvent, setEditingEvent] = useState(null); // null = new

  const [newTodo, setNewTodo] = useState({ title:"", category:"work", deadline:"" });
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const sendInvite = (ev) => {
    if(!inviteEmail) return;
    const subject = encodeURIComponent(`【招待】${ev.title}`);
    const timeStr = ev.isAllDay ? "終日" : `${ev.startTime} 〜 ${ev.endTime}`;
    const body = encodeURIComponent(
`${ev.title} にご招待します。

📅 日付：${ev.date}
🕐 時間：${timeStr}${ev.location?`\n📍 場所：${ev.location}`:""}${ev.isOnline&&ev.meetingUrl?`\n🔗 オンライン：${ev.meetingUrl}`:""}${ev.organizer?`\n👤 主催者：${ev.organizer}`:""}${ev.notes?`\n📝 メモ：${ev.notes}`:""}

ご参加をお待ちしております。`
    );
    window.open(`mailto:${encodeURIComponent(inviteEmail)}?subject=${subject}&body=${body}`);
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 3000);
  };

  // ── calendar helpers
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const monthNames  = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const dayNames    = ["日","月","火","水","木","金","土"];

  const prevMonth = () => { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); setSelectedDate(null); };
  const nextMonth = () => { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); setSelectedDate(null); };

  const dateStr = (day) => `${year}-${pad(month+1)}-${pad(day)}`;
  const isToday = (day) => toDateStr(today) === dateStr(day);

  const todosForDate  = (day) => todos.filter(t => t.deadline === dateStr(day));
  const eventsForDate = (day) => events.filter(e => e.date === dateStr(day))
    .sort((a,b) => (a.isAllDay?'00:00':a.startTime).localeCompare(b.isAllDay?'00:00':b.startTime));

  // ── todo actions
  const toggleTodo = (id) => setTodos(todos.map(t => t.id===id ? {...t,done:!t.done} : t));
  const deleteTodo = (id) => setTodos(todos.filter(t => t.id!==id));
  const addTodo = () => {
    if(!newTodo.title||!newTodo.deadline) return;
    setTodos([...todos,{...newTodo,id:Date.now(),done:false}]);
    setNewTodo({title:"",category:"work",deadline:""});
    setTodoModal(false);
  };

  // ── event actions
  const openNewEvent = () => {
    setEditingEvent(null);
    setEventForm({
      ...EMPTY_EVENT,
      date: selectedDate ? dateStr(selectedDate) : toDateStr(today),
    });
    setEventModal(true);
  };
  const openEditEvent = (ev) => {
    setEditingEvent(ev);
    setEventForm({...ev});
    setDetailModal(null);
    setEventModal(true);
  };
  const saveEvent = () => {
    if(!eventForm.title||!eventForm.date) return;
    if(editingEvent) {
      setEvents(events.map(e => e.id===editingEvent.id ? {...eventForm,id:e.id} : e));
    } else {
      setEvents([...events,{...eventForm,id:Date.now()}]);
    }
    setEventModal(false);
  };
  const deleteEvent = (id) => { setEvents(events.filter(e=>e.id!==id)); setDetailModal(null); setInviteEmail(""); setInviteSent(false); };

  // ── filtered list
  const filteredTodos = (list) => {
    if(filter==="done")    return list.filter(t=>t.done);
    if(filter==="pending") return list.filter(t=>!t.done);
    if(filter==="work")    return list.filter(t=>t.category==="work");
    if(filter==="personal")return list.filter(t=>t.category==="personal");
    return list;
  };

  const selectedDayTodos  = selectedDate ? filteredTodos(todosForDate(selectedDate))  : [];
  const selectedDayEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const stats = {
    total:   todos.length,
    done:    todos.filter(t=>t.done).length,
    overdue: todos.filter(t=>isOverdueTodo(t)).length,
  };

  // ── render
  return (
    <div style={{fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",minHeight:"100vh",background:"#F8F7F4",color:"#1a1a1a"}}>
      {/* ── Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E3DE",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:10,background:"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:"#fff",fontSize:16}}>◈</span>
          </div>
          <span style={{fontWeight:700,fontSize:17,letterSpacing:"-0.02em"}}>MyCalendar</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          {["calendar","list"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:view===v?"#1a1a1a":"transparent",color:view===v?"#fff":"#666"}}>
              {v==="calendar"?"📅 カレンダー":"📋 リスト"}
            </button>
          ))}
          <button onClick={openNewEvent} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:"#8B7355",color:"#fff"}}>＋ 予定</button>
          <button onClick={()=>{setTodoModal(true);setNewTodo({title:"",category:"work",deadline:selectedDate?dateStr(selectedDate):""});}} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:"#A0896A",color:"#fff"}}>＋ ToDo</button>
        </div>
      </div>

      {/* ── Stats */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E3DE",padding:"10px 24px",display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
        {[{l:"合計",v:stats.total,c:"#1a1a1a"},{l:"完了",v:stats.done,c:"#A0896A"},{l:"未完了",v:stats.total-stats.done,c:"#8B7355"},{l:"期限超過",v:stats.overdue,c:"#C4846A"}].map(s=>(
          <div key={s.l} style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</span>
            <span style={{fontSize:12,color:"#888"}}>{s.l}</span>
          </div>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap"}}>
          {[{k:"all",l:"すべて"},{k:"pending",l:"未完了"},{k:"done",l:"完了"},{k:"work",l:"仕事"},{k:"personal",l:"私生活"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{padding:"3px 10px",borderRadius:20,border:"1.5px solid",borderColor:filter===f.k?"#1a1a1a":"#E5E3DE",background:filter===f.k?"#1a1a1a":"#fff",color:filter===f.k?"#fff":"#555",fontSize:12,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
          ))}
        </div>
      </div>

      <div style={{padding:24,maxWidth:1100,margin:"0 auto"}}>
        {view==="calendar" ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start"}}>
            {/* ── Calendar Grid */}
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E3DE",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #F0EEE9"}}>
                <button onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:"1px solid #E5E3DE",background:"#fff",cursor:"pointer",fontSize:16}}>‹</button>
                <span style={{fontWeight:700,fontSize:17}}>{year}年 {monthNames[month]}</span>
                <button onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:"1px solid #E5E3DE",background:"#fff",cursor:"pointer",fontSize:16}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#F8F7F4"}}>
                {dayNames.map((d,i)=>(
                  <div key={d} style={{padding:"8px 0",textAlign:"center",fontSize:12,fontWeight:600,color:i===0?"#C4846A":i===6?"#8B7355":"#888"}}>{d}</div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
                {Array.from({length:firstDay}).map((_,i)=>(
                  <div key={`e${i}`} style={{minHeight:90,borderBottom:"1px solid #F0EEE9",borderRight:"1px solid #F0EEE9"}}/>
                ))}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day=i+1;
                  const colIdx=(firstDay+i)%7;
                  const dayEvs=eventsForDate(day);
                  const dayTodos=filteredTodos(todosForDate(day));
                  const isSelected=selectedDate===day;
                  return (
                    <div key={day} onClick={()=>setSelectedDate(isSelected?null:day)} style={{minHeight:90,padding:"5px 6px",borderBottom:"1px solid #F0EEE9",borderRight:"1px solid #F0EEE9",cursor:"pointer",background:isSelected?"#EFF6FF":"#fff",transition:"background 0.1s"}}>
                      <span style={{display:"inline-flex",width:24,height:24,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:isToday(day)?"#1a1a1a":"transparent",color:isToday(day)?"#fff":colIdx===0?"#C4846A":colIdx===6?"#8B7355":"#1a1a1a",fontSize:12,fontWeight:isToday(day)?700:400}}>
                        {day}
                      </span>
                      <div style={{marginTop:2,display:"flex",flexDirection:"column",gap:2}}>
                        {dayEvs.slice(0,2).map(ev=>(
                          <div key={ev.id} onClick={e=>{e.stopPropagation();setDetailModal(ev);}} style={{display:"flex",alignItems:"center",gap:3,background:colorHex(ev.color)+"22",borderLeft:`2.5px solid ${colorHex(ev.color)}`,borderRadius:"0 4px 4px 0",padding:"1px 4px",cursor:"pointer"}}>
                            <span style={{fontSize:10,color:colorHex(ev.color),fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:72}}>
                              {!ev.isAllDay&&ev.startTime} {ev.title}
                            </span>
                          </div>
                        ))}
                        {dayEvs.length>2&&<span style={{fontSize:9,color:"#888"}}>+{dayEvs.length-2}件の予定</span>}
                        {dayTodos.slice(0,2).map(t=>(
                          <div key={t.id} style={{display:"flex",alignItems:"center",gap:3}}>
                            <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:t.done?"#ccc":isOverdueTodo(t)?"#C4846A":CATEGORIES[t.category].dot}}/>
                            <span style={{fontSize:10,color:t.done?"#aaa":"#444",textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:72}}>{t.title}</span>
                          </div>
                        ))}
                        {dayTodos.length>2&&<span style={{fontSize:9,color:"#888"}}>+{dayTodos.length-2}件のToDo</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Side Panel */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* 予定パネル */}
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #E5E3DE",padding:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <p style={{fontSize:13,fontWeight:700,color:"#8B7355",margin:0}}>
                    📅 {selectedDate?`${month+1}月${selectedDate}日の予定`:"予定"}
                  </p>
                  {selectedDate&&<button onClick={openNewEvent} style={{padding:"3px 10px",borderRadius:6,border:"1.5px dashed #D4BC9A",background:"transparent",color:"#8B7355",fontSize:11,cursor:"pointer",fontWeight:600}}>＋ 追加</button>}
                </div>
                {!selectedDate ? (
                  <p style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"16px 0"}}>日付を選択してください</p>
                ) : selectedDayEvents.length===0 ? (
                  <p style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"16px 0"}}>予定はありません</p>
                ) : (
                  selectedDayEvents.map(ev=>(
                    <EventChip key={ev.id} ev={ev} onClick={()=>setDetailModal(ev)}/>
                  ))
                )}
              </div>

              {/* ToDoパネル */}
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #E5E3DE",padding:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <p style={{fontSize:13,fontWeight:700,color:"#A0896A",margin:0}}>
                    ✅ {selectedDate?`${month+1}月${selectedDate}日のToDo`:"ToDo"}
                  </p>
                  {selectedDate&&<button onClick={()=>{setTodoModal(true);setNewTodo({title:"",category:"work",deadline:dateStr(selectedDate)});}} style={{padding:"3px 10px",borderRadius:6,border:"1.5px dashed #C4B49A",background:"transparent",color:"#A0896A",fontSize:11,cursor:"pointer",fontWeight:600}}>＋ 追加</button>}
                </div>
                {!selectedDate ? (
                  <p style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"16px 0"}}>日付を選択してください</p>
                ) : selectedDayTodos.length===0 ? (
                  <p style={{fontSize:13,color:"#bbb",textAlign:"center",padding:"16px 0"}}>ToDoはありません</p>
                ) : (
                  selectedDayTodos.map(t=>(
                    <TodoItem key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} isOverdue={isOverdueTodo(t)}/>
                  ))
                )}
              </div>

            </div>
          </div>
        ) : (
          /* ── List View */
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E3DE",overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #F0EEE9",fontWeight:700,fontSize:15}}>📅 予定一覧 <span style={{fontSize:13,color:"#888",fontWeight:400}}>{events.length}件</span></div>
              <div style={{padding:14,display:"flex",flexDirection:"column",gap:8,maxHeight:600,overflowY:"auto"}}>
                {events.sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||"").localeCompare(b.startTime||"")).map(ev=>(
                  <EventChip key={ev.id} ev={ev} onClick={()=>setDetailModal(ev)} showDate/>
                ))}
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:16,border:"1px solid #E5E3DE",overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid #F0EEE9",fontWeight:700,fontSize:15}}>✅ ToDo一覧 <span style={{fontSize:13,color:"#888",fontWeight:400}}>{filteredTodos(todos).length}件</span></div>
              <div style={{padding:14,display:"flex",flexDirection:"column",gap:8,maxHeight:600,overflowY:"auto"}}>
                {filteredTodos(todos).sort((a,b)=>a.deadline.localeCompare(b.deadline)).map(t=>(
                  <TodoItem key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} isOverdue={isOverdueTodo(t)} showDate/>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ Event Detail Modal ══════════════════════════════ */}
      {detailModal&&(
        <Overlay onClick={()=>setDetailModal(null)}>
          <div style={{background:"#fff",borderRadius:20,width:460,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
            <div style={{height:6,borderRadius:"20px 20px 0 0",background:colorHex(detailModal.color)}}/>
            <div style={{padding:"20px 24px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:700,margin:0,lineHeight:1.3}}>{detailModal.title}</h2>
                  <span style={{fontSize:12,color:"#888"}}>{detailModal.category==="work"?"💼 仕事":"🏠 私生活"}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>openEditEvent(detailModal)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #E5E3DE",background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600}}>編集</button>
                  <button onClick={()=>setDetailModal(null)} style={{width:30,height:30,borderRadius:8,border:"none",background:"#F0EEE9",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <DetailRow icon="📅" label="日付" value={detailModal.date}/>
                {!detailModal.isAllDay&&<DetailRow icon="🕐" label="時間" value={`${detailModal.startTime} 〜 ${detailModal.endTime}`}/>}
                {detailModal.isAllDay&&<DetailRow icon="🌅" label="" value="終日"/>}
                {detailModal.reminder!=null&&<DetailRow icon="🔔" label="リマインダー" value={REMINDER_OPTIONS.find(r=>r.value===detailModal.reminder)?.label??"–"}/>}
                {detailModal.location&&<DetailRow icon="📍" label="場所" value={detailModal.location}/>}
                {detailModal.isOnline&&detailModal.meetingUrl&&(
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:16}}>🔗</span>
                    <div>
                      <p style={{margin:0,fontSize:11,color:"#888"}}>オンラインリンク</p>
                      <a href={detailModal.meetingUrl} target="_blank" rel="noreferrer" style={{fontSize:13,color:"#8B7355",textDecoration:"none",wordBreak:"break-all"}}>{detailModal.meetingUrl}</a>
                    </div>
                  </div>
                )}
                {detailModal.organizer&&<DetailRow icon="👤" label="主催者" value={detailModal.organizer}/>}
                {detailModal.attendees&&<DetailRow icon="👥" label="参加者" value={detailModal.attendees}/>}
                {detailModal.notes&&<DetailRow icon="📝" label="メモ" value={detailModal.notes}/>}
              </div>

              {/* ── Invite Section */}
              <div style={{marginTop:20,padding:16,borderRadius:12,background:"#FAF6EE",border:"1px solid #E8DFD0"}}>
                <p style={{margin:"0 0 10px",fontSize:13,fontWeight:700,color:"#8B7355"}}>✉️ メールで招待する</p>
                <div style={{display:"flex",gap:8}}>
                  <input
                    value={inviteEmail}
                    onChange={e=>{setInviteEmail(e.target.value);setInviteSent(false);}}
                    placeholder="招待したい人のメールアドレス"
                    type="email"
                    style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1.5px solid #D4BC9A",fontSize:13,outline:"none",background:"#fff",fontFamily:"inherit"}}
                  />
                  <button
                    onClick={()=>sendInvite(detailModal)}
                    disabled={!inviteEmail}
                    style={{padding:"9px 16px",borderRadius:8,border:"none",background:inviteEmail?"#8B7355":"#D4BC9A",color:"#fff",fontSize:13,fontWeight:700,cursor:inviteEmail?"pointer":"default",whiteSpace:"nowrap",transition:"background 0.15s"}}
                  >
                    {inviteSent?"✓ 送信済！":"送信"}
                  </button>
                </div>
                <p style={{margin:"8px 0 0",fontSize:11,color:"#A0896A"}}>
                  ※ あなたのメールアプリが開き、招待文が自動入力されます
                </p>
              </div>

              <button onClick={()=>deleteEvent(detailModal.id)} style={{marginTop:12,width:"100%",padding:"10px",borderRadius:10,border:"none",background:"#FEF2F2",color:"#C4846A",fontSize:13,fontWeight:700,cursor:"pointer"}}>🗑 この予定を削除</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ Event Form Modal ════════════════════════════════ */}
      {eventModal&&(
        <Overlay onClick={()=>setEventModal(false)}>
          <div style={{background:"#fff",borderRadius:20,width:500,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.18)"}} onClick={e=>e.stopPropagation()}>
            <div style={{height:6,borderRadius:"20px 20px 0 0",background:colorHex(eventForm.color)}}/>
            <div style={{padding:"20px 24px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
                <h2 style={{fontSize:18,fontWeight:700,margin:0}}>{editingEvent?"予定を編集":"新しい予定"}</h2>
                <button onClick={()=>setEventModal(false)} style={{width:30,height:30,borderRadius:8,border:"none",background:"#F0EEE9",cursor:"pointer",fontSize:16}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* Title */}
                <FormGroup label="タイトル *">
                  <input value={eventForm.title} onChange={e=>setEventForm({...eventForm,title:e.target.value})} placeholder="例：チームミーティング" style={inputStyle} autoFocus/>
                </FormGroup>
                {/* Color */}
                <FormGroup label="カラー">
                  <div style={{display:"flex",gap:8}}>
                    {EVENT_COLORS.map(c=>(
                      <button key={c.key} onClick={()=>setEventForm({...eventForm,color:c.key})} title={c.label} style={{width:28,height:28,borderRadius:"50%",border:`3px solid ${eventForm.color===c.key?"#1a1a1a":"transparent"}`,background:c.hex,cursor:"pointer",outline:"none"}}/>
                    ))}
                  </div>
                </FormGroup>
                {/* Category */}
                <FormGroup label="カテゴリ">
                  <div style={{display:"flex",gap:8}}>
                    {Object.entries(CATEGORIES).map(([k,v])=>(
                      <button key={k} onClick={()=>setEventForm({...eventForm,category:k})} style={{flex:1,padding:"8px",borderRadius:8,border:"2px solid",borderColor:eventForm.category===k?v.dot:"#E5E3DE",background:eventForm.category===k?v.bg:"#fff",color:eventForm.category===k?v.dot:"#888",fontSize:13,fontWeight:600,cursor:"pointer"}}>{v.label}</button>
                    ))}
                  </div>
                </FormGroup>
                {/* Date */}
                <FormGroup label="日付 *">
                  <input type="date" value={eventForm.date} onChange={e=>setEventForm({...eventForm,date:e.target.value})} style={inputStyle}/>
                </FormGroup>
                {/* All Day */}
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                  <input type="checkbox" checked={eventForm.isAllDay} onChange={e=>setEventForm({...eventForm,isAllDay:e.target.checked})} style={{width:16,height:16}}/>
                  終日
                </label>
                {/* Time */}
                {!eventForm.isAllDay&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <FormGroup label="開始時刻">
                      <input type="time" value={eventForm.startTime} onChange={e=>setEventForm({...eventForm,startTime:e.target.value})} style={inputStyle}/>
                    </FormGroup>
                    <FormGroup label="終了時刻">
                      <input type="time" value={eventForm.endTime} onChange={e=>setEventForm({...eventForm,endTime:e.target.value})} style={inputStyle}/>
                    </FormGroup>
                  </div>
                )}
                {/* Reminder */}
                <FormGroup label="🔔 リマインダー">
                  <select value={eventForm.reminder} onChange={e=>setEventForm({...eventForm,reminder:Number(e.target.value)})} style={inputStyle}>
                    {REMINDER_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </FormGroup>
                {/* Location */}
                <FormGroup label="📍 場所">
                  <input value={eventForm.location} onChange={e=>setEventForm({...eventForm,location:e.target.value})} placeholder="例：会議室A、渋谷カフェ" style={inputStyle}/>
                </FormGroup>
                {/* Online */}
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13}}>
                  <input type="checkbox" checked={eventForm.isOnline} onChange={e=>setEventForm({...eventForm,isOnline:e.target.checked})} style={{width:16,height:16}}/>
                  🔗 オンライン開催
                </label>
                {eventForm.isOnline&&(
                  <FormGroup label="ミーティングURL">
                    <input value={eventForm.meetingUrl} onChange={e=>setEventForm({...eventForm,meetingUrl:e.target.value})} placeholder="https://meet.google.com/..." style={inputStyle}/>
                  </FormGroup>
                )}
                {/* Organizer */}
                <FormGroup label="👤 主催者">
                  <input value={eventForm.organizer} onChange={e=>setEventForm({...eventForm,organizer:e.target.value})} placeholder="例：山田 太郎" style={inputStyle}/>
                </FormGroup>
                {/* Attendees */}
                <FormGroup label="👥 参加者・招待者">
                  <input value={eventForm.attendees} onChange={e=>setEventForm({...eventForm,attendees:e.target.value})} placeholder="例：鈴木 花子, 田中 次郎" style={inputStyle}/>
                </FormGroup>
                {/* Notes */}
                <FormGroup label="📝 メモ">
                  <textarea value={eventForm.notes} onChange={e=>setEventForm({...eventForm,notes:e.target.value})} placeholder="アジェンダや準備事項など…" rows={3} style={{...inputStyle,resize:"vertical"}}/>
                </FormGroup>
                {/* Buttons */}
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  <button onClick={()=>setEventModal(false)} style={{flex:1,padding:"11px",borderRadius:10,border:"1.5px solid #E5E3DE",background:"#fff",fontSize:14,cursor:"pointer",fontWeight:600}}>キャンセル</button>
                  <button onClick={saveEvent} style={{flex:2,padding:"11px",borderRadius:10,border:"none",background:colorHex(eventForm.color),color:"#fff",fontSize:14,cursor:"pointer",fontWeight:700}}>{editingEvent?"更新する":"追加する"}</button>
                </div>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ Todo Modal ══════════════════════════════════════ */}
      {todoModal&&(
        <Overlay onClick={()=>setTodoModal(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:360,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <h2 style={{fontSize:17,fontWeight:700,marginBottom:18}}>新しいToDo</h2>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <FormGroup label="タイトル *">
                <input value={newTodo.title} onChange={e=>setNewTodo({...newTodo,title:e.target.value})} placeholder="例：企画書を提出する" style={inputStyle} autoFocus/>
              </FormGroup>
              <FormGroup label="カテゴリ">
                <div style={{display:"flex",gap:8}}>
                  {Object.entries(CATEGORIES).map(([k,v])=>(
                    <button key={k} onClick={()=>setNewTodo({...newTodo,category:k})} style={{flex:1,padding:"9px",borderRadius:8,border:"2px solid",borderColor:newTodo.category===k?v.dot:"#E5E3DE",background:newTodo.category===k?v.bg:"#fff",color:newTodo.category===k?v.dot:"#888",fontSize:13,fontWeight:600,cursor:"pointer"}}>{v.label}</button>
                  ))}
                </div>
              </FormGroup>
              <FormGroup label="期限 *">
                <input type="date" value={newTodo.deadline} onChange={e=>setNewTodo({...newTodo,deadline:e.target.value})} style={inputStyle}/>
              </FormGroup>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>setTodoModal(false)} style={{flex:1,padding:"11px",borderRadius:8,border:"1.5px solid #E5E3DE",background:"#fff",fontSize:14,cursor:"pointer",fontWeight:600}}>キャンセル</button>
                <button onClick={addTodo} style={{flex:2,padding:"11px",borderRadius:8,border:"none",background:"#1a1a1a",color:"#fff",fontSize:14,cursor:"pointer",fontWeight:600}}>追加する</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function Overlay({onClick,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}} onClick={onClick}>
      {children}
    </div>
  );
}

function FormGroup({label,children}){
  return(
    <div>
      {label&&<label style={{fontSize:12,fontWeight:600,color:"#888",display:"block",marginBottom:5}}>{label}</label>}
      {children}
    </div>
  );
}

function DetailRow({icon,label,value}){
  return(
    <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
      <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{icon}</span>
      <div>
        {label&&<p style={{margin:0,fontSize:11,color:"#888"}}>{label}</p>}
        <p style={{margin:0,fontSize:13,color:"#1a1a1a",lineHeight:1.5}}>{value}</p>
      </div>
    </div>
  );
}

function EventChip({ev,onClick,showDate}){
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:"1px solid #F0EEE9",background:"#FAFAF9",cursor:"pointer",marginBottom:4,transition:"background 0.1s"}}>
      <div style={{width:4,alignSelf:"stretch",borderRadius:2,background:colorHex(ev.color),flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:13,fontWeight:600,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</p>
        <p style={{margin:0,fontSize:11,color:"#888"}}>
          {showDate&&`${ev.date} `}
          {ev.isAllDay?"終日":`${ev.startTime}〜${ev.endTime}`}
          {ev.location&&` · ${ev.location}`}
          {ev.isOnline&&" · 🔗 オンライン"}
        </p>
      </div>
      <span style={{fontSize:12,color:"#ccc"}}>›</span>
    </div>
  );
}

function TodoItem({todo,onToggle,onDelete,isOverdue,showDate}){
  const cat=CATEGORIES[todo.category];
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 10px",borderRadius:10,background:todo.done?"#FAFAF9":isOverdue?"#FAF5F0":"#fff",border:"1px solid",borderColor:todo.done?"#F0EEE9":isOverdue?"#F5E6DF":"#F0EEE9",marginBottom:2}}>
      <button onClick={()=>onToggle(todo.id)} style={{flexShrink:0,width:20,height:20,borderRadius:"50%",border:`2px solid ${todo.done?"#A0896A":"#D1D5DB"}`,background:todo.done?"#A0896A":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
        {todo.done&&<span style={{color:"#fff",fontSize:10}}>✓</span>}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:13,fontWeight:500,color:todo.done?"#aaa":"#1a1a1a",textDecoration:todo.done?"line-through":"none"}}>{todo.title}</p>
        <div style={{display:"flex",gap:6,marginTop:2}}>
          <span style={{fontSize:11,color:cat.dot,fontWeight:600}}>{cat.label}</span>
          {showDate&&<span style={{fontSize:11,color:isOverdue?"#C4846A":"#888"}}>期限:{todo.deadline}{isOverdue&&" ⚠"}</span>}
          {!showDate&&isOverdue&&<span style={{fontSize:11,color:"#C4846A",fontWeight:600}}>⚠ 超過</span>}
        </div>
      </div>
      <button onClick={()=>onDelete(todo.id)} style={{flexShrink:0,width:22,height:22,borderRadius:6,border:"none",background:"transparent",cursor:"pointer",color:"#ccc",fontSize:14}}>×</button>
    </div>
  );
}

const inputStyle={width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #E5E3DE",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
