

import { useState, useEffect } from 'react';
import './App.css';
import manasLogo from './assets/Manas big 2.png';

const moods = [
  { label: 'Fantastic', emoji: '😄', color: '#00d4aa', bgColor: 'rgb(245, 243, 243)'  },
  { label: 'Good', emoji: '🙂', color: '#4facfe', bgColor: 'rgb(245, 243, 243)'  },
  { label: 'Average', emoji: '😐', color: '#ffb347', bgColor:'rgb(245, 243, 243)'  },
  { label: 'Bad', emoji: '😞', color: '#ff6b6b', bgColor: 'rgb(245, 243, 243)' }
];

function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [summary, setSummary] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [entries, setEntries] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sosContactsText, setSosContactsText] = useState('');

  // Save entry for selected date
  const saveEntry = async () => {
    if (!selectedMood) return;
    
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedEntries = {
      ...entries,
      [selectedDate]: {
        mood: selectedMood,
        summary,
      }
    };
    setEntries(updatedEntries);
    
    setIsSaving(false);
    setShowSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);

    // After saving, check if last 5 consecutive days are "Bad"
    try {
      const consecutiveBad = getConsecutiveBadDays(updatedEntries, selectedDate);
      if (consecutiveBad >= 5) {
        triggerSosIfConfigured();
      }
    } catch (e) {
      // no-op for now
    }
  };

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('moodEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    const savedContacts = localStorage.getItem('sosContactsText');
    if (savedContacts) {
      setSosContactsText(savedContacts);
    }
    setIsLoading(false);
  }, []);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('moodEntries', JSON.stringify(entries));
    }
  }, [entries, isLoading]);

  // Persist SOS contacts text
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('sosContactsText', sosContactsText);
    }
  }, [sosContactsText, isLoading]);

  // Load entry when date changes
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (entries[date]) {
      setSelectedMood(entries[date].mood);
      setSummary(entries[date].summary);
    } else {
      setSelectedMood(null);
      setSummary('');
    }
  };

  // Handle calendar icon click
  const handleCalendarIconClick = () => {
    const calendarInput = document.querySelector('.calendar-input');
    if (calendarInput) {
      calendarInput.showPicker?.() || calendarInput.focus();
    }
  };

  // Helpers
  const getConsecutiveBadDays = (allEntries, endDateStr) => {
    // Count backwards from endDateStr; require explicit 'Bad' for each day
    const countDays = 5;
    let count = 0;
    let cursor = new Date(endDateStr + 'T00:00:00');
    for (let i = 0; i < countDays; i++) {
      const key = cursor.toISOString().split('T')[0];
      const entry = allEntries[key];
      if (entry && entry.mood === 'Bad') {
        count += 1;
      } else {
        break;
      }
      // move one day back
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  };

  const parseContacts = () => {
    return sosContactsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);
  };

  const triggerSosIfConfigured = async () => {
    const contacts = parseContacts();
    if (contacts.length === 0) return;
    const webhook = import.meta.env?.VITE_SOS_WEBHOOK_URL;
    if (!webhook) return;

    const message = `SOS: We detected 5 consecutive difficult days. Please check in.`;
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts,
          message
        })
      });
    } catch {
      // swallow errors in UI for now
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          fontSize: '1.2rem',
          color: 'var(--text-secondary)'
        }}>
          Loading your mood tracker...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-block">
        <div className="logo-header">
          <img src={manasLogo} alt="manas logo" className="manas-logo"/>
          <div className="subtitle">
            <div className="quote">
              "Each day comes bearing its gifts."
            </div>
          </div>
        </div>
      </div>

      <div className="main-title">
        Mood Tracker & Daily Summary
      </div>  

      <section className="calendar-section">
        <h2>📅 Select Date</h2>
        <div className="calendar-wrapper">
          <input
            type="date"
            className="calendar-input"
            value={selectedDate}
            onChange={handleDateChange}
          />
          <span 
            className="calendar-icon" 
            onClick={handleCalendarIconClick}
            style={{ cursor: 'pointer' }}
          >
            📅
          </span>
        </div>
      </section>

      <section className="mood-section">
        <h2>😊 How was your day?</h2>
        <div className="mood-options">
          {moods.map((mood, index) => (
            <button
              key={mood.label}
              className={`mood-btn${selectedMood === mood.label ? ' selected' : ''}`}
              style={{ 
                borderColor: mood.color,
                animationDelay: `${index * 0.1}s`
              }}
              onClick={() => setSelectedMood(mood.label)}
            >
              <span className="emoji">{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="summary-section">
        <h2>📝 Daily Summary</h2>
        <textarea
          className="summary-input"
          placeholder="Describe your day in detail..."
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows="4"
        />
        <div className="checklist">
          <label>
            <input type="checkbox" checked={selectedMood === 'Fantastic'} readOnly /> 
            <span>Today was a fantastic day ✨</span>
          </label>
          <label>
            <input type="checkbox" checked={selectedMood === 'Good'} readOnly /> 
            <span>Today was a good day 😊</span>
          </label>
          <label>
            <input type="checkbox" checked={selectedMood === 'Average'} readOnly /> 
            <span>Today was an average day 😐</span>
          </label>
          <label>
            <input type="checkbox" checked={selectedMood === 'Bad'} readOnly /> 
            <span>Today was a bad day 😞</span>
          </label>
        </div>
        
        {showSuccess && (
          <div style={{
            background: 'var(--success-color)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1rem',
            textAlign: 'center',
            fontWeight: '600',
            animation: 'slideUp 0.3s ease-out'
          }}>
            ✅ Entry saved successfully!
          </div>
        )}
        
        <button 
          className="save-btn" 
          onClick={saveEntry}
          disabled={!selectedMood || isSaving}
          style={{
            opacity: (!selectedMood || isSaving) ? 0.6 : 1,
            cursor: (!selectedMood || isSaving) ? 'not-allowed' : 'pointer'
          }}
        >
          {isSaving ? '💾 Saving...' : '💾 Save Entry'}
        </button>
      </section>

      <section className="entries-section">
        <h2>📚 Past Entries</h2>
        <ul className="entries-list">
          {Object.keys(entries).length === 0 && (
            <li style={{ 
              textAlign: 'center', 
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              padding: '2rem'
            }}>
              No entries yet. Start tracking your mood! 🌟
            </li>
          )}
          {Object.entries(entries).map(([date, entry], index) => {
            const moodData = moods.find(m => m.label === entry.mood);
            return (
              <li key={date} style={{ animationDelay: `${index * 0.1}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</strong>
                  {entry.mood && moodData && (
                    <span
                      style={{
                        background: moodData.bgColor,
                        color: moodData.color,
                        borderRadius: 'var(--radius-md)',
                        padding: '0.25rem 0.75rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        border: `1px solid ${moodData.color}20`
                      }}
                    >
                      {moodData.emoji} {entry.mood}
                    </span>
                  )}
                </div>
                {entry.summary && (
                  <p style={{ 
                    margin: 0, 
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                  }}>
                    {entry.summary}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sos-section">
        <h2>📨 SOS Contacts (SMS)</h2>
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          Enter up to 3 phone numbers, separated by commas. Example: +911234567890, +919876543210
        </p>
        <input
          type="text"
          className="summary-input"
          placeholder="+911234567890, +919876543210"
          value={sosContactsText}
          onChange={(e) => setSosContactsText(e.target.value)}
        />
        <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          When there are 5 consecutive "Bad" days, an SOS message will be sent via your configured provider.
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="save-btn" 
            onClick={triggerSosIfConfigured}
            style={{ background: '#4caf50' }}
          >
            ▶ Test SOS Send
          </button>
        </div>
      </section>

      <section className="helpline-section">
        <h2>🆘 Need Help?</h2>
        <ul className="helpline-list">
          <li>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🏛️</span>
              <strong>Government Toll-Free</strong>
            </div>
            <a href="tel:9152987821" style={{ fontSize: '1.1rem', fontWeight: '600' }}>9152987821</a>
          </li>
          <li>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🤝</span>
              <strong>Snehi India</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <a href="https://snehi.org.in/">snehi.org.in</a>
              <a href="tel:919818358060">9818358060</a>
            </div>
          </li>
          <li>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📞</span>
              <strong>iCALL</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <a href="https://icallhelpline.org/">icallhelpline.org</a>
              <a href="tel:9152987821">9152987821</a>
            </div>
          </li>
          <li>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💚</span>
              <strong>National Tele Mental Health Toll-Free</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <a href="https://telemanas.mohfw.gov.in/">telemanas.mohfw.gov.in</a>
              <a href="tel:18008914416">1800-891-4416</a>
            </div>
          </li>
        </ul>
      </section>
      
      <footer className="footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>💙</span>
          <span>&copy; 2025 MindSpark</span>
          <span>💙</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
