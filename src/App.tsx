import { MorningBriefing } from "./components/MorningBriefing";
import { WeatherPanel } from "./components/WeatherPanel";
import { TodoPanel } from "./components/TodoPanel";
import { SchedulePanel } from "./components/SchedulePanel";
import { EmailPanel } from "./components/EmailPanel";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { useSettings } from "./hooks/useSettings";
import { useWeather } from "./hooks/useWeather";
import { useTodos } from "./hooks/useTodos";
import { useGoogleIntegration, useSchedule } from "./hooks/useGoogle";
import { useEmails } from "./hooks/useEmails";

export default function App() {
  const { settings, updateCity, saving, error, setError } = useSettings();
  const { weather, loading: weatherLoading, error: weatherError, refresh } = useWeather(settings);
  const { pending, done, add, toggle, remove } = useTodos();
  const { connected, accountEmail, connect, disconnect } = useGoogleIntegration();
  const { allEvents, loading: scheduleLoading, error: scheduleError, addLocalEvent, removeLocalEvent } =
    useSchedule(connected);
  const { messages, loading: emailLoading, error: emailError, refresh: refreshEmail, unread } =
    useEmails(connected);

  const nextEvent = allEvents[0]?.title;
  const displayName = accountEmail?.split("@")[0];

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-alfred-border/80 bg-alfred-panel/50 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-alfred-gold">Personal assistant</p>
            <h1 className="font-display text-3xl font-semibold">Alfred</h1>
          </div>
          <span className="text-4xl" aria-hidden>
            🎩
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <MorningBriefing
          weather={weather}
          pendingTodos={pending.length}
          unreadEmails={unread}
          nextEventTitle={nextEvent}
          userName={displayName}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <WeatherPanel
            city={settings.city}
            weather={weather}
            loading={weatherLoading}
            error={weatherError}
            onRefresh={() => void refresh()}
          />
          <TodoPanel pending={pending} done={done} onAdd={add} onToggle={toggle} onRemove={remove} />
          <SchedulePanel
            events={allEvents}
            loading={scheduleLoading}
            error={scheduleError}
            onAddLocal={addLocalEvent}
            onRemoveLocal={removeLocalEvent}
          />
          <EmailPanel
            messages={messages}
            loading={emailLoading}
            error={emailError}
            connected={connected}
            onConnect={connect}
            onRefresh={() => void refreshEmail()}
          />
        </div>
      </main>

      <SettingsDrawer
        settings={settings}
        googleConnected={connected}
        accountEmail={accountEmail}
        onSaveCity={async (city) => {
          setError(null);
          return updateCity(city);
        }}
        onConnectGoogle={connect}
        onDisconnectGoogle={() => void disconnect()}
        saving={saving}
        error={error}
      />
    </div>
  );
}
