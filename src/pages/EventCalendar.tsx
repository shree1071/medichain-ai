export default function EventCalendar() {
  return (
    <div className="flex flex-col min-h-screen pt-8 px-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Calendar</h1>
        <p className="text-muted-foreground text-sm">Upcoming monastic rituals and festivals.</p>
      </header>
      
      <div className="space-y-4">
        {[
          { date: "Oct 15", title: "Pang Lhabsol", desc: "Offering to Mount Khangchendzonga" },
          { date: "Nov 04", title: "Lhabab Düchen", desc: "Celebrating Buddha's descent from heaven" },
          { date: "Dec 12", title: "Losoong", desc: "Sikkimese New Year celebrations" }
        ].map((event, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-card border border-border">
            <div className="flex flex-col items-center justify-center bg-muted rounded-xl w-16 h-16 shrink-0">
              <span className="text-xs text-muted-foreground uppercase font-bold">{event.date.split(' ')[0]}</span>
              <span className="text-lg font-black text-foreground">{event.date.split(' ')[1]}</span>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold text-foreground">{event.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{event.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
