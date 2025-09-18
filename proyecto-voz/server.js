const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { connectDB, VoiceNote, startCleanupScheduler } = require('./database');

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

// Database replaces in-memory storage
// Note: voiceNotes Map and activeTimers are now handled by PostgreSQL

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve static files from parent directory (PACMAN root)
app.use(express.static(path.join(__dirname, '..')));

// Serve proyecto-voz files
app.use('/proyecto-voz', express.static(__dirname));

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
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/proyecto-voz', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload audio endpoint
app.post('/api/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        // Read audio file and convert to base64
        const audioBuffer = fs.readFileSync(req.file.path);
        const audioBase64 = audioBuffer.toString('base64');
        
        // Get client IP for analytics (anonymous)
        const clientIP = req.ip || req.connection.remoteAddress;
        
        // Create voice note in database
        const voiceNote = await VoiceNote.create({
            audioData: audioBase64,
            audioFormat: req.file.mimetype,
            ipAddress: clientIP.substring(0, 10) // Truncate IP for privacy
        });

        // Clean up uploaded file (no longer needed)
        fs.unlinkSync(req.file.path);

        // Broadcast new note to all connected clients
        io.emit('new-voice-note', {
            id: voiceNote.id,
            createdAt: voiceNote.createdAt,
            colorIndex: voiceNote.colorIndex,
            audioUrl: `/api/audio/${voiceNote.id}`
        });

        res.json({
            success: true,
            noteId: voiceNote.id,
            audioUrl: `/api/audio/${voiceNote.id}`,
            createdAt: voiceNote.createdAt,
            colorIndex: voiceNote.colorIndex
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Serve audio files
app.get('/api/audio/:noteId', async (req, res) => {
    try {
        const noteId = req.params.noteId;
        const note = await VoiceNote.findByPk(noteId);
        
        if (!note) {
            return res.status(404).json({ error: 'Audio not found' });
        }

        // Check if note has expired
        if (note.expiresAt < new Date()) {
            // Clean up expired note
            await note.destroy();
            return res.status(404).json({ error: 'Audio expired' });
        }

        // Convert base64 back to buffer
        const audioBuffer = Buffer.from(note.audioData, 'base64');
        
        // Set appropriate headers
        res.setHeader('Content-Type', note.audioFormat || 'audio/webm');
        res.setHeader('Content-Length', audioBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
        
        res.send(audioBuffer);
        
    } catch (error) {
        console.error('Error serving audio:', error);
        res.status(500).json({ error: 'Error serving audio' });
    }
});

// Get all current voice notes
app.get('/api/voice-notes', async (req, res) => {
    try {
        const notes = await VoiceNote.findAll({
            where: {
                expiresAt: {
                    [require('sequelize').Op.gt]: new Date() // Only non-expired notes
                }
            },
            order: [['createdAt', 'DESC']], // Newest first
            limit: 20 // Enforce limit
        });
        
        const formattedNotes = notes.map(note => ({
            id: note.id,
            createdAt: note.createdAt,
            colorIndex: note.colorIndex,
            audioUrl: `/api/audio/${note.id}`
        }));
        
        res.json(formattedNotes);
        
    } catch (error) {
        console.error('Error fetching voice notes:', error);
        res.status(500).json({ error: 'Error fetching voice notes' });
    }
});

// Database handles cleanup automatically through scheduled tasks
// No manual deletion functions needed

// WebSocket connections
io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);

    try {
        // Send current voice notes to new client
        const currentNotes = await VoiceNote.findAll({
            where: {
                expiresAt: {
                    [require('sequelize').Op.gt]: new Date()
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        
        const formattedNotes = currentNotes.map(note => ({
            id: note.id,
            createdAt: note.createdAt,
            colorIndex: note.colorIndex,
            audioUrl: `/api/audio/${note.id}`
        }));
        
        socket.emit('current-notes', formattedNotes);
        
    } catch (error) {
        console.error('Error sending current notes to new client:', error);
        socket.emit('current-notes', []);
    }

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Cleanup on server shutdown
process.on('SIGTERM', () => {
    console.log('Server shutting down, cleaning up...');
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Connect to database
        const dbConnected = await connectDB();
        
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        
        // Start cleanup scheduler
        startCleanupScheduler();
        
        // Start HTTP server
        server.listen(PORT, () => {
            console.log(`🎤 Voice Mural server running on port ${PORT}`);
            console.log(`📡 WebSocket server ready for real-time communication`);
            console.log(`🗄️ PostgreSQL database connected and ready`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();