const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = './uploads';
const NOTE_LIFETIME = 10 * 60 * 1000; // 10 minutes
const MAX_BUBBLES = 20; // Maximum number of bubbles allowed

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// In-memory storage for voice notes
let voiceNotes = new Map();
let activeTimers = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve static files from current directory for development
app.use(express.static(__dirname));

// Configure multer for audio file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const noteId = uuidv4();
        cb(null, `${noteId}.wav`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload audio endpoint
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const noteId = path.parse(req.file.filename).name;
        const createdAt = new Date();
        const colorIndex = Math.floor(Math.random() * 8) + 1;

        const voiceNote = {
            id: noteId,
            filename: req.file.filename,
            filePath: req.file.path,
            createdAt: createdAt,
            colorIndex: colorIndex,
            responses: []
        };

        // Check if we need to remove oldest bubble to maintain limit
        if (voiceNotes.size >= MAX_BUBBLES) {
            removeOldestBubble();
        }

        // Store in memory
        voiceNotes.set(noteId, voiceNote);

        // Set cleanup timer
        const timer = setTimeout(() => {
            deleteVoiceNote(noteId);
        }, NOTE_LIFETIME);
        
        activeTimers.set(noteId, timer);

        // Broadcast new note to all connected clients
        io.emit('new-voice-note', {
            id: noteId,
            createdAt: createdAt,
            colorIndex: colorIndex,
            audioUrl: `/api/audio/${noteId}`
        });

        res.json({
            success: true,
            noteId: noteId,
            audioUrl: `/api/audio/${noteId}`,
            createdAt: createdAt,
            colorIndex: colorIndex
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve audio files
app.get('/api/audio/:noteId', (req, res) => {
    const noteId = req.params.noteId;
    const note = voiceNotes.get(noteId);
    
    if (!note || !fs.existsSync(note.filePath)) {
        return res.status(404).json({ error: 'Audio not found' });
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.sendFile(path.resolve(note.filePath));
});

// Get all current voice notes
app.get('/api/voice-notes', (req, res) => {
    const notes = Array.from(voiceNotes.values()).map(note => ({
        id: note.id,
        createdAt: note.createdAt,
        colorIndex: note.colorIndex,
        audioUrl: `/api/audio/${note.id}`,
        responses: note.responses
    }));
    
    res.json(notes);
});

// Add response to a voice note
app.post('/api/voice-notes/:noteId/respond', upload.single('audio'), (req, res) => {
    try {
        const noteId = req.params.noteId;
        const parentNote = voiceNotes.get(noteId);
        
        if (!parentNote) {
            return res.status(404).json({ error: 'Parent note not found' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const responseId = path.parse(req.file.filename).name;
        const response = {
            id: responseId,
            filename: req.file.filename,
            filePath: req.file.path,
            createdAt: new Date(),
            audioUrl: `/api/audio/${responseId}`
        };

        parentNote.responses.push(response);

        // Broadcast new response to all clients
        io.emit('new-response', {
            parentNoteId: noteId,
            response: response
        });

        res.json({
            success: true,
            responseId: responseId,
            audioUrl: response.audioUrl
        });

    } catch (error) {
        console.error('Response upload error:', error);
        res.status(500).json({ error: 'Response upload failed' });
    }
});

// Function to delete voice note and cleanup
function deleteVoiceNote(noteId) {
    const note = voiceNotes.get(noteId);
    if (!note) return;

    // Delete main audio file
    if (fs.existsSync(note.filePath)) {
        fs.unlinkSync(note.filePath);
    }

    // Delete response audio files
    note.responses.forEach(response => {
        if (fs.existsSync(response.filePath)) {
            fs.unlinkSync(response.filePath);
        }
    });

    // Clear timer
    const timer = activeTimers.get(noteId);
    if (timer) {
        clearTimeout(timer);
        activeTimers.delete(noteId);
    }

    // Remove from memory
    voiceNotes.delete(noteId);

    // Broadcast deletion to all clients
    io.emit('note-deleted', { noteId });
    
    console.log(`Voice note ${noteId} deleted`);
}

// Function to remove oldest bubble when limit is reached
function removeOldestBubble() {
    if (voiceNotes.size === 0) return;

    // Find the oldest note by creation time
    let oldestNote = null;
    let oldestTime = Date.now();

    for (const [id, note] of voiceNotes.entries()) {
        if (note.createdAt.getTime() < oldestTime) {
            oldestTime = note.createdAt.getTime();
            oldestNote = { id, note };
        }
    }

    if (oldestNote) {
        console.log(`🗑️ Removing oldest bubble ${oldestNote.id} to maintain ${MAX_BUBBLES} bubble limit`);
        deleteVoiceNote(oldestNote.id);
    }
}

// WebSocket connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send current voice notes to new client
    const currentNotes = Array.from(voiceNotes.values()).map(note => ({
        id: note.id,
        createdAt: note.createdAt,
        colorIndex: note.colorIndex,
        audioUrl: `/api/audio/${note.id}`,
        responses: note.responses
    }));
    
    socket.emit('current-notes', currentNotes);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Cleanup on server shutdown
process.on('SIGTERM', () => {
    console.log('Server shutting down, cleaning up...');
    
    // Clear all timers
    activeTimers.forEach(timer => clearTimeout(timer));
    
    // Delete all audio files
    voiceNotes.forEach(note => {
        if (fs.existsSync(note.filePath)) {
            fs.unlinkSync(note.filePath);
        }
        note.responses.forEach(response => {
            if (fs.existsSync(response.filePath)) {
                fs.unlinkSync(response.filePath);
            }
        });
    });
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`🎤 Voice Mural server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready for real-time communication`);
});