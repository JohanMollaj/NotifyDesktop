// db-handler.js
const { db } = require('./firebaseConfig');
const { 
    collection, doc, addDoc, getDocs, 
    query, where, orderBy, deleteDoc, updateDoc 
} = require('firebase/firestore');

// Save a task to the database
async function saveTask(userId, task) {
    try {
        // Create a reference to the user's tasks collection
        const tasksRef = collection(db, 'users', userId, 'tasks');
        
        // Add the task to Firestore
        const docRef = await addDoc(tasksRef, task);
        
        // Return the task with the new ID
        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        console.error("Error saving task:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Load all tasks for a user
async function loadTasks(userId) {
    try {
        // Create a reference to the user's tasks collection
        const tasksRef = collection(db, 'users', userId, 'tasks');
        
        // Create a query ordered by creation date
        const q = query(tasksRef, orderBy('createdAt', 'desc'));
        
        // Get the documents
        const querySnapshot = await getDocs(q);
        
        // Convert to an array of tasks
        const tasks = [];
        querySnapshot.forEach(doc => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return {
            success: true,
            tasks: tasks
        };
    } catch (error) {
        console.error("Error loading tasks:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Delete a task
async function deleteTask(userId, taskId) {
    try {
        await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Update a task
async function updateTask(userId, taskId, taskData) {
    try {
        await updateDoc(doc(db, 'users', userId, 'tasks', taskId), taskData);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Save a note to the database
async function saveNote(userId, note) {
    try {
        // Create a reference to the user's notes collection
        const notesRef = collection(db, 'users', userId, 'notes');
        
        // Add the note to Firestore
        const docRef = await addDoc(notesRef, note);
        
        // Return the note with the new ID
        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        console.error("Error saving note:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Load all notes for a user
async function loadNotes(userId) {
    try {
        // Create a reference to the user's notes collection
        const notesRef = collection(db, 'users', userId, 'notes');
        
        // Create a query ordered by creation date
        const q = query(notesRef, orderBy('createdAt', 'desc'));
        
        // Get the documents
        const querySnapshot = await getDocs(q);
        
        // Convert to an array of notes
        const notes = [];
        querySnapshot.forEach(doc => {
            notes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return {
            success: true,
            notes: notes
        };
    } catch (error) {
        console.error("Error loading notes:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Delete a note
async function deleteNote(userId, noteId) {
    try {
        await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Update a note
async function updateNote(userId, noteId, noteData) {
    try {
        await updateDoc(doc(db, 'users', userId, 'notes', noteId), noteData);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    saveTask,
    loadTasks,
    deleteTask,
    updateTask,
    saveNote,
    loadNotes,
    deleteNote,
    updateNote
};