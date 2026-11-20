
import { useState } from 'react'
import {
    Droplets,
    Egg,
    Sprout,
    ClipboardList,
    Clock3,
    Leaf,
    ArrowLeft,
    Hand,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'
import { claimTask } from '../services/taskClaims'
import './VolunteerDashboard.css'

const categories = [
    'All',
    'Watering',
    'Animal Care',
    'Gardening',
    'Composting',
    'Maintenance',
    'Creative / Administrative',
    'Other'
]

function getAppearance(category) {
    switch (category) {
        case 'Watering':
            return { Icon: Droplets, color: 'teal' }
        case 'Animal Care':
            return { Icon: Egg, color: 'orange' }
        case 'Gardening':
            return { Icon: Sprout, color: 'green' }
        case 'Composting':
            return { Icon: Leaf, color: 'purple' }
        default:
            return { Icon: ClipboardList, color: 'yellow' }
    }
}

export default function VolunteerDashboard({
    profile,
    tasks,
    onBack,
    onSignOut
}) {
    const [category, setCategory] = useState('All')
    const [selectedTask, setSelectedTask] = useState(null)
    const [claiming, setClaiming] = useState(false)
    const [claimError, setClaimError] = useState('')

    const availableTasks = tasks
        .filter(task => task.active === true && task.status === 'available')
        .filter(task => category === 'All' || task.category === category)
        .sort((a, b) => a.title.localeCompare(b.title))


    async function handleClaimTask() {
        if (!selectedTask || claiming) return

        setClaiming(true)
        setClaimError('')

        try {
            await claimTask(selectedTask.id)
            setSelectedTask(null)
        } catch (error) {
            console.error('Claim failed:', error)
            setClaimError(
                error.message || 'Unable to claim this mission.'
            )
        } finally {
            setClaiming(false)
        }
    }

    return (
        <main className="volunteer-app">
            <header className="volunteer-header">
                <div>
                    <span>SUNBREWED HOMESTEAD</span>
                    <h1>LAND STEWARDZ!</h1>
                    <p>GET DIRTY. DO GOOD.</p>
                </div>

                <div className="volunteer-header-actions">
                    {onBack && (
                        <button type="button" onClick={onBack}>
                            <ArrowLeft size={17} />
                            ADMIN
                        </button>
                    )}

                    <button type="button" onClick={onSignOut}>
                        SIGN OUT
                    </button>
                </div>
            </header>

            <div className="volunteer-content">
                <section className="volunteer-intro">
                    <span>WELCOME TO THE CREW</span>
                    <h2>READY TO LEND A HAND?</h2>
                    <p>
                        Hey, {profile.displayName || 'Steward'}! Pick a mission
                        that works for you. Every little bit helps the homestead grow.
                    </p>
                </section>

                <section className="volunteer-board" aria-labelledby="volunteer-board-title">
                    <div className="volunteer-board-heading">
                        <div>
                            <span>THE DAILY GRIND</span>
                            <h3 id="volunteer-board-title">AVAILABLE MISSIONS</h3>
                        </div>
                        <strong>{availableTasks.length} AVAILABLE</strong>
                    </div>

                    <div className="volunteer-categories" aria-label="Filter by category">
                        {categories.map(item => (
                            <button
                                key={item}
                                type="button"
                                className={category === item ? 'selected' : ''}
                                aria-pressed={category === item}
                                onClick={() => setCategory(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="volunteer-task-grid">
                        {availableTasks.length === 0 ? (
                            <div className="volunteer-empty">
                                <CheckCircle2 size={32} />
                                <h4>ALL CAUGHT UP!</h4>
                                <p>No available missions in this category right now.</p>
                            </div>
                        ) : (
                            availableTasks.map(task => {
                                const { Icon, color } = getAppearance(task.category)

                                return (
                                    <article className="volunteer-task-card" key={task.id}>
                                        <div className={`volunteer-task-icon ${color}`}>
                                            <Icon size={27} />
                                        </div>

                                        <span className="volunteer-task-category">
                                            {task.category || 'Other'}
                                        </span>

                                        <h4>{task.title}</h4>

                                        <div className="volunteer-task-details">
                                            <span>
                                                <Clock3 size={16} />
                                                {task.estimatedMinutes ?? 10} min
                                            </span>
                                            <span>
                                                <Hand size={16} />
                                                {task.difficulty || 'light'} effort
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="volunteer-view-button"
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            VIEW MISSION
                                        </button>
                                    </article>
                                )
                            })
                        )}
                    </div>
                </section>
            </div>

            {selectedTask && (
                <div
                    className="volunteer-modal-backdrop"
                    onMouseDown={() => setSelectedTask(null)}
                >
                    <section
                        className="volunteer-detail-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="volunteer-detail-title"
                        onMouseDown={event => event.stopPropagation()}
                    >
                        <div className="volunteer-detail-heading">
                            <span>MISSION BRIEFING</span>
                            <button
                                type="button"
                                onClick={() => setSelectedTask(null)}
                                aria-label="Close mission details"
                            >
                                ×
                            </button>
                        </div>

                        <h3 id="volunteer-detail-title">{selectedTask.title}</h3>

                        <div className="volunteer-detail-meta">
                            <span><Clock3 size={16} /> {selectedTask.estimatedMinutes} minutes</span>
                            <span><Hand size={16} /> {selectedTask.difficulty} effort</span>
                        </div>

                        <h4>WHAT TO DO</h4>
                        <p className="volunteer-instructions">
                            {selectedTask.instructions || 'Ask a coordinator for instructions before starting.'}
                        </p>

                        <div className="volunteer-safety-note">
                            <AlertCircle size={19} />
                            <p>
                                Check with a coordinator if you have questions or need
                                assistance with this task.
                            </p>
                        </div>


                        {claimError && (
                            <p role="alert" className="volunteer-claim-error">
                                {claimError}
                            </p>
                        )}

                        <button
                            type="button"
                            className="volunteer-claim-button"
                            disabled={claiming}
                            onClick={handleClaimTask}
                        >
                            {claiming ? 'CLAIMING MISSION...' : 'CLAIM MISSION'}
                        </button>

                    </section>
                </div>
            )}
        </main>
    )
}
