import { useState, useEffect } from "react";

// ── カラーパレット（ベージュ統一）─────────────────────────
const P = {
  bg:       "#F5F1EC",
  white:    "#FDFCFA",
  border:   "#E3CBA9",
  border2:  "#EBDCC8",
  text:     "#3a3028",
  muted:    "#968B79",
  accent1:  "#AF9263",  // ダークゴールドベージュ
  accent2:  "#968B79",  // グレーベージュ
  soft1:    "#EFE8DD",  // 薄ベージュ背景
  soft2:    "#E6D5BA",  // ミディアムベージュ
  overdue:  "#C4846A",
  done:     "#CFBAAF",
  sun:      "#C4846A",
  sat:      "#AF9263",
};

const CATEGORIES = {
  work:     { label: "仕事",   dot: P.accent1, bg: "#F5EFE6" },
  personal: { label: "私生活", dot: P.accent2, bg: "#EFE8DD" },
};

const EVENT_COLORS = [
  { key: "c1", hex: "#AF9263", label: "ゴールド" },
  { key: "c2", hex: "#968B79", label: "グレージュ" },
  { key: "c3", hex: "#E6D5BA", label: "サンド" },
  { key: "c4", hex: "#EBDCC8", label: "クリーム" },
  { key: "c5", hex: "#8B7F82", label: "モーヴ" },
  { key: "c6", hex: "#CFBAAF", label: "ローズベージュ" },
];

const REMINDER_OPTIONS = [
  { value: -1,   label: "なし" },
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
  { id: 1, title: "企画書を提出する", category: "work",     deadline: toDateStr(today), done: false },
  { id: 2, title: "歯医者の予約",     category: "personal", deadline: toDateStr(new Date(Date.now()+2*86400000)), done: false },
  { id: 3, title: "週次レポート作成", category: "work",     deadline: toDateStr(new Date(Date.now()+4*86400000)), done: true },
];

const SAMPLE_EVENTS = [
  { id: 101, title: "チームMTG", color: "c1", date: toDateStr(today), startTime: "10:00", endTime: "11:00", isAllDay: false, location: "会議室A", isOnline: false, meetingUrl: "", organizer: "山田 太郎", attendees: "鈴木 花子", reminder: 15, reminder2: 60, notes: "Q3進捗確認", category: "work" },
  { id: 102, title: "ランチ", color: "c2", date: toDateStr(new Date(Date.now()+1*86400000)), startTime: "12:30", endTime: "13:30", isAllDay: false, location: "渋谷", isOnline: false, meetingUrl: "", organizer: "", attendees: "佐藤 美咲", reminder: 30, reminder2: -1, notes: "", category: "personal" },
  { id: 103, title: "オンライン勉強会", color: "c5", date: toDateStr(new Date(Date.now()+3*86400000)), startTime: "19:00", endTime: "21:00", isAllDay: false, location: "", isOnline: true, meetingUrl: "https://meet.google.com/abc-defg-hij", organizer: "", attendees: "", reminder: 10, reminder2: -1, notes: "Flutter入門", category: "work" },
];

const EMPTY_EVENT = {
  title: "", color: "c1", date: toDateStr(today), startTime: "10:00", endTime: "11:00",
  isAllDay: false, location: "", isOnline: false, meetingUrl: "",
  organizer: "", attendees: "", reminder: 15, reminder2: -1, notes: "", category: "work",
};

const isOverdueTodo = (t) => !t.done && new Date(t.deadline) < new Date(toDateStr(today));
const colorHex = (key) => EVENT_COLORS.find(c => c.key === key)?.hex ?? P.accent1;
const reminderLabel = (v) => REMINDER_OPTIONS.find(r => r.value === v)?.label ?? "–";

