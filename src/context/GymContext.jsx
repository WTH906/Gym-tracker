import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { generateId, getMondayOfWeek } from '../utils/calculations.js'
import { loadState, saveState } from '../utils/storage.js'

const GymContext = createContext(null)

export function useGym() {
  return useContext(GymContext)
}

function makeEmptySet() {
  return { reps: '', weight: '', rest: '', notes: '' }
}

function makeEmptyExercise(name = '') {
  return {
    id: generateId(),
    name,
    sets: [makeEmptySet(), makeEmptySet(), makeEmptySet(), makeEmptySet(), makeEmptySet()],
  }
}

export function makeEmptyDay(date, weekId) {
  return {
    id: generateId(),
    weekId,
    date,
    title: '',
    exercises: [],
  }
}

const initialState = {
  weeks: [],
  templates: [],
  currentView: 'home',   // 'home' | 'day'
  currentDayId: null,
  currentWeekId: null,
  sideMenuOpen: false,
  folderHandle: null,
  toast: null,
}

function reducer(state, action) {
  switch (action.type) {

    case 'LOAD':
      return { ...state, ...action.payload, folderHandle: null }

    case 'SET_VIEW':
      return { ...state, currentView: action.view, currentDayId: action.dayId ?? null, currentWeekId: action.weekId ?? null }

    case 'TOGGLE_MENU':
      return { ...state, sideMenuOpen: !state.sideMenuOpen }

    case 'CLOSE_MENU':
      return { ...state, sideMenuOpen: false }

    case 'SET_FOLDER':
      return { ...state, folderHandle: action.handle }

    case 'SET_TOAST':
      return { ...state, toast: action.message }

    case 'CLEAR_TOAST':
      return { ...state, toast: null }

    // ── Weeks ────────────────────────────────────────────────
    case 'ADD_WEEK': {
      const monday = getMondayOfWeek()
      const newWeek = {
        id: generateId(),
        name: `Week ${state.weeks.length + 1}`,
        startDate: monday,
        days: [],
      }
      return { ...state, weeks: [...state.weeks, newWeek] }
    }

    case 'RENAME_WEEK': {
      return {
        ...state,
        weeks: state.weeks.map(w =>
          w.id === action.weekId ? { ...w, name: action.name } : w
        ),
      }
    }

    case 'DELETE_WEEK': {
      return {
        ...state,
        weeks: state.weeks.filter(w => w.id !== action.weekId),
        currentView: state.currentWeekId === action.weekId ? 'home' : state.currentView,
      }
    }

    // ── Days ─────────────────────────────────────────────────
    case 'ADD_DAY': {
      const day = makeEmptyDay(action.date, action.weekId)
      if (action.fromTemplate) {
        const tpl = state.templates.find(t => t.id === action.fromTemplate)
        if (tpl) {
          day.title = tpl.title
          day.exercises = tpl.exercises.map(ex => ({
            ...ex,
            id: generateId(),
            sets: ex.sets.map(s => ({ ...s, weight: '' })),
          }))
        }
      }
      return {
        ...state,
        weeks: state.weeks.map(w =>
          w.id === action.weekId
            ? { ...w, days: [...w.days, day] }
            : w
        ),
        currentView: 'day',
        currentDayId: day.id,
        currentWeekId: action.weekId,
        sideMenuOpen: false,
      }
    }

    case 'UPDATE_DAY': {
      return {
        ...state,
        weeks: state.weeks.map(w => ({
          ...w,
          days: w.days.map(d =>
            d.id === action.dayId ? { ...d, ...action.updates } : d
          ),
        })),
      }
    }

    case 'DELETE_DAY': {
      return {
        ...state,
        weeks: state.weeks.map(w => ({
          ...w,
          days: w.days.filter(d => d.id !== action.dayId),
        })),
        currentView: state.currentDayId === action.dayId ? 'home' : state.currentView,
        currentDayId: state.currentDayId === action.dayId ? null : state.currentDayId,
      }
    }

    // ── Exercises ─────────────────────────────────────────────
    case 'ADD_EXERCISE': {
      const newEx = makeEmptyExercise(action.name || '')
      return {
        ...state,
        weeks: state.weeks.map(w => ({
          ...w,
          days: w.days.map(d =>
            d.id === action.dayId
              ? { ...d, exercises: [...d.exercises, newEx] }
              : d
          ),
        })),
      }
    }

    case 'UPDATE_EXERCISE': {
      return {
        ...state,
        weeks: state.weeks.map(w => ({
          ...w,
          days: w.days.map(d =>
            d.id === action.dayId
              ? {
                  ...d,
                  exercises: d.exercises.map(ex =>
                    ex.id === action.exerciseId
                      ? { ...ex, ...action.updates }
                      : ex
                  ),
                }
              : d
          ),
        })),
      }
    }

    case 'DELETE_EXERCISE': {
      return {
        ...state,
        weeks: state.weeks.map(w => ({
          ...w,
          days: w.days.map(d =>
            d.id === action.dayId
              ? { ...d, exercises: d.exercises.filter(ex => ex.id !== action.exerciseId) }
              : d
          ),
        })),
      }
    }

    case 'REORDER_EXERCISES': {
      return {
        ...state,
        weeks: state.weeks.map(w => ({
          ...w,
          days: w.days.map(d =>
            d.id === action.dayId
              ? { ...d, exercises: action.exercises }
              : d
          ),
        })),
      }
    }

    // ── Templates ─────────────────────────────────────────────
    case 'SAVE_TEMPLATE': {
      const day = action.day
      const existing = state.templates.findIndex(t => t.title === day.title)
      const tpl = {
        id: existing >= 0 ? state.templates[existing].id : generateId(),
        title: day.title || 'Untitled Template',
        exercises: day.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({ ...s, weight: '' })),
        })),
      }
      if (existing >= 0) {
        const updated = [...state.templates]
        updated[existing] = tpl
        return { ...state, templates: updated }
      }
      return { ...state, templates: [...state.templates, tpl] }
    }

    case 'DELETE_TEMPLATE': {
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.templateId),
      }
    }

    default:
      return state
  }
}

export function GymProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      dispatch({ type: 'LOAD', payload: saved })
    }
  }, [])

  // Save to localStorage on every state change
  useEffect(() => {
    saveState(state)
  }, [state])

  // Auto-clear toast after 2.5s
  useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2500)
      return () => clearTimeout(t)
    }
  }, [state.toast])

  return (
    <GymContext.Provider value={{ state, dispatch }}>
      {children}
    </GymContext.Provider>
  )
}
