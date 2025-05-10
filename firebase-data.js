// firebase-data.js - Handles Firestore database operations
const { getFirestore, collection, addDoc, deleteDoc, doc, getDocs, 
    getDoc, updateDoc, setDoc, query, where, orderBy } = require('firebase/firestore');
const { db } = require('./firebaseConfig');

// Tasks Collection
async function addTask(userId, task) {
try {
    const docRef = await addDoc(collection(db, 'tasks'), {
        ...task,
        userId: userId,
        createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
} catch (error) {
    console.error('Add task error:', error);
    return { success: false, error: error.message };
}
}

async function updateTask(taskId, taskData) {
try {
    await updateDoc(doc(db, 'tasks', taskId), taskData);
    return { success: true };
} catch (error) {
    console.error('Update task error:', error);
    return { success: false, error: error.message };
}
}

async function toggleTaskStatus(taskId, completedStatus) {
try {
    await updateDoc(doc(db, 'tasks', taskId), {
        completed: completedStatus,
        completedAt: completedStatus ? new Date().toISOString() : null
    });
    return { success: true };
} catch (error) {
    console.error('Toggle task status error:', error);
    return { success: false, error: error.message };
}
}

async function deleteTask(taskId) {
try {
    await deleteDoc(doc(db, 'tasks', taskId));
    return { success: true };
} catch (error) {
    console.error('Delete task error:', error);
    return { success: false, error: error.message };
}
}

async function getUserTasks(userId) {
try {
    const q = query(
        collection(db, 'tasks'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const tasks = [];
    querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, tasks };
} catch (error) {
    console.error('Get tasks error:', error);
    return { success: false, error: error.message, tasks: [] };
}
}

async function getTaskById(taskId) {
try {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    
    if (taskDoc.exists()) {
        return { success: true, task: { id: taskDoc.id, ...taskDoc.data() } };
    } else {
        return { success: false, error: 'Task not found' };
    }
} catch (error) {
    console.error('Get task error:', error);
    return { success: false, error: error.message };
}
}

// Notes Collection
async function addNote(userId, note) {
try {
    const docRef = await addDoc(collection(db, 'notes'), {
        ...note,
        userId: userId,
        createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
} catch (error) {
    console.error('Add note error:', error);
    return { success: false, error: error.message };
}
}

async function updateNote(noteId, noteData) {
try {
    await updateDoc(doc(db, 'notes', noteId), noteData);
    return { success: true };
} catch (error) {
    console.error('Update note error:', error);
    return { success: false, error: error.message };
}
}

async function deleteNote(noteId) {
try {
    await deleteDoc(doc(db, 'notes', noteId));
    return { success: true };
} catch (error) {
    console.error('Delete note error:', error);
    return { success: false, error: error.message };
}
}

async function getUserNotes(userId) {
try {
    const q = query(
        collection(db, 'notes'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const notes = [];
    querySnapshot.forEach((doc) => {
        notes.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, notes };
} catch (error) {
    console.error('Get notes error:', error);
    return { success: false, error: error.message, notes: [] };
}
}

async function getNoteById(noteId) {
try {
    const noteDoc = await getDoc(doc(db, 'notes', noteId));
    
    if (noteDoc.exists()) {
        return { success: true, note: { id: noteDoc.id, ...noteDoc.data() } };
    } else {
        return { success: false, error: 'Note not found' };
    }
} catch (error) {
    console.error('Get note error:', error);
    return { success: false, error: error.message };
}
}

async function saveUserToDatabase(user) {
    try {
        // Check if user document already exists
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            // Update the existing user document
            await updateDoc(userRef, {
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                lastLogin: new Date().toISOString()
            });
        } else {
            // Create a new user document
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('Save user error:', error);
        return { success: false, error: error.message };
    }
}

// Get user from database
async function getUserFromDatabase(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
            return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
        } else {
            return { success: false, error: 'User not found' };
        }
    } catch (error) {
        console.error('Get user error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
addTask,
updateTask,
toggleTaskStatus,
deleteTask,
getUserTasks,
getTaskById,
addNote,
updateNote,
deleteNote,
getUserNotes,
getNoteById,
saveUserToDatabase,
getUserFromDatabase
};