export default function App() {
  const [todos,  setTodos]  = useState(() => { try { const s=localStorage.getItem("mc_todos");  return s?JSON.parse(s):SAMPLE_TODOS;  } catch{ return SAMPLE_TODOS; } });
  const [events, setEvents] = useState(() => { try { const s=localStorage.getItem("mc_events"); return s?JSON.parse(s):SAMPLE_EVENTS; } catch{ return SAMPLE_EVENTS; } });
  useEffect(()=>{ try{localStorage.setItem("mc_todos", JSON.stringify(todos));}catch{} },[todos]);
  useEffect(()=>{ try{localStorage.setItem("mc_events",JSON.stringify(events));}catch{} },[events]);

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState("all");
  const [view,   setView]  = useState("calendar");
  const [mobilePanel, setMobilePanel] = useState("calendar"); // "calendar"|"events"|"todos"

  const [todoModal,   setTodoModal]   = useState(false);
  const [eventModal,  setEventModal]  = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [editingEvent,setEditingEvent]= useState(null);

  const [newTodo,    setNewTodo]    = useState({ title:"", category:"work", deadline:"" });
  const [eventForm,  setEventForm]  = useState(EMPTY_EVENT);
  const [inviteEmail,setInviteEmail]= useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const monthNames  = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const dayNames    = ["日","月","火","水","木","金","土"];

  const prevMonth = () => { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); setSelectedDate(null); };
  const nextMonth = () => { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); setSelectedDate(null); };
  const dateStr  = (day) => `${year}-${pad(month+1)}-${pad(day)}`;
  const isToday  = (day) => toDateStr(today) === dateStr(day);
  const todosForDate  = (day) => todos.filter(t => t.deadline === dateStr(day));
  const eventsForDate = (day) => events.filter(e => e.date === dateStr(day)).sort((a,b)=>(a.isAllDay?'00:00':a.startTime).localeCompare(b.isAllDay?'00:00':b.startTime));

  const toggleTodo = (id) => setTodos(todos.map(t => t.id===id?{...t,done:!t.done}:t));
  const deleteTodo = (id) => setTodos(todos.filter(t=>t.id!==id));
  const addTodo = () => {
    if(!newTodo.title||!newTodo.deadline) return;
    setTodos([...todos,{...newTodo,id:Date.now(),done:false}]);
    setNewTodo({title:"",category:"work",deadline:""});
    setTodoModal(false);
  };

  const openNewEvent = () => { setEditingEvent(null); setEventForm({...EMPTY_EVENT,date:selectedDate?dateStr(selectedDate):toDateStr(today)}); setEventModal(true); };
  const openEditEvent = (ev) => { setEditingEvent(ev); setEventForm({...ev}); setDetailModal(null); setEventModal(true); };
  const saveEvent = () => {
    if(!eventForm.title||!eventForm.date) return;
    if(editingEvent){ setEvents(events.map(e=>e.id===editingEvent.id?{...eventForm,id:e.id}:e)); }
    else { setEvents([...events,{...eventForm,id:Date.now()}]); }
    setEventModal(false);
  };
  const deleteEvent = (id) => { setEvents(events.filter(e=>e.id!==id)); setDetailModal(null); setInviteEmail(""); };

  const sendInvite = (ev) => {
    if(!inviteEmail) return;
    const subject = encodeURIComponent(`【招待】${ev.title}`);
    const timeStr = ev.isAllDay?"終日":`${ev.startTime} 〜 ${ev.endTime}`;
    const body = encodeURIComponent(`${ev.title} にご招待します。\n\n📅 日付：${ev.date}\n🕐 時間：${timeStr}${ev.location?`\n📍 場所：${ev.location}`:""}${ev.isOnline&&ev.meetingUrl?`\n🔗 オンライン：${ev.meetingUrl}`:""}${ev.organizer?`\n👤 主催者：${ev.organizer}`:""}${ev.notes?`\n📝 メモ：${ev.notes}`:""}\n\nご参加をお待ちしております。`);
    window.open(`mailto:${encodeURIComponent(inviteEmail)}?subject=${subject}&body=${body}`);
    setInviteSent(true); setTimeout(()=>setInviteSent(false),3000);
  };

  const filteredTodos = (list) => {
    if(filter==="done")    return list.filter(t=>t.done);
    if(filter==="pending") return list.filter(t=>!t.done);
    if(filter==="work")    return list.filter(t=>t.category==="work");
    if(filter==="personal")return list.filter(t=>t.category==="personal");
    return list;
  };

  const selectedDayTodos  = selectedDate ? filteredTodos(todosForDate(selectedDate))  : [];
  const selectedDayEvents = selectedDate ? eventsForDate(selectedDate) : [];
  const stats = { total:todos.length, done:todos.filter(t=>t.done).length, overdue:todos.filter(t=>isOverdueTodo(t)).length };

  const handleDayClick = (day) => {
    setSelectedDate(selectedDate===day?null:day);
    setMobilePanel("events");
  };

  // ── カレンダーグリッド（共通）
  const CalendarGrid = () => (
    <div style={{background:P.white,borderRadius:16,border:`1px solid ${P.border2}`,overflow:"hidden"}}>
      <div style={{padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${P.soft1}`}}>
        <button onClick={prevMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${P.border2}`,background:P.white,cursor:"pointer",fontSize:16,color:P.text}}>‹</button>
        <span style={{fontWeight:700,fontSize:16,color:P.text}}>{year}年 {monthNames[month]}</span>
        <button onClick={nextMonth} style={{width:32,height:32,borderRadius:8,border:`1px solid ${P.border2}`,background:P.white,cursor:"pointer",fontSize:16,color:P.text}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:P.soft1}}>
        {dayNames.map((d,i)=>(
          <div key={d} style={{padding:"7px 0",textAlign:"center",fontSize:12,fontWeight:600,color:i===0?P.sun:i===6?P.sat:P.muted}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
        {Array.from({length:firstDay}).map((_,i)=>(
          <div key={`e${i}`} style={{minHeight:76,borderBottom:`1px solid ${P.soft1}`,borderRight:`1px solid ${P.soft1}`}}/>
        ))}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const day=i+1; const colIdx=(firstDay+i)%7;
          const dayEvs=eventsForDate(day); const dayTodos=filteredTodos(todosForDate(day));
          const isSel=selectedDate===day;
          return (
            <div key={day} onClick={()=>handleDayClick(day)} style={{minHeight:76,padding:"4px 5px",borderBottom:`1px solid ${P.soft1}`,borderRight:`1px solid ${P.soft1}`,cursor:"pointer",background:isSel?P.soft2:P.white,transition:"background 0.1s"}}>
              <span style={{display:"inline-flex",width:22,height:22,alignItems:"center",justifyContent:"center",borderRadius:"50%",background:isToday(day)?P.accent1:"transparent",color:isToday(day)?P.white:colIdx===0?P.sun:colIdx===6?P.sat:P.text,fontSize:11,fontWeight:isToday(day)?700:400}}>
                {day}
              </span>
              <div style={{marginTop:2,display:"flex",flexDirection:"column",gap:1}}>
                {dayEvs.slice(0,2).map(ev=>(
                  <div key={ev.id} onClick={e=>{e.stopPropagation();setDetailModal(ev);}} style={{display:"flex",alignItems:"center",gap:2,background:colorHex(ev.color)+"33",borderLeft:`2px solid ${colorHex(ev.color)}`,borderRadius:"0 3px 3px 0",padding:"1px 3px",cursor:"pointer"}}>
                    <span style={{fontSize:9,color:colorHex(ev.color),fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60}}>{!ev.isAllDay&&ev.startTime} {ev.title}</span>
                  </div>
                ))}
                {dayEvs.length>2&&<span style={{fontSize:8,color:P.muted}}>+{dayEvs.length-2}件</span>}
                {dayTodos.slice(0,2).map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:2}}>
                    <div style={{width:4,height:4,borderRadius:"50%",flexShrink:0,background:t.done?P.done:isOverdueTodo(t)?P.overdue:CATEGORIES[t.category].dot}}/>
                    <span style={{fontSize:9,color:t.done?P.done:"#555",textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:60}}>{t.title}</span>
                  </div>
                ))}
                {dayTodos.length>2&&<span style={{fontSize:8,color:P.muted}}>+{dayTodos.length-2}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── サイドパネル（予定）
  const EventsPanel = () => (
    <div style={{background:P.white,borderRadius:12,border:`1px solid ${P.border2}`,padding:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <p style={{fontSize:13,fontWeight:700,color:P.accent1,margin:0}}>📅 {selectedDate?`${month+1}月${selectedDate}日の予定`:"予定"}</p>
        {selectedDate&&<button onClick={openNewEvent} style={{padding:"3px 10px",borderRadius:6,border:`1.5px dashed ${P.border}`,background:"transparent",color:P.accent1,fontSize:11,cursor:"pointer",fontWeight:600}}>＋ 追加</button>}
      </div>
      {!selectedDate?(
        <p style={{fontSize:13,color:P.done,textAlign:"center",padding:"16px 0"}}>日付を選択してください</p>
      ):selectedDayEvents.length===0?(
        <p style={{fontSize:13,color:P.done,textAlign:"center",padding:"16px 0"}}>予定はありません</p>
      ):(
        selectedDayEvents.map(ev=><EventChip key={ev.id} ev={ev} onClick={()=>setDetailModal(ev)}/>)
      )}
    </div>
  );

  // ── サイドパネル（ToDo）
  const TodosPanel = () => (
    <div style={{background:P.white,borderRadius:12,border:`1px solid ${P.border2}`,padding:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <p style={{fontSize:13,fontWeight:700,color:P.accent2,margin:0}}>✅ {selectedDate?`${month+1}月${selectedDate}日のToDo`:"ToDo"}</p>
        {selectedDate&&<button onClick={()=>{setTodoModal(true);setNewTodo({title:"",category:"work",deadline:dateStr(selectedDate)});}} style={{padding:"3px 10px",borderRadius:6,border:`1.5px dashed ${P.border2}`,background:"transparent",color:P.accent2,fontSize:11,cursor:"pointer",fontWeight:600}}>＋ 追加</button>}
      </div>
      {!selectedDate?(
        <p style={{fontSize:13,color:P.done,textAlign:"center",padding:"16px 0"}}>日付を選択してください</p>
      ):selectedDayTodos.length===0?(
        <p style={{fontSize:13,color:P.done,textAlign:"center",padding:"16px 0"}}>ToDoはありません</p>
      ):(
        selectedDayTodos.map(t=><TodoItem key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} isOverdue={isOverdueTodo(t)}/>)
      )}
    </div>
  );

  return (
    <div style={{fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",minHeight:"100vh",background:P.bg,color:P.text}}>

      {/* ── Header */}
      <div style={{background:P.white,borderBottom:`1px solid ${P.border2}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:9,background:P.accent1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{color:P.white,fontSize:14}}>◈</span>
          </div>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:"-0.02em",color:P.text}}>MyCalendar</span>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {["calendar","list"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"5px 11px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:view===v?P.accent1:"transparent",color:view===v?P.white:P.muted}}>
              {v==="calendar"?"📅 カレンダー":"📋 リスト"}
            </button>
          ))}
          <button onClick={openNewEvent} style={{padding:"5px 11px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:P.accent1,color:P.white}}>＋ 予定</button>
          <button onClick={()=>{setTodoModal(true);setNewTodo({title:"",category:"work",deadline:selectedDate?dateStr(selectedDate):"" });}} style={{padding:"5px 11px",borderRadius:7,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:P.accent2,color:P.white}}>＋ ToDo</button>
        </div>
      </div>

      {/* ── Stats */}
      <div style={{background:P.white,borderBottom:`1px solid ${P.border2}`,padding:"8px 16px",display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
        {[{l:"合計",v:stats.total,c:P.text},{l:"完了",v:stats.done,c:P.accent2},{l:"未完了",v:stats.total-stats.done,c:P.accent1},{l:"期限超過",v:stats.overdue,c:P.overdue}].map(s=>(
          <div key={s.l} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</span>
            <span style={{fontSize:11,color:P.muted}}>{s.l}</span>
          </div>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:4,flexWrap:"wrap"}}>
          {[{k:"all",l:"すべて"},{k:"pending",l:"未完了"},{k:"done",l:"完了"},{k:"work",l:"仕事"},{k:"personal",l:"私生活"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{padding:"2px 9px",borderRadius:20,border:`1.5px solid`,borderColor:filter===f.k?P.accent1:P.border2,background:filter===f.k?P.accent1:P.white,color:filter===f.k?P.white:P.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{f.l}</button>
          ))}
        </div>
      </div>

      {/* ── Body */}
      {view==="calendar" ? (
        <>
          {/* === PC レイアウト（768px以上）=== */}
          <div style={{padding:20,maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 300px",gap:16}} className="desktop-layout">
            <CalendarGrid/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <EventsPanel/><TodosPanel/>
            </div>
          </div>

          {/* === スマホ レイアウト（タブ切り替え）=== */}
          <div style={{display:"none"}} className="mobile-layout">
            {/* タブ */}
            <div style={{display:"flex",background:P.white,borderBottom:`1px solid ${P.border2}`,position:"sticky",top:57,zIndex:40}}>
              {[{k:"calendar",l:"📅 カレンダー"},{k:"events",l:"予定"},{k:"todos",l:"ToDo"}].map(t=>(
                <button key={t.k} onClick={()=>setMobilePanel(t.k)} style={{flex:1,padding:"10px 4px",border:"none",background:"transparent",fontSize:12,fontWeight:600,color:mobilePanel===t.k?P.accent1:P.muted,borderBottom:`2px solid ${mobilePanel===t.k?P.accent1:"transparent"}`,cursor:"pointer"}}>
                  {t.l}{t.k!=="calendar"&&selectedDate?` (${month+1}/${selectedDate})`:""}
                </button>
              ))}
            </div>
            <div style={{padding:12}}>
              {mobilePanel==="calendar"&&<CalendarGrid/>}
              {mobilePanel==="events"&&<EventsPanel/>}
              {mobilePanel==="todos"&&<TodosPanel/>}
            </div>
          </div>
        </>
      ) : (
        <div style={{padding:20,maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:P.white,borderRadius:16,border:`1px solid ${P.border2}`,overflow:"hidden"}}>
            <div style={{padding:"13px 16px",borderBottom:`1px solid ${P.soft1}`,fontWeight:700,fontSize:14,color:P.text}}>📅 予定一覧 <span style={{fontSize:12,color:P.muted,fontWeight:400}}>{events.length}件</span></div>
            <div style={{padding:12,display:"flex",flexDirection:"column",gap:6,maxHeight:600,overflowY:"auto"}}>
              {events.sort((a,b)=>a.date.localeCompare(b.date)||(a.startTime||"").localeCompare(b.startTime||"")).map(ev=>(
                <EventChip key={ev.id} ev={ev} onClick={()=>setDetailModal(ev)} showDate/>
              ))}
            </div>
          </div>
          <div style={{background:P.white,borderRadius:16,border:`1px solid ${P.border2}`,overflow:"hidden"}}>
            <div style={{padding:"13px 16px",borderBottom:`1px solid ${P.soft1}`,fontWeight:700,fontSize:14,color:P.text}}>✅ ToDo一覧 <span style={{fontSize:12,color:P.muted,fontWeight:400}}>{filteredTodos(todos).length}件</span></div>
            <div style={{padding:12,display:"flex",flexDirection:"column",gap:6,maxHeight:600,overflowY:"auto"}}>
              {filteredTodos(todos).sort((a,b)=>a.deadline.localeCompare(b.deadline)).map(t=>(
                <TodoItem key={t.id} todo={t} onToggle={toggleTodo} onDelete={deleteTodo} isOverdue={isOverdueTodo(t)} showDate/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ 予定詳細モーダル ═══════════════════════════════ */}
      {detailModal&&(
        <Overlay onClick={()=>setDetailModal(null)}>
          <div style={{background:P.white,borderRadius:20,width:"min(460px,95vw)",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{height:5,borderRadius:"20px 20px 0 0",background:colorHex(detailModal.color)}}/>
            <div style={{padding:"18px 22px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <h2 style={{fontSize:19,fontWeight:700,margin:0,color:P.text}}>{detailModal.title}</h2>
                  <span style={{fontSize:12,color:P.muted}}>{detailModal.category==="work"?"💼 仕事":"🏠 私生活"}</span>
                </div>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={()=>openEditEvent(detailModal)} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${P.border2}`,background:P.white,cursor:"pointer",fontSize:12,fontWeight:600,color:P.text}}>編集</button>
                  <button onClick={()=>setDetailModal(null)} style={{width:28,height:28,borderRadius:7,border:"none",background:P.soft1,cursor:"pointer",fontSize:15,color:P.muted}}>×</button>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:11}}>
                <DR icon="📅" label="日付" value={detailModal.date}/>
                {!detailModal.isAllDay&&<DR icon="🕐" label="時間" value={`${detailModal.startTime} 〜 ${detailModal.endTime}`}/>}
                {detailModal.isAllDay&&<DR icon="🌅" label="" value="終日"/>}
                {detailModal.reminder!=-1&&<DR icon="🔔" label="リマインダー1" value={reminderLabel(detailModal.reminder)}/>}
                {detailModal.reminder2!=-1&&<DR icon="🔔" label="リマインダー2" value={reminderLabel(detailModal.reminder2)}/>}
                {detailModal.location&&<DR icon="📍" label="場所" value={detailModal.location}/>}
                {detailModal.isOnline&&detailModal.meetingUrl&&(
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:15}}>🔗</span>
                    <div><p style={{margin:0,fontSize:11,color:P.muted}}>オンラインリンク</p><a href={detailModal.meetingUrl} target="_blank" rel="noreferrer" style={{fontSize:12,color:P.accent1,textDecoration:"none",wordBreak:"break-all"}}>{detailModal.meetingUrl}</a></div>
                  </div>
                )}
                {detailModal.organizer&&<DR icon="👤" label="主催者" value={detailModal.organizer}/>}
                {detailModal.attendees&&<DR icon="👥" label="参加者" value={detailModal.attendees}/>}
                {detailModal.notes&&<DR icon="📝" label="メモ" value={detailModal.notes}/>}
              </div>
              {/* 招待 */}
              <div style={{marginTop:18,padding:14,borderRadius:11,background:P.soft1,border:`1px solid ${P.border2}`}}>
                <p style={{margin:"0 0 9px",fontSize:12,fontWeight:700,color:P.accent1}}>✉️ メールで招待する</p>
                <div style={{display:"flex",gap:7}}>
                  <input value={inviteEmail} onChange={e=>{setInviteEmail(e.target.value);setInviteSent(false);}} placeholder="メールアドレス" type="email" style={{flex:1,...iStyle,background:P.white}}/>
                  <button onClick={()=>sendInvite(detailModal)} disabled={!inviteEmail} style={{padding:"8px 14px",borderRadius:7,border:"none",background:inviteEmail?P.accent1:P.done,color:P.white,fontSize:12,fontWeight:700,cursor:inviteEmail?"pointer":"default"}}>
                    {inviteSent?"✓ 送信済":"送信"}
                  </button>
                </div>
                <p style={{margin:"6px 0 0",fontSize:10,color:P.muted}}>※ メールアプリが開き招待文が自動入力されます</p>
              </div>
              <button onClick={()=>deleteEvent(detailModal.id)} style={{marginTop:10,width:"100%",padding:"9px",borderRadius:9,border:"none",background:"#FEF2F2",color:P.overdue,fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑 この予定を削除</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ 予定フォームモーダル ════════════════════════════ */}
      {eventModal&&(
        <Overlay onClick={()=>setEventModal(false)}>
          <div style={{background:P.white,borderRadius:20,width:"min(500px,95vw)",maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{height:5,borderRadius:"20px 20px 0 0",background:colorHex(eventForm.color)}}/>
            <div style={{padding:"18px 22px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <h2 style={{fontSize:17,fontWeight:700,margin:0,color:P.text}}>{editingEvent?"予定を編集":"新しい予定"}</h2>
                <button onClick={()=>setEventModal(false)} style={{width:28,height:28,borderRadius:7,border:"none",background:P.soft1,cursor:"pointer",fontSize:15,color:P.muted}}>×</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:13}}>
                <FG label="タイトル *"><input value={eventForm.title} onChange={e=>setEventForm({...eventForm,title:e.target.value})} placeholder="例：チームミーティング" style={iStyle} autoFocus/></FG>
                <FG label="カラー">
                  <div style={{display:"flex",gap:7}}>
                    {EVENT_COLORS.map(c=>(
                      <button key={c.key} onClick={()=>setEventForm({...eventForm,color:c.key})} title={c.label} style={{width:26,height:26,borderRadius:"50%",border:`3px solid ${eventForm.color===c.key?P.text:"transparent"}`,background:c.hex,cursor:"pointer"}}/>
                    ))}
                  </div>
                </FG>
                <FG label="カテゴリ">
                  <div style={{display:"flex",gap:7}}>
                    {Object.entries(CATEGORIES).map(([k,v])=>(
                      <button key={k} onClick={()=>setEventForm({...eventForm,category:k})} style={{flex:1,padding:"7px",borderRadius:7,border:"2px solid",borderColor:eventForm.category===k?v.dot:P.border2,background:eventForm.category===k?v.bg:P.white,color:eventForm.category===k?v.dot:P.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{v.label}</button>
                    ))}
                  </div>
                </FG>
                <FG label="日付 *"><input type="date" value={eventForm.date} onChange={e=>setEventForm({...eventForm,date:e.target.value})} style={iStyle}/></FG>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:P.text}}>
                  <input type="checkbox" checked={eventForm.isAllDay} onChange={e=>setEventForm({...eventForm,isAllDay:e.target.checked})} style={{width:15,height:15}}/> 終日
                </label>
                {!eventForm.isAllDay&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                    <FG label="開始時刻"><input type="time" value={eventForm.startTime} onChange={e=>setEventForm({...eventForm,startTime:e.target.value})} style={iStyle}/></FG>
                    <FG label="終了時刻"><input type="time" value={eventForm.endTime}   onChange={e=>setEventForm({...eventForm,endTime:e.target.value})}   style={iStyle}/></FG>
                  </div>
                )}
                {/* リマインダー2個 */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
                  <FG label="🔔 リマインダー1">
                    <select value={eventForm.reminder} onChange={e=>setEventForm({...eventForm,reminder:Number(e.target.value)})} style={iStyle}>
                      {REMINDER_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </FG>
                  <FG label="🔔 リマインダー2">
                    <select value={eventForm.reminder2} onChange={e=>setEventForm({...eventForm,reminder2:Number(e.target.value)})} style={iStyle}>
                      {REMINDER_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </FG>
                </div>
                <FG label="📍 場所"><input value={eventForm.location} onChange={e=>setEventForm({...eventForm,location:e.target.value})} placeholder="例：会議室A" style={iStyle}/></FG>
                <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:P.text}}>
                  <input type="checkbox" checked={eventForm.isOnline} onChange={e=>setEventForm({...eventForm,isOnline:e.target.checked})} style={{width:15,height:15}}/> 🔗 オンライン開催
                </label>
                {eventForm.isOnline&&<FG label="ミーティングURL"><input value={eventForm.meetingUrl} onChange={e=>setEventForm({...eventForm,meetingUrl:e.target.value})} placeholder="https://meet.google.com/..." style={iStyle}/></FG>}
                <FG label="👤 主催者"><input value={eventForm.organizer} onChange={e=>setEventForm({...eventForm,organizer:e.target.value})} placeholder="例：山田 太郎" style={iStyle}/></FG>
                <FG label="👥 参加者・招待者"><input value={eventForm.attendees} onChange={e=>setEventForm({...eventForm,attendees:e.target.value})} placeholder="例：鈴木 花子, 田中 次郎" style={iStyle}/></FG>
                <FG label="📝 メモ"><textarea value={eventForm.notes} onChange={e=>setEventForm({...eventForm,notes:e.target.value})} rows={3} style={{...iStyle,resize:"vertical"}}/></FG>
                <div style={{display:"flex",gap:7,marginTop:3}}>
                  <button onClick={()=>setEventModal(false)} style={{flex:1,padding:"10px",borderRadius:9,border:`1.5px solid ${P.border2}`,background:P.white,fontSize:13,cursor:"pointer",fontWeight:600,color:P.text}}>キャンセル</button>
                  <button onClick={saveEvent} style={{flex:2,padding:"10px",borderRadius:9,border:"none",background:colorHex(eventForm.color),color:P.white,fontSize:13,cursor:"pointer",fontWeight:700}}>{editingEvent?"更新する":"追加する"}</button>
                </div>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* ══ ToDoモーダル ════════════════════════════════════ */}
      {todoModal&&(
        <Overlay onClick={()=>setTodoModal(false)}>
          <div style={{background:P.white,borderRadius:16,padding:24,width:"min(360px,92vw)",boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}} onClick={e=>e.stopPropagation()}>
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:16,color:P.text}}>新しいToDo</h2>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <FG label="タイトル *"><input value={newTodo.title} onChange={e=>setNewTodo({...newTodo,title:e.target.value})} placeholder="例：企画書を提出する" style={iStyle} autoFocus/></FG>
              <FG label="カテゴリ">
                <div style={{display:"flex",gap:7}}>
                  {Object.entries(CATEGORIES).map(([k,v])=>(
                    <button key={k} onClick={()=>setNewTodo({...newTodo,category:k})} style={{flex:1,padding:"8px",borderRadius:7,border:"2px solid",borderColor:newTodo.category===k?v.dot:P.border2,background:newTodo.category===k?v.bg:P.white,color:newTodo.category===k?v.dot:P.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>{v.label}</button>
                  ))}
                </div>
              </FG>
              <FG label="期限 *"><input type="date" value={newTodo.deadline} onChange={e=>setNewTodo({...newTodo,deadline:e.target.value})} style={iStyle}/></FG>
              <div style={{display:"flex",gap:7,marginTop:3}}>
                <button onClick={()=>setTodoModal(false)} style={{flex:1,padding:"10px",borderRadius:8,border:`1.5px solid ${P.border2}`,background:P.white,fontSize:13,cursor:"pointer",fontWeight:600,color:P.text}}>キャンセル</button>
                <button onClick={addTodo} style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:P.accent1,color:P.white,fontSize:13,cursor:"pointer",fontWeight:600}}>追加する</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* レスポンシブCSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-layout { display: none !important; }
          .mobile-layout  { display: block !important; }
        }
        @media (min-width: 769px) {
          .desktop-layout { display: grid !important; }
          .mobile-layout  { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── サブコンポーネント ─────────────────────────────────────
function Overlay({onClick,children}){
  return <div style={{position:"fixed",inset:0,background:"rgba(58,48,40,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={onClick}>{children}</div>;
}
function FG({label,children}){
  return <div>{label&&<label style={{fontSize:11,fontWeight:600,color:P.muted,display:"block",marginBottom:4}}>{label}</label>}{children}</div>;
}
function DR({icon,label,value}){
  return(
    <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
      <span style={{fontSize:15,flexShrink:0,marginTop:1}}>{icon}</span>
      <div>{label&&<p style={{margin:0,fontSize:10,color:P.muted}}>{label}</p>}<p style={{margin:0,fontSize:13,color:P.text,lineHeight:1.5}}>{value}</p></div>
    </div>
  );
}
function EventChip({ev,onClick,showDate}){
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 9px",borderRadius:8,border:`1px solid ${P.soft1}`,background:P.bg,cursor:"pointer",marginBottom:3}}>
      <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:colorHex(ev.color),flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:12,fontWeight:600,color:P.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</p>
        <p style={{margin:0,fontSize:10,color:P.muted}}>{showDate&&`${ev.date} `}{ev.isAllDay?"終日":`${ev.startTime}〜${ev.endTime}`}{ev.location&&` · ${ev.location}`}{ev.isOnline&&" · 🔗"}</p>
      </div>
      <span style={{fontSize:11,color:P.done}}>›</span>
    </div>
  );
}
function TodoItem({todo,onToggle,onDelete,isOverdue,showDate}){
  const cat=CATEGORIES[todo.category];
  return(
    <div style={{display:"flex",alignItems:"flex-start",gap:7,padding:"8px 9px",borderRadius:9,background:todo.done?P.bg:isOverdue?"#FFF5F0":P.white,border:"1px solid",borderColor:todo.done?P.soft1:isOverdue?"#F5D5C8":P.soft1,marginBottom:2}}>
      <button onClick={()=>onToggle(todo.id)} style={{flexShrink:0,width:19,height:19,borderRadius:"50%",border:`2px solid ${todo.done?P.accent2:P.border}`,background:todo.done?P.accent2:P.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
        {todo.done&&<span style={{color:P.white,fontSize:9}}>✓</span>}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:12,fontWeight:500,color:todo.done?P.muted:P.text,textDecoration:todo.done?"line-through":"none"}}>{todo.title}</p>
        <div style={{display:"flex",gap:5,marginTop:2}}>
          <span style={{fontSize:10,color:cat.dot,fontWeight:600}}>{cat.label}</span>
          {showDate&&<span style={{fontSize:10,color:isOverdue?P.overdue:P.muted}}>期限:{todo.deadline}{isOverdue&&" ⚠"}</span>}
          {!showDate&&isOverdue&&<span style={{fontSize:10,color:P.overdue,fontWeight:600}}>⚠ 超過</span>}
        </div>
      </div>
      <button onClick={()=>onDelete(todo.id)} style={{flexShrink:0,width:20,height:20,borderRadius:5,border:"none",background:"transparent",cursor:"pointer",color:P.done,fontSize:13}}>×</button>
    </div>
  );
}
const iStyle={width:"100%",padding:"8px 11px",borderRadius:7,border:`1.5px solid #E3CBA9`,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:"#FDFCFA",color:"#3a3028"};
