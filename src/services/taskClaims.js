
import {
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase'

export async function claimTask(taskId) {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Please sign in before claiming a mission.')
  }

  const taskRef = doc(db, 'tasks', taskId)

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(taskRef)

    if (!snapshot.exists()) {
      throw new Error('This mission no longer exists.')
    }

    const task = snapshot.data()

    if (task.active !== true) {
      throw new Error('This mission is no longer active.')
    }

    if (task.status !== 'available' || task.assignedTo) {
      throw new Error('Someone has already claimed this mission.')
    }

    transaction.update(taskRef, {
      status: 'in-progress',
      assignedTo: user.uid,
      claimedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
}
