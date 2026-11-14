
import { useState } from 'react'
import {
    Search,
    Plus,
    Archive,
    RotateCcw,
    Clock3,
    CalendarClock,
    Pencil
} from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import './TasksPage.css'

export default function TasksPage({
    tasks,
    onAddTask,
    onEditTask
}) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showArchived, setShowArchived] = useState(false)
    const [busyId, setBusyId] = useState(null)
    const [error, setError] = useState('')

    const filteredTasks = tasks
        .filter(task => showArchived
            ? task.active === false
            : task.active === true
        )
        .filter(task =>
            statusFilter === 'all' ||
            task.status === statusFilter
        )
        .filter(task => {
            const query = search.trim().toLowerCase()

            return (
                task.title?.toLowerCase().includes(query) ||
                task.category?.toLowerCase().includes(query) ||
                task.instructions?.toLowerCase().includes(query)
            )
        })
        .sort((a, b) => a.title.localeCompare(b.title))

    async function toggleArchive(task) {
        const archiving = task.active !== false

        const confirmed = window.confirm(
            archiving
                ? `Archive "${task.title}"? It will no longer appear on the active task board.`
                : `Restore "${task.title}" to the active task board?`
        )

        if (!confirmed) return

        setBusyId(task.id)
        setError('')

        try {
            await updateDoc(doc(db, 'tasks', task.id), {
                active: !archiving,
                updatedAt: serverTimestamp()
            })
        } catch (err) {
            console.error('Unable to update task:', err)
            setError('Could not update this task. Please try again.')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <section className="task-manager">
            <div className="task-manager-header">
                <div>
                    <span>ORGANIZE THE HOMESTEAD</span>
                    <h3>MISSION CONTROL</h3>
                    <p>
                        Create, find, and manage the work that keeps
                        Sunbrewed growing.
                    </p>
                </div>

                <button
                    type="button"
                    className="add-task-button"
                    onClick={onAddTask}
                >
                    <Plus size={18} />
                    ADD TASK
                </button>
            </div>

            <div className="task-manager-toolbar">
                <label className="task-search">
                    <Search size={19} aria-hidden="true" />
                    <span className="sr-only">Search tasks</span>
                    <input
                        type="search"
                        placeholder="Search missions..."
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                    />
                </label>

                <label className="task-filter-label">
                    <span>STATUS</span>
                    <select
                        value={statusFilter}
                        onChange={event => setStatusFilter(event.target.value)}
                    >
                        <option value="all">All statuses</option>
                        <option value="available">Available</option>
                        <option value="in-progress">In progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </label>

                <button
                    type="button"
                    className={`archive-toggle ${showArchived ? 'selected' : ''}`}
                    onClick={() => setShowArchived(value => !value)}
                    aria-pressed={showArchived}
                >
                    {showArchived ? <RotateCcw size={17} /> : <Archive size={17} />}
                    {showArchived ? 'VIEW ACTIVE' : 'VIEW ARCHIVED'}
                </button>
            </div>

            {error && (
                <p role="alert" className="task-manager-error">
                    {error}
                </p>
            )}

            <div className="task-manager-count">
                <strong>{filteredTasks.length}</strong>
                {showArchived ? ' archived missions' : ' active missions'}
                {search || statusFilter !== 'all' ? ' matching filters' : ''}
            </div>

            <div className="managed-task-list">
                {filteredTasks.length === 0 ? (
                    <div className="managed-task-empty">
                        <h4>NO MISSIONS FOUND</h4>
                        <p>
                            Try changing the search or filters.
                        </p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <article className="managed-task-card" key={task.id}>
                            <div className="managed-task-details">
                                <div className="managed-task-meta">
                                    <span className="managed-category">
                                        {task.category || 'Other'}
                                    </span>
                                    <span className={`task-status ${task.status}`}>
                                        {(task.status || 'available').replace('-', ' ')}
                                    </span>
                                </div>

                                <h4>{task.title}</h4>

                                {task.instructions && (
                                    <p>{task.instructions}</p>
                                )}

                                <div className="managed-task-facts">
                                    <span>
                                        <Clock3 size={15} />
                                        {task.estimatedMinutes || 10} min
                                    </span>

                                    <span>
                                        <CalendarClock size={15} />
                                        {task.recurrence?.type === 'daily'
                                            ? `Daily at ${task.recurrence.resetTime || '07:00'}`
                                            : task.recurrence?.type === 'rolling'
                                                ? `Every ${task.recurrence.repeatEveryHours} hours`
                                                : 'One-time'}
                                    </span>

                                    <span>
                                        Effort: {task.difficulty || 'light'}
                                    </span>
                                </div>
                            </div>

                            <div className="managed-task-actions">

                                {!showArchived && (
                                    <button
                                        type="button"
                                        className="managed-edit-button"
                                        onClick={() => onEditTask(task)}
                                    >
                                        <Pencil size={16} />
                                        EDIT
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="managed-archive-button"
                                    disabled={busyId === task.id}
                                    onClick={() => toggleArchive(task)}
                                >
                                    {showArchived
                                        ? <RotateCcw size={16} />
                                        : <Archive size={16} />}

                                    {busyId === task.id
                                        ? 'SAVING...'
                                        : showArchived
                                            ? 'RESTORE'
                                            : 'ARCHIVE'}
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </section>
    )
}
