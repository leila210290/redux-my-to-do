/*
App.jsx
React + Redux Toolkit ToDo App (single-file)

-> Ce fichier est prêt à être collé dans `src/App.jsx` d'un projet Create React App ou Vite + React.
-> Dépendances (installe via npm ou yarn):
   npm install @reduxjs/toolkit react-redux

Optional: tailwindcss pour le style (les classes sont tailwind-friendly). Si tu n'utilises pas tailwind, tu peux remplacer les classes par ton CSS.

Index minimal (src/index.js) : (ceci est uniquement une indication, pas nécessairement à coller ici)
// import React from 'react'
// import { createRoot } from 'react-dom/client' // ou ReactDOM.render pour CRA classic
// import App from './App'
// createRoot(document.getElementById('root')).render(<App />)

Description :
- Composants créés : AddTask, ListTask, Task
- Chaque tâche a : id, description, isDone
- Fonctions implémentées : ajouter une tâche, filtrer (all / to do / done), éditer, supprimer, cocher/décocher

Bonne lecture des commentaires dans le code pour comprendre ligne par ligne.
*/

import React, { useState, useEffect, useRef } from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { configureStore, createSlice, nanoid } from '@reduxjs/toolkit'

/* ---------------------- Redux slice ---------------------- */
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    // petites tâches d'exemple pour tester
    tasks: [
      { id: 't1', description: 'Apprendre Redux', isDone: false },
      { id: 't2', description: 'Faire les courses', isDone: true }
    ],
    filter: 'all' // 'all' | 'not' | 'done'
  },
  reducers: {
    // addTask utilise `prepare` pour générer un id propre
    addTask: {
      reducer(state, action) {
        // on ajoute en début pour que les nouvelles tâches apparaissent en haut
        state.tasks.unshift(action.payload)
      },
      prepare(description) {
        return { payload: { id: nanoid(), description, isDone: false } }
      }
    },
    toggleDone(state, action) {
      const t = state.tasks.find(t => t.id === action.payload)
      if (t) t.isDone = !t.isDone
    },
    deleteTask(state, action) {
      state.tasks = state.tasks.filter(t => t.id !== action.payload)
    },
    editTask(state, action) {
      const { id, description } = action.payload
      const t = state.tasks.find(t => t.id === id)
      if (t) t.description = description
    },
    setFilter(state, action) {
      state.filter = action.payload
    }
  }
})

const { addTask, toggleDone, deleteTask, editTask, setFilter } = tasksSlice.actions

const store = configureStore({ reducer: { tasks: tasksSlice.reducer } })

/* ---------------------- Selectors ---------------------- */
const selectFilteredTasks = state => {
  const { tasks, filter } = state.tasks
  if (filter === 'all') return tasks
  if (filter === 'done') return tasks.filter(t => t.isDone)
  if (filter === 'not') return tasks.filter(t => !t.isDone)
  return tasks
}

/* ---------------------- AddTask ---------------------- */
function AddTask() {
  const [text, setText] = useState('')
  const dispatch = useDispatch()
  const inputRef = useRef(null)

  const onSubmit = e => {
    e.preventDefault()
    const v = text.trim()
    if (!v) return // on n'ajoute pas de tâches vides
    dispatch(addTask(v))
    setText('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-center mb-4">
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Nouvelle tâche..."
        className="flex-1 p-2 border rounded"
      />
      <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
        Ajouter
      </button>
    </form>
  )
}

/* ---------------------- Task ---------------------- */
function Task({ task }) {
  const dispatch = useDispatch()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(task.description)

  useEffect(() => {
    // si la description change via Redux (ex: autre onglet), on synchronise l'input
    setValue(task.description)
  }, [task.description])

  const save = () => {
    const v = value.trim()
    if (!v) return // on n'autorise pas une description vide
    dispatch(editTask({ id: task.id, description: v }))
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={task.isDone}
          onChange={() => dispatch(toggleDone(task.id))}
        />

        {editing ? (
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') {
                setEditing(false)
                setValue(task.description)
              }
            }}
            className="p-1 border rounded"
            autoFocus
          />
        ) : (
          <span className={task.isDone ? 'line-through text-gray-500' : ''}>{task.description}</span>
        )}
      </div>

      <div className="flex gap-2">
        {editing ? (
          <>
            <button onClick={save} className="px-3 py-1 bg-green-500 text-white rounded">
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setValue(task.description)
              }}
              className="px-3 py-1 border rounded"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="px-3 py-1 border rounded">
              Edit
            </button>
            <button onClick={() => dispatch(deleteTask(task.id))} className="px-3 py-1 bg-red-500 text-white rounded">
              Del
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------------- ListTask ---------------------- */
function ListTask() {
  const tasks = useSelector(selectFilteredTasks)
  const filter = useSelector(state => state.tasks.filter)
  const dispatch = useDispatch()

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-gray-200' : 'border'}`}
          onClick={() => dispatch(setFilter('all'))}
        >
          All
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'not' ? 'bg-gray-200' : 'border'}`}
          onClick={() => dispatch(setFilter('not'))}
        >
          To do
        </button>
        <button
          className={`px-3 py-1 rounded ${filter === 'done' ? 'bg-gray-200' : 'border'}`}
          onClick={() => dispatch(setFilter('done'))}
        >
          Done
        </button>
      </div>

      <div className="border rounded">
        {tasks.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Aucune tâche</div>
        ) : (
          tasks.map(t => <Task key={t.id} task={t} />)
        )}
      </div>
    </div>
  )
}

/* ---------------------- App (exported) ---------------------- */
export default function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
          <h1 className="text-xl font-bold mb-4">ToDo App - Redux</h1>
          <AddTask />
          <ListTask />
        </div>
      </div>
    </Provider>
  )
}
