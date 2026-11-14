import { useState } from 'react'
import {
    addDoc,
    collection,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore'
import { X, Plus } from 'lucide-react'
import { auth, db } from '../firebase'
import './AddTaskModal.css'



const initialForm = {
    title: '',
    category: 'Watering',
    instructions: '',
    difficulty: 'light',
    estimatedMinutes: 10,
    recurrenceType: 'daily',
    repeatEveryHours: 24,
    resetTime: '07:00'
}

function getInitialForm(task) {
    if (!task) return { ...initialForm }

    return {
        title: task.title || '',
        category: task.category || 'Other',
        instructions: task.instructions || '',
        difficulty: task.difficulty || 'light',
        estimatedMinutes: task.estimatedMinutes ?? 10,
        recurrenceType: task.recurrence?.type || 'none',
        repeatEveryHours: task.recurrence?.repeatEveryHours ?? 24,
        resetTime: task.recurrence?.resetTime || '07:00'
    }
}

export default function AddTaskModal({ onClose, task = null }) {
    const isEditing = Boolean(task?.id)

    const [form, setForm] = useState(() => getInitialForm(task))
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')


    function updateField(event) {
        const { name, value } = event.target

        setForm(previous => ({
            ...previous,
            [name]: value
        }))
    }


    async function handleSubmit(event) {
        event.preventDefault()

        if (saving) return

        setError('')
        setSaving(true)

        try {
            if (!auth.currentUser) {
                throw new Error('You must be signed in.')
            }

            const title = form.title.trim()
            const estimatedMinutes = Number(form.estimatedMinutes)
            const repeatEveryHours = Number(form.repeatEveryHours)

            if (!title) {
                throw new Error('Enter a task title.')
            }

            if (
                !Number.isInteger(estimatedMinutes) ||
                estimatedMinutes < 1 ||
                estimatedMinutes > 1440
            ) {
                throw new Error('Estimated time must be 1–1440 minutes.')
            }

            if (
                form.recurrenceType === 'rolling' &&
                (
                    !Number.isInteger(repeatEveryHours) ||
                    repeatEveryHours < 1
                )
            ) {
                throw new Error('Enter a valid repeat interval.')
            }

            const taskData = {
                title,
                category: form.category,
                instructions: form.instructions.trim(),
                difficulty: form.difficulty,
                estimatedMinutes,
                recurrence: {
                    type: form.recurrenceType,
                    repeatEveryHours: form.recurrenceType === 'rolling'
                        ? repeatEveryHours
                        : null,
                    resetTime: form.recurrenceType === 'daily'
                        ? form.resetTime
                        : null,
                    timezone: 'America/Los_Angeles'
                },
                updatedAt: serverTimestamp()
            }

            if (isEditing) {
                await updateDoc(doc(db, 'tasks', task.id), taskData)
            } else {
                await addDoc(collection(db, 'tasks'), {
                    ...taskData,
                    status: 'available',
                    assignedTo: null,
                    active: true,
                    createdBy: auth.currentUser.uid,
                    createdAt: serverTimestamp()
                })
            }

            onClose()
        } catch (err) {
            console.error('Unable to save task:', err)
            setError(err.message || 'Unable to save task.')
        } finally {
            setSaving(false)
        }
    }


    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <section
                className="task-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-task-title"
                onMouseDown={event => event.stopPropagation()}
            >
                <header className="task-modal-header">
                    <div>
                        <span>THE DAILY GRIND</span>
                        <h2 id="add-task-title">
                            {isEditing ? 'EDIT MISSION!' : 'NEW MISSION!'}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close add task form"
                    >
                        <X />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="task-form">
                    <label htmlFor="task-title">Task name *</label>
                    <input
                        id="task-title"
                        name="title"
                        value={form.title}
                        onChange={updateField}
                        placeholder="e.g. Water the greenhouse"
                        maxLength={120}
                        required
                    />

                    <label htmlFor="task-category">Category</label>
                    <select
                        id="task-category"
                        name="category"
                        value={form.category}
                        onChange={updateField}
                    >
                        <option>Watering</option>
                        <option>Animal Care</option>
                        <option>Gardening</option>
                        <option>Composting</option>
                        <option>Maintenance</option>
                        <option>Creative / Administrative</option>
                        <option>Other</option>
                    </select>

                    <label htmlFor="task-instructions">Instructions</label>
                    <textarea
                        id="task-instructions"
                        name="instructions"
                        rows={3}
                        maxLength={2000}
                        value={form.instructions}
                        onChange={updateField}
                        placeholder="What should the volunteer know?"
                    />

                    <div className="task-form-grid">
                        <div>
                            <label htmlFor="task-difficulty">Physical effort</label>
                            <select
                                id="task-difficulty"
                                name="difficulty"
                                value={form.difficulty}
                                onChange={updateField}
                            >
                                <option value="light">Light</option>
                                <option value="moderate">Moderate</option>
                                <option value="heavy">Heavy</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="task-duration">Estimated minutes</label>
                            <input
                                id="task-duration"
                                type="number"
                                name="estimatedMinutes"
                                min="1"
                                max="1440"
                                value={form.estimatedMinutes}
                                onChange={updateField}
                                required
                            />
                        </div>
                    </div>

                    <label htmlFor="task-recurrence">Repeat schedule</label>
                    <select
                        id="task-recurrence"
                        name="recurrenceType"
                        value={form.recurrenceType}
                        onChange={updateField}
                    >
                        <option value="daily">Daily — fixed reset</option>
                        <option value="rolling">Rolling interval</option>
                        <option value="none">One-time task</option>
                    </select>

                    {form.recurrenceType === 'daily' && (
                        <>
                            <label htmlFor="task-reset">Daily reset time</label>
                            <input
                                id="task-reset"
                                type="time"
                                name="resetTime"
                                value={form.resetTime}
                                onChange={updateField}
                                required
                            />
                        </>
                    )}

                    {form.recurrenceType === 'rolling' && (
                        <>
                            <label htmlFor="task-repeat-hours">
                                Repeat every (hours)
                            </label>
                            <input
                                id="task-repeat-hours"
                                type="number"
                                name="repeatEveryHours"
                                min="1"
                                value={form.repeatEveryHours}
                                onChange={updateField}
                                required
                            />
                        </>
                    )}

                    {error && (
                        <p className="task-form-error" role="alert">{error}</p>
                    )}

                    <div className="task-form-actions">
                        <button
                            type="button"
                            className="cancel-task"
                            onClick={onClose}
                            disabled={saving}
                        >
                            CANCEL
                        </button>

                        <button
                            type="submit"
                            className="save-task"
                            disabled={saving}
                        >
                            <Plus size={18} />
                            {saving
                                ? 'SAVING...'
                                : isEditing
                                    ? 'SAVE CHANGES'
                                    : 'CREATE TASK'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
