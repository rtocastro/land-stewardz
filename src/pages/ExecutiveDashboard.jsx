
import { useEffect, useState } from 'react'
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    History,
    Settings,
    Plus,
    Droplets,
    Egg,
    Sprout,
    LogOut,
    Menu,
    X
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import AddTaskModal from '../components/AddTaskModal'
import TasksPage from './TasksPage'
import './ExecutiveDashboard.css'



const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Tasks', icon: ClipboardList },
    { label: 'Volunteers', icon: Users },
    { label: 'Activity', icon: History },
    { label: 'Settings', icon: Settings }
]

export default function ExecutiveDashboard({ profile }) {
    const [activePage, setActivePage] = useState('Dashboard')
    const [menuOpen, setMenuOpen] = useState(false)
    const [taskFilter, setTaskFilter] = useState('all')


    const [tasks, setTasks] = useState([])
    const [tasksLoading, setTasksLoading] = useState(true)
    const [tasksError, setTasksError] = useState('')
    const [showAddTask, setShowAddTask] = useState(false)

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'tasks'),
            snapshot => {
                const nextTasks = snapshot.docs.map(document => ({
                    id: document.id,
                    ...document.data()
                }))

                setTasks(nextTasks)
                setTasksLoading(false)
                setTasksError('')
            },
            error => {
                console.error('Task listener failed:', error)
                setTasksError('Unable to load tasks from Firestore.')
                setTasksLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    const activeTasks = tasks.filter(task => task.active === true)



    const available = activeTasks.filter(
        task => task.status === 'available'
    ).length

    const inProgress = activeTasks.filter(
        task => task.status === 'in-progress'
    ).length

    const completed = activeTasks.filter(
        task => task.status === 'completed'
    ).length

    const filteredTasks = activeTasks.filter(
        task => taskFilter === 'all' || task.status === taskFilter
    )

    async function handleSignOut() {
        try {
            await signOut(auth)
        } catch (error) {
            console.error('Sign out failed:', error)
        }
    }

    return (
        <div className="stewardz-app">
            <aside className={`stewardz-sidebar ${menuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <span>SUNBREWED HOMESTEAD</span>
                    <h1>LAND<br />STEWARDZ!</h1>
                    <p>GET DIRTY. DO GOOD.</p>
                </div>

                <nav aria-label="Main navigation">
                    {navigation.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            className={`nav-link ${activePage === label ? 'active' : ''
                                }`}
                            onClick={() => {
                                setActivePage(label)
                                setMenuOpen(false)
                            }}
                        >
                            <Icon size={19} />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <span>CREW MEMBER</span>
                    <strong>{profile.displayName || 'Steward'}</strong>
                    <small>{profile.role.toUpperCase()}</small>

                    <button onClick={handleSignOut} className="signout-button">
                        <LogOut size={17} />
                        Sign out
                    </button>
                </div>
            </aside>

            {menuOpen && (
                <button
                    className="sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <main className="stewardz-main">
                <header className="dashboard-topbar">
                    <button
                        className="mobile-menu-button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen ? <X /> : <Menu />}
                    </button>

                    <div>
                        <span className="dashboard-eyebrow">
                            THE HOMESTEAD CONTROL ROOM
                        </span>
                        <h2>{activePage.toUpperCase()}</h2>
                    </div>

                    <span className="role-tag">EXECUTIVE ACCESS</span>
                </header>

                {activePage === 'Dashboard' ? (
                    <>
                        <section className="dashboard-welcome">
                            <span>WELCOME BACK, STEWARD!</span>
                            <h3>GOOD THINGS GROW WHEN WE WORK TOGETHER.</h3>
                            <p>
                                Here's what's happening around the homestead.
                            </p>
                        </section>



                        <section className="dashboard-stats">
                            <StatCard
                                label="TOTAL TASKS"
                                value={activeTasks.length}
                                color="yellow"
                                icon={ClipboardList}
                                active={taskFilter === 'all'}
                                onClick={() => setTaskFilter('all')}
                            />

                            <StatCard
                                label="AVAILABLE"
                                value={available}
                                color="teal"
                                icon={Sprout}
                                active={taskFilter === 'available'}
                                onClick={() => setTaskFilter('available')}
                            />

                            <StatCard
                                label="IN PROGRESS"
                                value={inProgress}
                                color="orange"
                                icon={History}
                                active={taskFilter === 'in-progress'}
                                onClick={() => setTaskFilter('in-progress')}
                            />

                            <StatCard
                                label="COMPLETED"
                                value={completed}
                                color="green"
                                icon={Egg}
                                active={taskFilter === 'completed'}
                                onClick={() => setTaskFilter('completed')}
                            />
                        </section>



                        <section className="tasks-panel">
                            <div className="panel-heading">
                                <div>
                                    <span>THE DAILY GRIND</span>
                                    <h3>
                                        {taskFilter === 'all'
                                            ? "TODAY'S TASK BOARD"
                                            : `${taskFilter.replace('-', ' ').toUpperCase()} TASKS`}
                                    </h3>
                                </div>

                                <button
                                    className="add-task-button"
                                    onClick={() => setShowAddTask(true)}
                                >
                                    <Plus size={18} />
                                    MANAGE TASKS
                                </button>
                                {showAddTask && (
                                    <AddTaskModal onClose={() => setShowAddTask(false)} />
                                )}
                            </div>


                            {tasksLoading && <p>Loading homestead tasks...</p>}

                            {tasksError && (
                                <p role="alert">{tasksError}</p>
                            )}

                            {!tasksLoading && !tasksError && filteredTasks.length === 0 && (
                                <p>
                                    {taskFilter === 'all'
                                        ? 'No tasks yet. Create the first mission!'
                                        : 'No tasks match this status.'}
                                </p>
                            )}


                            <div className="task-list">
                                {filteredTasks.map(task => {
                                    const { Icon, color } = getTaskAppearance(task.category)

                                    return (
                                        <article className="task-row" key={task.id}>
                                            <div className={`task-icon ${color}`}>                                                <Icon size={23} />
                                            </div>

                                            <div className="task-info">
                                                <h4>{task.title}</h4>
                                                <p>
                                                    {task.category}
                                                    {task.assignedTo &&
                                                        ` · ${task.assignedTo}`}
                                                </p>
                                            </div>

                                            <span className={`task-status ${task.status}`}>
                                                {task.status.replace('-', ' ')}
                                            </span>
                                        </article>
                                    )
                                })}
                            </div>
                        </section>
                    </>
                ) : activePage === 'Tasks' ? (
                    <TasksPage
                        tasks={tasks}
                        onAddTask={() => setShowAddTask(true)}
                    />
                ) : (
                    <section className="placeholder-panel">
                        <h3>{activePage.toUpperCase()}</h3>
                        <p>This section is coming next.</p>
                    </section>
                )}
            </main>
        </div>
    )
}


function StatCard({
    label,
    value,
    color,
    icon: Icon,
    active,
    onClick
}) {
    return (
        <button
            type="button"
            className={`stat-card ${color} ${active ? 'selected' : ''}`}
            onClick={onClick}
            aria-pressed={active}
            aria-label={`Show ${label.toLowerCase()} tasks`}
        >
            <Icon size={24} strokeWidth={2.5} />
            <strong>{String(value).padStart(2, '0')}</strong>
            <span>{label}</span>
        </button>
    )
}


function getTaskAppearance(category) {
    switch (category) {
        case 'Watering':
            return { Icon: Droplets, color: 'teal' }
        case 'Animal Care':
            return { Icon: Egg, color: 'orange' }
        case 'Composting':
            return { Icon: Sprout, color: 'purple' }
        case 'Gardening':
            return { Icon: Sprout, color: 'green' }
        default:
            return { Icon: ClipboardList, color: 'teal' }
    }
}

