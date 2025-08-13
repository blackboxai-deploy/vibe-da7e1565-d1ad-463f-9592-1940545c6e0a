'use client';

import { useEffect, useMemo, useState } from 'react';
import './globals.css';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function Page() {
  const [todos, setTodos] = useLocalStorage('todos', []);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | completed
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const remaining = useMemo(() => todos.filter(t => !t.done).length, [todos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return todos
      .filter(t => (filter === 'active' ? !t.done : filter === 'completed' ? t.done : true))
      .filter(t => (q ? t.text.toLowerCase().includes(q) : true));
  }, [todos, filter, query]);

  function addTodo(e) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos([{ id: uid(), text: trimmed, done: false, createdAt: Date.now() }, ...todos]);
    setText('');
  }

  function toggleTodo(id) {
    setTodos(todos.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTodo(id) {
    setTodos(todos.filter(t => t.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditingText('');
    }
  }

  function startEdit(id, current) {
    setEditingId(id);
    setEditingText(current);
  }

  function saveEdit(id) {
    const trimmed = editingText.trim();
    if (!trimmed) {
      deleteTodo(id);
      return;
    }
    setTodos(todos.map(t => (t.id === id ? { ...t, text: trimmed } : t)));
    setEditingId(null);
    setEditingText('');
  }

  function clearCompleted() {
    setTodos(todos.filter(t => !t.done));
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && editingId) saveEdit(editingId);
      if (e.key === 'Escape' && editingId) {
        setEditingId(null);
        setEditingText('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingId, editingText, todos]);

  return (
    <div className="container">
      <h1 className="title">Next Todo</h1>
      <div className="card">
        <form className="inputRow" onSubmit={addTodo}>
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New todo"
          />
          <button className="button" type="submit" disabled={!text.trim()}>Add</button>
        </form>

        <input
          className="search"
          placeholder="Search tasks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search todos"
        />

        <div className="footer">
          <span>{remaining} item{remaining === 1 ? '' : 's'} left</span>
          <div className="filterGroup" role="tablist" aria-label="Filter todos">
            <button className={`filterBtn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
            <button className={`filterBtn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Active</button>
            <button className={`filterBtn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed</button>
          </div>
          <button className="smallBtn" onClick={clearCompleted}>Clear Completed</button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No tasks to show</div>
        ) : (
          <ul className="list" aria-live="polite">
            {filtered.map((t) => (
              <li key={t.id} className="item">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTodo(t.id)}
                  aria-label={`Mark ${t.text} as ${t.done ? 'active' : 'completed'}`}
                />
                {editingId === t.id ? (
                  <input
                    className="editInput"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    autoFocus
                    onBlur={() => saveEdit(t.id)}
                    aria-label="Edit todo"
                  />
                ) : (
                  <span className={`label ${t.done ? 'completed' : ''}`}>{t.text}</span>
                )}
                <div className="row">
                  {editingId === t.id ? (
                    <button className="smallBtn" onMouseDown={(e) => e.preventDefault()} onClick={() => saveEdit(t.id)}>Save</button>
                  ) : (
                    <button className="smallBtn" onClick={() => startEdit(t.id, t.text)}>Edit</button>
                  )}
                  <button className="smallBtn" onClick={() => deleteTodo(t.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
